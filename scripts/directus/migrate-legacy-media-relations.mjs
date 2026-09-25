import { readFile } from "node:fs/promises";

const env = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const baseUrl = env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) });
const { data: session } = await login.json();
if (!session) throw new Error("Directus login failed.");
const headers = { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" };
const request = async (path, method = "GET", body) => {
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await response.json();
  if (!response.ok) throw new Error(json.errors?.[0]?.message ?? `${method} ${path} failed.`);
  return json.data;
};

const [stories, storyMedia, bulletins, bulletinMedia] = await Promise.all([
  request("/items/stories?limit=-1&fields=id,cover_image"),
  request("/items/story_media?limit=-1&fields=story,file,sort"),
  request("/items/bulletins?limit=-1&fields=id,document_file"),
  request("/items/bulletin_media?limit=-1&fields=bulletin,file,sort"),
]);

let migratedStories = 0;
for (const story of stories) {
  if (!story.cover_image || storyMedia.some((item) => item.story === story.id && item.file === story.cover_image)) continue;
  await request("/items/story_media", "POST", { story: story.id, file: story.cover_image, sort: 0 });
  migratedStories += 1;
}

let migratedBulletins = 0;
for (const bulletin of bulletins) {
  if (!bulletin.document_file || bulletinMedia.some((item) => item.bulletin === bulletin.id && item.file === bulletin.document_file)) continue;
  await request("/items/bulletin_media", "POST", { bulletin: bulletin.id, file: bulletin.document_file, sort: 0 });
  migratedBulletins += 1;
}

console.log(`Migrated ${migratedStories} story images and ${migratedBulletins} bulletin files into relation collections.`);
