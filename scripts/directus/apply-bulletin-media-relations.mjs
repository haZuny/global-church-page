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

const bulletinFields = await request("/fields/bulletins");
const bulletinMediaCollection = (await request("/collections")).find((collection) => collection.collection === "bulletin_media");
await request("/collections/bulletin_media", "PATCH", { meta: { ...bulletinMediaCollection.meta, display_template: "{{file.filename_download}}" } });
if (!bulletinFields.some((field) => field.field === "media")) {
  await request("/fields/bulletins", "POST", { field: "media", type: "alias", meta: { special: ["o2m"], interface: "list-o2m", display: "related-values", options: { layout: "list", template: "{{file.filename_download}}", enableCreate: true, enableSelect: false, enableLink: false }, sort: 7, translations: [{ language: "ko-KR", translation: "이미지 파일" }] } });
} else {
  const mediaField = bulletinFields.find((field) => field.field === "media");
  await request("/fields/bulletins/media", "PATCH", { meta: { ...mediaField.meta, special: ["o2m"], interface: "list-o2m", display: "related-values", options: { layout: "list", template: "{{file.filename_download}}", enableCreate: true, enableSelect: false, enableLink: false }, translations: [{ language: "ko-KR", translation: "이미지 파일" }] } });
}

const mediaFields = await request("/fields/bulletin_media");
const fileField = mediaFields.find((field) => field.field === "file");
if (fileField) await request("/fields/bulletin_media/file", "PATCH", { meta: { ...fileField.meta, interface: "file", special: ["file"], required: true, translations: [{ language: "ko-KR", translation: "이미지 파일" }] } });
for (const field of mediaFields.filter((item) => ["bulletin", "alt", "caption", "sort"].includes(item.field))) {
  await request(`/fields/bulletin_media/${field.field}`, "PATCH", { meta: { ...field.meta, hidden: true, required: false }, schema: { ...field.schema, is_nullable: true } });
}

const relations = await request("/relations");
const addRelation = async (field, relatedCollection, meta, schema) => {
  if (relations.some((relation) => relation.collection === "bulletin_media" && relation.field === field)) return;
  await request("/relations", "POST", { collection: "bulletin_media", field, related_collection: relatedCollection, meta, schema });
};

await addRelation("bulletin", "bulletins", { many_collection: "bulletin_media", many_field: "bulletin", one_collection: "bulletins", one_field: "media", one_deselect_action: "delete" }, { table: "bulletin_media", column: "bulletin", foreign_key_table: "bulletins", foreign_key_column: "id", on_delete: "CASCADE", on_update: "NO ACTION" });
await addRelation("file", "directus_files", { many_collection: "bulletin_media", many_field: "file", one_collection: "directus_files", one_field: null, one_deselect_action: "nullify" }, { table: "bulletin_media", column: "file", foreign_key_table: "directus_files", foreign_key_column: "id", on_delete: "SET NULL", on_update: "NO ACTION" });

console.log("Bulletin multi-file relations applied.");
