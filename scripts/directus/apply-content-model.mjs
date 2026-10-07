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
  site_settings: [["church_name", "string", true], ["english_name", "string", false], ["hero_title", "text", false], ["hero_copy", "text", false], ["introduction", "text", true], ["greeting_title", "text", false], ["greeting_lead", "text", false], ["greeting_body", "text", false], ["pastor_name", "string", false], ["pastor_role", "string", false], ["pastor_photo", "uuid", false], ["about_title", "text", false], ["denomination_history", "text", false], ["address", "text", true], ["map_url", "string", false], ["phone", "string", false], ["transit_info", "text", false], ["parking_info", "text", false], ["show_sermons", "boolean", false]],
  church_ministers: [["site_settings", "integer", true], ["name", "string", true], ["role", "string", true], ["description", "text", false], ["photo", "uuid", false], ["sort", "integer", true], ["status", "string", true]],
  stories: [["title", "string", true], ["category", "string", true], ["body", "text", true], ["published_at", "timestamp", false], ["status", "string", true]],
  content_assets: [["file", "uuid", true], ["status", "string", true]],
  sermons: [["title", "string", true], ["summary", "text", true], ["scripture", "string", true], ["preacher", "string", true], ["sermon_date", "date", true], ["video_file", "uuid", false], ["status", "string", true]],
  bulletins: [["title", "string", true], ["category", "string", true], ["body", "text", false], ["published_at", "timestamp", false], ["is_pinned", "boolean", false], ["status", "string", true]],
  bulletin_media: [["bulletin", "integer", true], ["file", "uuid", true], ["sort", "integer", true]],
  news_items: [["title", "string", true], ["body", "text", false], ["published_at", "timestamp", false], ["is_pinned", "boolean", false], ["status", "string", true]],
};

for (const [collection, collectionFields] of Object.entries(fields)) {
  const collections = await request("/collections", "GET");
  const existing = collections.find((item) => item.collection === collection);
  if (!existing) await request("/collections", "POST", { collection, meta: { singleton: collection === "site_settings", accountability: "all" }, schema: { name: collection } });
  const existingFields = await request(`/fields/${collection}`, "GET");
  for (const [field, type, required] of collectionFields) {
    const existingField = existingFields.find((item) => item.field === field);
    if (!existingField) await request(`/fields/${collection}`, "POST", { field, type, meta: { interface: type === "text" ? "input-multiline" : type === "uuid" ? "file-image" : type === "boolean" ? "boolean" : "input", special: type === "uuid" ? ["file"] : type === "json" ? ["cast-json"] : undefined, required }, schema: { name: field, data_type: type === "integer" ? "integer" : type === "json" ? "json" : type === "timestamp" ? "datetime" : type === "uuid" ? "char" : type, max_length: type === "uuid" ? 36 : undefined, default_value: type === "boolean" ? false : undefined, is_nullable: !required } });
  }
}

console.log("Directus content model applied.");
