import { readFile } from "node:fs/promises";

const env = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const baseUrl = env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) });
const { data: session } = await login.json();
if (!session) throw new Error("Directus login failed.");
const headers = { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" };
const request = async (path, method = "GET", body) => {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
      const json = await response.json();
      if (!response.ok) throw new Error(json.errors?.[0]?.message ?? `${method} ${path} failed.`);
      return json.data;
    } catch (error) {
      if (attempt === 11) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
};

const requiredRelations = [
  ["story_media", "file", "story_media_files"],
  ["bulletin_media", "file", "bulletin_media_files"],
  ["stories", "cover_image", "story_cover_files"],
  ["bulletins", "document_file", "bulletin_document_files"],
  ["sermons", "video_file", "sermon_video_files"],
  ["church_ministers", "photo", "minister_photo_files"],
];
const relations = await request("/relations");
for (const [collection, field, alias] of requiredRelations) {
  const relation = relations.find((item) => item.collection === collection && item.field === field);
  if (relation?.meta?.one_field !== alias) {
    throw new Error(`${collection}.${field} must use the ${alias} reverse field before applying the public file policy.`);
  }
}

const policies = await request("/policies");
const publicPolicy = policies.find((policy) => policy.name === "$t:public_label");
if (!publicPolicy) throw new Error("Directus public policy was not found.");
const publishedFileFilter = {
  _or: [
    { story_media_files: { _some: { story: { status: { _eq: "published" } } } } },
    { bulletin_media_files: { _some: { bulletin: { status: { _eq: "published" } } } } },
    { story_cover_files: { _some: { status: { _eq: "published" } } } },
    { bulletin_document_files: { _some: { status: { _eq: "published" } } } },
    { sermon_video_files: { _some: { status: { _eq: "published" } } } },
    { minister_photo_files: { _some: { status: { _eq: "published" } } } },
  ],
};
const permissions = await request("/permissions");
const existing = permissions.find((permission) => permission.policy === publicPolicy.id && permission.collection === "directus_files" && permission.action === "read");
const body = { fields: ["id", "type", "filename_download", "title", "width", "height"], permissions: publishedFileFilter };
if (existing) await request(`/permissions/${existing.id}`, "PATCH", body);
else await request("/permissions", "POST", { collection: "directus_files", action: "read", policy: publicPolicy.id, ...body });

console.log("Published-content file read policy applied.");
