import { readFile } from "node:fs/promises";

const localEnv = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const env = { ...localEnv, ...process.env };
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

const directusFileFields = await request("/fields/directus_files");
if (!directusFileFields.some((field) => field.field === "minister_photo_files")) {
  await request("/fields/directus_files", "POST", { field: "minister_photo_files", type: "alias", meta: { special: ["o2m"], hidden: true, interface: "list-o2m", readonly: true }, schema: null });
}
if (!directusFileFields.some((field) => field.field === "pastor_photo_files")) {
  await request("/fields/directus_files", "POST", { field: "pastor_photo_files", type: "alias", meta: { special: ["o2m"], hidden: true, interface: "list-o2m", readonly: true }, schema: null });
}

const settingsFields = await request("/fields/site_settings");
const ministersField = settingsFields.find((field) => field.field === "ministers");
const options = { layout: "list", template: "{{role}} · {{name}}", enableCreate: true, enableSelect: false, enableLink: false, sort: "sort", sortDirection: "+", filter: { role: { _neq: "담임목사" } } };
if (ministersField) {
  await request("/fields/site_settings/ministers", "PATCH", { meta: { ...ministersField.meta, special: ["o2m"], interface: "list-o2m", display: "related-values", options, translations: [{ language: "ko-KR", translation: "섬기는 이" }], note: "부교역자만 여러 명 추가합니다. 담임목사는 위의 담임목사 전용 항목에서 관리합니다." } });
} else {
  await request("/fields/site_settings", "POST", { field: "ministers", type: "alias", meta: { special: ["o2m"], interface: "list-o2m", display: "related-values", options, sort: 26, translations: [{ language: "ko-KR", translation: "섬기는 이" }], note: "부교역자만 여러 명 추가합니다. 담임목사는 위의 담임목사 전용 항목에서 관리합니다." } });
}

const relations = await request("/relations");
const addRelation = async (field, relatedCollection, meta, schema) => {
  if (relations.some((relation) => relation.collection === "church_ministers" && relation.field === field)) return;
  await request("/relations", "POST", { collection: "church_ministers", field, related_collection: relatedCollection, meta, schema });
};
await addRelation("site_settings", "site_settings", { many_collection: "church_ministers", many_field: "site_settings", one_collection: "site_settings", one_field: "ministers", one_deselect_action: "delete" }, { table: "church_ministers", column: "site_settings", foreign_key_table: "site_settings", foreign_key_column: "id", on_delete: "CASCADE", on_update: "NO ACTION" });
await addRelation("photo", "directus_files", { many_collection: "church_ministers", many_field: "photo", one_collection: "directus_files", one_field: "minister_photo_files", one_deselect_action: "nullify" }, { table: "church_ministers", column: "photo", foreign_key_table: "directus_files", foreign_key_column: "id", on_delete: "SET NULL", on_update: "NO ACTION" });

if (!relations.some((relation) => relation.collection === "site_settings" && relation.field === "pastor_photo")) {
  await request("/relations", "POST", { collection: "site_settings", field: "pastor_photo", related_collection: "directus_files", meta: { many_collection: "site_settings", many_field: "pastor_photo", one_collection: "directus_files", one_field: "pastor_photo_files", one_deselect_action: "nullify" }, schema: { table: "site_settings", column: "pastor_photo", foreign_key_table: "directus_files", foreign_key_column: "id", on_delete: "SET NULL", on_update: "NO ACTION" } });
}

const ministerFields = await request("/fields/church_ministers");
for (const field of ministerFields.filter((item) => ["site_settings", "sort"].includes(item.field))) {
  await request(`/fields/church_ministers/${field.field}`, "PATCH", { meta: { ...field.meta, hidden: true, required: false }, schema: { ...field.schema, is_nullable: true } });
}

// 담임목사는 site_settings의 전용 필드에서만 관리한다. 기존 목록 데이터는
// 삭제하지 않고 보관 처리하여, 섬기는 이 목록에는 부교역자만 남긴다.
const settings = await request("/items/site_settings?fields=id,pastor_name,pastor_role");
const linkedMinisters = await request(`/items/church_ministers?filter[site_settings][_eq]=${settings.id}&limit=-1`);
for (const minister of linkedMinisters.filter((item) => item.name === settings.pastor_name && item.role === settings.pastor_role)) {
  await request(`/items/church_ministers/${minister.id}`, "PATCH", { site_settings: null, status: "archived" });
}

console.log("Church information relations applied.");
