import { readFile } from "node:fs/promises";

const env = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const baseUrl = env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) });
const { data: session } = await login.json();
if (!session) throw new Error("Directus login failed.");
const headers = { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" };
const response = await fetch(`${baseUrl}/items/site_settings?fields=denomination_name,denomination_detail,church_history,denomination_history`, { headers });
const { data: settings } = await response.json();
if (!response.ok) throw new Error("Church information request failed.");

if (!settings.denomination_history?.trim()) {
  const parts = [
    settings.denomination_name && `<h3>소속 교단·노회</h3><p>${settings.denomination_name}</p>`,
    settings.denomination_detail,
    settings.church_history && `<h3>글로벌교회 연혁</h3>${settings.church_history}`,
  ].filter(Boolean);
  const update = await fetch(`${baseUrl}/items/site_settings`, { method: "PATCH", headers, body: JSON.stringify({ denomination_history: parts.join("\n") }) });
  if (!update.ok) throw new Error((await update.text()) || "Denomination history migration failed.");
}

console.log("Denomination and history content migrated.");
