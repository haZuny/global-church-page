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

const educationCategories = new Set(["교육부서", "다음 세대", "지유쓰 · 청년부", "청년대학부"]);
const educationKeywords = /청소년|아동부|교사|새 학기|다음 세대|청년/;
const stories = await request("/items/stories?fields=id,title,category&limit=-1");

for (const story of stories) {
  const category = educationCategories.has(story.category) || educationKeywords.test(story.title) ? "교육부서" : "장년부";
  if (story.category !== category) await request(`/items/stories/${story.id}`, "PATCH", { category });
}

const field = await request("/fields/stories/category");
await request("/fields/stories/category", "PATCH", {
  meta: {
    ...field.meta,
    required: true,
    hidden: false,
    interface: "select-dropdown",
    options: { choices: ["장년부", "교육부서"].map((value) => ({ text: value, value })) },
    note: "공개 목록의 분류 필터와 동일합니다. 글의 주된 대상에 맞춰 하나를 선택하세요.",
    translations: [{ language: "ko-KR", translation: "분류" }],
  },
  schema: { ...field.schema, is_nullable: false },
});

console.log("Story categories normalized and required.");
