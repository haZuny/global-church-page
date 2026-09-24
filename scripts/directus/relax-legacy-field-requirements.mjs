import { readFile } from "node:fs/promises";

const env = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const baseUrl = env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) });
const { data: session } = await login.json();
if (!session) throw new Error("Directus login failed.");
const headers = { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" };
const contentCollections = ["site_settings", "worship_services", "stories", "story_media", "sermons", "bulletins", "bulletin_media", "news_items"];
for (const collection of contentCollections) {
  const fields = await fetch(`${baseUrl}/fields/${collection}`, { headers }).then((response) => response.json()).then((body) => body.data);
  for (const field of fields.filter((item) => item.field !== "id" && item.meta?.hidden && (item.meta?.required || item.schema?.is_nullable === false))) {
    const response = await fetch(`${baseUrl}/fields/${collection}/${field.field}`, { method: "PATCH", headers, body: JSON.stringify({ meta: { ...field.meta, required: false, hidden: true }, schema: { ...field.schema, is_nullable: true } }) });
    if (!response.ok) throw new Error(await response.text());
  }
}
console.log("Legacy hidden fields are optional.");
