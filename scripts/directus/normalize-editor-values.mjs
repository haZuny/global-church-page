import { readFile } from "node:fs/promises";

const env = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const baseUrl = env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) });
const { data: session } = await login.json();
if (!session) throw new Error("Directus login failed.");
const headers = { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" };
const storyCategories = { "지유쓰 · 청년부": "다음 세대", "청년대학부": "공동체", "셀 공동체": "공동체" };
for (const [before, after] of Object.entries(storyCategories)) {
  const response = await fetch(`${baseUrl}/items/stories?filter[category][_eq]=${encodeURIComponent(before)}&fields=id&limit=-1`, { headers });
  const { data: items } = await response.json();
  await Promise.all(items.map((item) => fetch(`${baseUrl}/items/stories/${item.id}`, { method: "PATCH", headers, body: JSON.stringify({ category: after }) })));
}
console.log("Existing editor values normalized.");
