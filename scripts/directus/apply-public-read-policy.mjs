import { readFile } from "node:fs/promises";

const envFile = await readFile(new URL("../../.env", import.meta.url), "utf8");
const localEnv = Object.fromEntries(envFile.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const env = { ...localEnv, ...process.env };
const baseUrl = env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) });
const loginBody = await login.json();
if (!login.ok) throw new Error(loginBody.errors?.[0]?.message ?? "Directus login failed.");

const request = async (path, method = "GET", body) => {
  const response = await fetch(`${baseUrl}${path}`, { method, headers: { authorization: `Bearer ${loginBody.data.access_token}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const responseBody = await response.json();
  if (!response.ok) throw new Error(responseBody.errors?.[0]?.message ?? `${method} ${path} failed.`);
  return responseBody.data;
};

const policies = await request("/policies");
const publicPolicy = policies.find((policy) => policy.name === "$t:public_label");
if (!publicPolicy) throw new Error("Directus public policy was not found.");

const collections = ["worship_services", "stories", "sermons", "bulletins", "news_items"];
const permissions = await request("/permissions");
for (const collection of collections) {
  const existing = permissions.find((permission) => permission.policy === publicPolicy.id && permission.collection === collection && permission.action === "read");
  if (!existing) await request("/permissions", "POST", { collection, action: "read", fields: ["*"], permissions: { status: { _eq: "published" } }, policy: publicPolicy.id });
}

const storyMediaPermission = permissions.find((permission) => permission.policy === publicPolicy.id && permission.collection === "story_media" && permission.action === "read");
if (!storyMediaPermission) await request("/permissions", "POST", { collection: "story_media", action: "read", fields: ["*"], permissions: { story: { status: { _eq: "published" } } }, policy: publicPolicy.id });

console.log("Published-only public read policy applied.");
