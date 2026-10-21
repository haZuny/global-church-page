import { readFile } from "node:fs/promises";
import { defaultDirectusUrl } from "./local-development.mjs";
import { synchronizeContentAssets } from "./content-assets.mjs";
import { installContentAssetsFlow } from "./content-assets-flow.mjs";

let localEnv = {};
try {
  localEnv = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}
const env = { ...localEnv, ...process.env };
const baseUrl = env.DIRECTUS_URL ?? defaultDirectusUrl;
if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
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
const origins = [...new Set([baseUrl, env.DIRECTUS_ASSETS_URL, env.PUBLIC_URL].filter(Boolean).map((url) => new URL(url).origin.toLowerCase()))];
await installContentAssetsFlow(request, origins);
const result = await synchronizeContentAssets(request, origins);
console.log(`본문 파일 자동 공개 설정 완료: ${result.created}개 등록, ${result.updated}개 상태 갱신.`);
