import { readFile } from "node:fs/promises";

const env = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const baseUrl = env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) });
const { data: session } = await login.json();
if (!session) throw new Error("Directus login failed.");
const headers = { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" };
const response = await fetch(`${baseUrl}/items/worship_services?limit=-1`, { headers });
const { data: services } = await response.json();
if (!response.ok) throw new Error("Could not read worship services.");

for (const service of services) {
  if (Array.isArray(service.weekdays) && service.weekdays.length > 0) continue;
  const weekdays = service.weekday ? [service.weekday] : [];
  const update = await fetch(`${baseUrl}/items/worship_services/${service.id}`, { method: "PATCH", headers, body: JSON.stringify({ weekdays }) });
  if (!update.ok) throw new Error(`Could not migrate worship service ${service.id}.`);
}

console.log("Worship weekdays migrated.");
