import { readFile } from "node:fs/promises";

if (process.env.REMOVE_SAMPLE_CONTENT !== "1") throw new Error("Set REMOVE_SAMPLE_CONTENT=1 to remove sample content.");

const env = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const baseUrl = env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) });
const { data: session } = await login.json();
if (!session) throw new Error("Directus login failed.");

const headers = { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" };
const request = async (path, method = "GET", body) => {
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = response.status === 204 ? {} : await response.json();
  if (!response.ok) throw new Error(json.errors?.[0]?.message ?? `${method} ${path} failed.`);
  return json.data;
};

const samplePrefix = "[샘플]";
const collections = ["stories", "bulletins", "news_items", "sermons"];
const samples = Object.fromEntries(await Promise.all(collections.map(async (collection) => [collection, await request(`/items/${collection}?filter[title][_starts_with]=${encodeURIComponent(samplePrefix)}&limit=-1&fields=id`)])));
const storyIds = samples.stories.map((item) => item.id);
const bulletinIds = samples.bulletins.map((item) => item.id);
if (storyIds.length) await request(`/items/story_media?filter[story][_in]=${storyIds.join(",")}&limit=-1&fields=id`, "GET").then((items) => items.length && request("/items/story_media", "DELETE", items.map((item) => item.id)));
if (bulletinIds.length) await request(`/items/bulletin_media?filter[bulletin][_in]=${bulletinIds.join(",")}&limit=-1&fields=id`, "GET").then((items) => items.length && request("/items/bulletin_media", "DELETE", items.map((item) => item.id)));
for (const collection of collections) if (samples[collection].length) await request(`/items/${collection}`, "DELETE", samples[collection].map((item) => item.id));

const files = await request("/files?filter[filename_download][_starts_with]=sample-community-&limit=-1&fields=id");
if (files.length) await request("/files", "DELETE", files.map((file) => file.id));
console.log("Sample list content removed.");
