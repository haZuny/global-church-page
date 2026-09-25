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
const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const textToHtml = (value) => String(value || "").split(/\n{2,}/).filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`).join("");
const legacyBlocksToHtml = (value) => {
  if (typeof value === "string") {
    try { return legacyBlocksToHtml(JSON.parse(value)); } catch { return /<\/?[a-z][\s\S]*>/i.test(value) ? value : textToHtml(value); }
  }
  if (!Array.isArray(value)) return "";
  return value.map((block) => block?.type === "quote" ? `<blockquote>${escapeHtml(block.text || "")}</blockquote>` : textToHtml(block?.text || "")).join("");
};

for (const collection of ["stories", "news_items"]) {
  const items = await request(`/items/${collection}?limit=-1&fields=id,body`);
  for (const item of items) await request(`/items/${collection}/${item.id}`, "PATCH", { body: legacyBlocksToHtml(item.body) });
  const fields = await request(`/fields/${collection}`);
  const body = fields.find((field) => field.field === "body");
  await request(`/fields/${collection}/body`, "PATCH", { type: "text", meta: { ...body.meta, interface: "input-rich-text-html", options: {} }, schema: { ...body.schema, data_type: "text" } });
}

const singleton = await request("/items/site_settings?fields=greeting_body,vision_intro,vision_one_body,vision_two_body,vision_three_body,denomination_detail");
await request("/items/site_settings", "PATCH", {
  greeting_body: legacyBlocksToHtml(singleton.greeting_body),
  vision_intro: legacyBlocksToHtml(singleton.vision_intro),
  vision_one_body: legacyBlocksToHtml(singleton.vision_one_body),
  vision_two_body: legacyBlocksToHtml(singleton.vision_two_body),
  vision_three_body: legacyBlocksToHtml(singleton.vision_three_body),
  denomination_detail: legacyBlocksToHtml(singleton.denomination_detail),
});
const bulletins = await request("/items/bulletins?limit=-1&fields=id,body");
for (const bulletin of bulletins) await request(`/items/bulletins/${bulletin.id}`, "PATCH", { body: legacyBlocksToHtml(bulletin.body) });

console.log("Rich-text content migrated.");
