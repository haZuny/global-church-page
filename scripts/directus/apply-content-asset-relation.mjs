import { readFile } from "node:fs/promises";

const localEnv = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const env = { ...localEnv, ...process.env };
const baseUrl = env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) });
const { data: session } = await login.json();
if (!session) throw new Error("Directus login failed.");
const request = async (path, method = "GET", body) => { const response = await fetch(`${baseUrl}${path}`, { method, headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); const json = await response.json(); if (!response.ok) throw new Error(json.errors?.[0]?.message ?? `${method} ${path} failed.`); return json.data; };

const fileFields = await request("/fields/directus_files");
if (!fileFields.some((field) => field.field === "content_asset_files")) await request("/fields/directus_files", "POST", { field: "content_asset_files", type: "alias", meta: { special: ["o2m"], hidden: true, interface: "list-o2m", readonly: true }, schema: null });
const relations = await request("/relations");
if (!relations.some((relation) => relation.collection === "content_assets" && relation.field === "file")) await request("/relations", "POST", { collection: "content_assets", field: "file", related_collection: "directus_files", meta: { many_collection: "content_assets", many_field: "file", one_collection: "directus_files", one_field: "content_asset_files", one_deselect_action: "delete" }, schema: { table: "content_assets", column: "file", foreign_key_table: "directus_files", foreign_key_column: "id", on_delete: "CASCADE", on_update: "NO ACTION" } });
const collection = (await request("/collections")).find((item) => item.collection === "content_assets");
await request("/collections/content_assets", "PATCH", { meta: { ...collection.meta, hidden: true, note: "본문에 삽입된 공개 이미지의 파일 권한만 보존합니다." } });
console.log("Content asset file relation applied.");
