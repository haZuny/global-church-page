import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const env = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const baseUrl = env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) });
const { data: session } = await login.json();
if (!session) throw new Error("Directus login failed.");
const headers = { authorization: `Bearer ${session.access_token}` };
const media = [
  ["stories", "vision-founder", "cover_image", "assets/images/jiyouth-vision-founder.jpg"], ["stories", "youth-vision-founder", "cover_image", "assets/images/jiyouth-vision-founder-youth.jpg"], ["stories", "youth-dining-room", "cover_image", "assets/images/global-youth-dining.jpg"], ["stories", "youth-winter-camp", "cover_image", "assets/images/global-youth-winter-camp.jpg"], ["stories", "mens-cell-presentation", "cover_image", "assets/images/global-men-cell.jpg"],
  ...["2026-03-15", "2026-03-08", "2026-03-01", "2026-02-22", "2026-02-15", "2026-02-08", "2026-02-01", "2026-lunar-new-year"].map((slug) => ["bulletins", slug, "document_file", `assets/bulletins/${slug}.jpg`]),
];
for (const [collection, slug, field, relativePath] of media) {
  const item = await fetch(`${baseUrl}/items/${collection}?filter[slug][_eq]=${slug}&limit=1`, { headers }).then((response) => response.json()).then((body) => body.data[0]);
  if (item[field]) continue;
  const bytes = await readFile(new URL(`../../${relativePath}`, import.meta.url));
  const form = new FormData(); form.append("file", new Blob([bytes]), basename(relativePath)); form.append("title", `${item.title} 대표 파일`);
  const upload = await fetch(`${baseUrl}/files`, { method: "POST", headers, body: form });
  const uploaded = await upload.json(); if (!upload.ok) throw new Error(uploaded.errors?.[0]?.message ?? "File upload failed.");
  const update = await fetch(`${baseUrl}/items/${collection}/${item.id}`, { method: "PATCH", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ [field]: uploaded.data.id }) });
  if (!update.ok) throw new Error(await update.text());
}
console.log("Legacy media uploaded and linked.");
