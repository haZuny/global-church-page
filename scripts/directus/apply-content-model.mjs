import { readFile } from "node:fs/promises";

const envFile = await readFile(new URL("../../.env", import.meta.url), "utf8");
const localEnv = Object.fromEntries(envFile
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"))
  .map((line) => line.split(/=(.*)/s)));
const env = { ...localEnv, ...process.env };
const baseUrl = env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const email = env.ADMIN_EMAIL;
const password = env.ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
}

const login = await fetch(`${baseUrl}/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const loginBody = await login.json();
if (!login.ok) throw new Error(loginBody.errors?.[0]?.message ?? "Directus login failed.");

const request = async (path, method, body) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${loginBody.data.access_token}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 404 && method === "GET") return undefined;
  const responseBody = await response.json();
  if (!response.ok) throw new Error(responseBody.errors?.[0]?.message ?? `${method} ${path} failed.`);
  return responseBody.data;
};

const fields = {
  site_settings: [["church_name", "string", true], ["introduction", "text", true], ["address", "text", true], ["map_url", "string", false], ["phone", "string", false], ["visit_notice", "text", false]],
  worship_services: [["name", "string", true], ["audience", "string", true], ["weekday", "string", true], ["start_time", "time", true], ["location", "string", true], ["description", "text", false], ["sort", "integer", true], ["status", "string", true]],
  stories: [["slug", "string", true], ["title", "string", true], ["subtitle", "text", true], ["summary", "text", true], ["category", "string", true], ["body", "json", true], ["cover_image_url", "string", true], ["cover_image", "uuid", false], ["cover_image_width", "integer", true], ["cover_image_height", "integer", true], ["cover_alt", "string", true], ["published_at", "timestamp", false], ["status", "string", true]],
  story_media: [["story", "integer", true], ["file", "string", true], ["alt", "string", true], ["caption", "string", false], ["sort", "integer", true]],
  sermons: [["slug", "string", true], ["title", "string", true], ["summary", "text", true], ["scripture", "string", true], ["preacher", "string", true], ["sermon_date", "date", true], ["video_url", "string", false], ["status", "string", true]],
  bulletins: [["slug", "string", true], ["title", "string", true], ["category", "string", true], ["summary", "text", true], ["document_image_url", "string", true], ["document_file", "uuid", false], ["document_image_width", "integer", true], ["document_image_height", "integer", true], ["document_alt", "string", true], ["published_at", "timestamp", false], ["status", "string", true]],
  news_items: [["slug", "string", true], ["type", "string", true], ["title", "string", true], ["summary", "text", true], ["body", "json", false], ["event_starts_at", "timestamp", false], ["event_ends_at", "timestamp", false], ["location", "string", false], ["published_at", "timestamp", false], ["status", "string", true]],
};

for (const [collection, collectionFields] of Object.entries(fields)) {
  const collections = await request("/collections", "GET");
  const existing = collections.find((item) => item.collection === collection);
  if (!existing) await request("/collections", "POST", { collection, meta: { singleton: collection === "site_settings", accountability: "all" }, schema: { name: collection } });
  const existingFields = await request(`/fields/${collection}`, "GET");
  for (const [field, type, required] of collectionFields) {
    const existingField = existingFields.find((item) => item.field === field);
    if (!existingField) await request(`/fields/${collection}`, "POST", { field, type, meta: { interface: type === "text" ? "input-multiline" : type === "uuid" ? "file-image" : "input", special: type === "uuid" ? ["file"] : undefined, required }, schema: { name: field, data_type: type === "integer" ? "integer" : type === "json" ? "json" : type === "timestamp" ? "datetime" : type === "uuid" ? "char" : type, max_length: type === "uuid" ? 36 : undefined, is_nullable: !required } });
  }
}

console.log("Directus content model applied.");
