import { readFile } from "node:fs/promises";

const env = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const baseUrl = env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) });
const { data: session } = await login.json();
if (!session) throw new Error("Directus login failed.");
const headers = { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" };
const legacyFields = { stories: ["slug", "cover_image_url", "cover_image_width", "cover_image_height"], bulletins: ["slug", "document_image_url", "document_image_width", "document_image_height"] };
for (const [collection, fields] of Object.entries(legacyFields)) {
  for (const field of fields) {
    const response = await fetch(`${baseUrl}/fields/${collection}/${field}`, { method: "PATCH", headers, body: JSON.stringify({ meta: { required: false, hidden: true }, schema: { is_nullable: true } }) });
    if (!response.ok) throw new Error(await response.text());
  }
}
console.log("Legacy hidden fields are optional.");
