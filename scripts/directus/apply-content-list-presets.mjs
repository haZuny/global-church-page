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

const listDefaults = {
  stories: { sort: ["-published_at"], note: "제목으로 검색하고, 게시 상태·분류 필터를 함께 사용해 원하는 이야기를 찾습니다. 목록은 최신순으로 25개씩 표시됩니다." },
  bulletins: { sort: ["-published_at"], note: "제목으로 검색하고, 게시 상태·분류 필터를 함께 사용해 원하는 주보와 자료를 찾습니다. 목록은 최신순으로 25개씩 표시됩니다." },
  news_items: { sort: ["-published_at"], note: "제목으로 검색하고, 게시 상태 필터를 함께 사용해 원하는 공지를 찾습니다. 목록은 최신순으로 25개씩 표시됩니다." },
  sermons: { sort: ["-sermon_date"], note: "제목과 설교 요약으로 검색하고, 게시 상태 필터를 함께 사용해 원하는 설교를 찾습니다. 목록은 설교일 최신순으로 25개씩 표시됩니다." },
};

const [collections, presets] = await Promise.all([request("/collections"), request("/presets?limit=-1")]);
for (const [collection, { sort, note }] of Object.entries(listDefaults)) {
  const currentCollection = collections.find((item) => item.collection === collection);
  if (!currentCollection) continue;
  await request(`/collections/${collection}`, "PATCH", { meta: { ...currentCollection.meta, note } });

  const current = presets.find((preset) => preset.collection === collection && preset.user === null && preset.role === null && preset.bookmark === null);
  const body = {
    collection,
    bookmark: null,
    user: null,
    role: null,
    icon: "table_rows",
    color: null,
    search: null,
    filter: null,
    layout: "tabular",
    layout_query: { tabular: { page: 1, limit: 25, sort } },
    layout_options: null,
    refresh_interval: null,
  };
  if (current) await request(`/presets/${current.id}`, "PATCH", body);
  else await request("/presets", "POST", body);

  for (const preset of presets.filter((item) => item.collection === collection && item.bookmark === null && (item.user !== null || item.role !== null))) {
    const tabular = { ...(preset.layout_query?.tabular ?? {}), page: 1, limit: 25, sort };
    await request(`/presets/${preset.id}`, "PATCH", { layout: "tabular", layout_query: { ...(preset.layout_query ?? {}), tabular } });
  }
}

console.log("Content list presets applied.");
