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

const directusFileFields = await request("/fields/directus_files");
if (!directusFileFields.some((field) => field.field === "story_media_files")) {
  await request("/fields/directus_files", "POST", { field: "story_media_files", type: "alias", meta: { special: ["o2m"], hidden: true, interface: "list-o2m", readonly: true }, schema: null });
}

const storyFields = await request("/fields/stories");
const storyMediaCollection = (await request("/collections")).find((collection) => collection.collection === "story_media");
await request("/collections/story_media", "PATCH", { meta: { ...storyMediaCollection.meta, display_template: "{{file.filename_download}}" } });
if (!storyFields.some((field) => field.field === "media")) {
  await request("/fields/stories", "POST", { field: "media", type: "alias", meta: { special: ["o2m"], interface: "list-o2m", display: "related-values", options: { layout: "list", template: "{{file.filename_download}}", enableCreate: true, enableSelect: false, enableLink: false }, sort: 7, translations: [{ language: "ko-KR", translation: "이미지 파일" }] } });
} else {
  const mediaField = storyFields.find((field) => field.field === "media");
  await request("/fields/stories/media", "PATCH", { meta: { ...mediaField.meta, special: ["o2m"], interface: "list-o2m", display: "related-values", options: { layout: "list", template: "{{file.filename_download}}", enableCreate: true, enableSelect: false, enableLink: false }, translations: [{ language: "ko-KR", translation: "이미지 파일" }] } });
}
const mediaFields = await request("/fields/story_media");
const fileField = mediaFields.find((field) => field.field === "file");
if (fileField) await request("/fields/story_media/file", "PATCH", { meta: { ...fileField.meta, interface: "file-image", special: ["file"], required: true, translations: [{ language: "ko-KR", translation: "이미지 파일" }] } });
for (const field of mediaFields.filter((item) => ["story", "alt", "caption", "sort"].includes(item.field))) {
  await request(`/fields/story_media/${field.field}`, "PATCH", { meta: { ...field.meta, hidden: true, required: false }, schema: { ...field.schema, is_nullable: true } });
}

const relations = await request("/relations");
const addRelation = async (field, relatedCollection, meta, schema) => {
  if (relations.some((relation) => relation.collection === "story_media" && relation.field === field)) return;
  await request("/relations", "POST", { collection: "story_media", field, related_collection: relatedCollection, meta, schema });
};
await addRelation("story", "stories", { many_collection: "story_media", many_field: "story", one_collection: "stories", one_field: "media", one_deselect_action: "delete" }, { table: "story_media", column: "story", foreign_key_table: "stories", foreign_key_column: "id", on_delete: "CASCADE", on_update: "NO ACTION" });
await addRelation("file", "directus_files", { many_collection: "story_media", many_field: "file", one_collection: "directus_files", one_field: "story_media_files", one_deselect_action: "nullify" }, { table: "story_media", column: "file", foreign_key_table: "directus_files", foreign_key_column: "id", on_delete: "SET NULL", on_update: "NO ACTION" });
console.log("Story multi-image relations applied.");
