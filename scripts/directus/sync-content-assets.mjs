import { readFile } from "node:fs/promises";
import { defaultDirectusUrl } from "./local-development.mjs";

const localEnv = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const env = { ...localEnv, ...process.env };
const baseUrl = env.DIRECTUS_URL ?? defaultDirectusUrl;
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) });
const loginBody = await login.json();
if (!login.ok) throw new Error(loginBody.errors?.[0]?.message ?? "Directus login failed.");

const headers = { authorization: `Bearer ${loginBody.data.access_token}`, "content-type": "application/json" };
const request = async (path, method = "GET", body) => {
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = response.status === 204 ? {} : await response.json();
  if (!response.ok) throw new Error(json.errors?.[0]?.message ?? `${method} ${path} failed.`);
  return json.data;
};
const idsFromHtml = (html) => [...(html ?? "").matchAll(/assets\/([0-9a-f-]{36})/gi)].map((match) => match[1]);

const collections = ["stories", "bulletins", "news_items"];
const content = await Promise.all(collections.map((collection) => request(`/items/${collection}?filter[status][_eq]=published&fields=body&limit=-1`)));
const referencedIds = new Set(content.flat().flatMap((item) => idsFromHtml(item.body)));
const assets = await request("/items/content_assets?fields=file&limit=-1");
const registeredIds = new Set(assets.map((asset) => asset.file));
const missingIds = [...referencedIds].filter((id) => !registeredIds.has(id));
if (missingIds.length) await request("/items/content_assets", "POST", missingIds.map((file) => ({ file, status: "published" })));

console.log(`Content assets synchronized: ${missingIds.length} added, ${referencedIds.size} referenced.`);
