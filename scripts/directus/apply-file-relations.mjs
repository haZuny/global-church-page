import { readFile } from "node:fs/promises";

const env = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const baseUrl = env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) });
const { data: session } = await login.json();
if (!session) throw new Error("Directus login failed.");
const headers = { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" };
const existing = await fetch(`${baseUrl}/relations`, { headers }).then((response) => response.json()).then((body) => body.data);
for (const [collection, field] of [["stories", "cover_image"], ["bulletins", "document_file"], ["sermons", "video_file"]]) {
  if (existing.some((relation) => relation.collection === collection && relation.field === field)) continue;
  const response = await fetch(`${baseUrl}/relations`, { method: "POST", headers, body: JSON.stringify({ collection, field, related_collection: "directus_files", meta: { many_collection: collection, many_field: field, one_collection: "directus_files", one_field: null, one_deselect_action: "nullify" }, schema: { table: collection, column: field, foreign_key_table: "directus_files", foreign_key_column: "id", on_delete: "SET NULL", on_update: "NO ACTION" } }) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.errors?.[0]?.message ?? "File relation creation failed.");
}
console.log("Directus file relations applied.");
