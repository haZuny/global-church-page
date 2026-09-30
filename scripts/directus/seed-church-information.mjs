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

const church = {
  church_name: "글로벌교회",
  english_name: "Global Community Church",
  hero_title: "우리 안의 비전을 함께 세우는 교회",
  hero_copy: "시흥에서 함께 예배하고, 삶의 질문을 나누며, 각 사람 안의 비전을 함께 세워갑니다.",
  introduction: "글로벌교회는 시흥에서 함께 예배하고, 삶의 자리에서 말씀을 배우며, 서로의 걸음을 응원하는 공동체입니다.",
  greeting_title: "시흥에서 함께 예배하고 함께 자라는 공동체",
  greeting_lead: "글로벌교회는 말씀을 배우고 삶을 나누며, 각 사람 안에 주신 비전을 함께 세워가는 교회입니다.",
  greeting_body: "글로벌교회는 경기도 시흥에 자리한 공동체입니다. 예배 가운데 말씀을 배우고, 서로의 삶을 살피며, 어린이부터 다음 세대와 장년에 이르기까지 함께 믿음의 걸음을 이어갑니다.\n\n우리는 예배에서 들은 말씀이 한 주의 관계와 일상으로 이어지기를 소망합니다. 지역 이웃과 기쁨과 어려움을 함께 나누고, 각 사람에게 주신 부르심을 발견하도록 서로를 응원합니다.",
  pastor_name: "권오선",
  pastor_role: "담임목사",
  about_title: "시흥에서 함께 예배하고 함께 자라는 공동체",
  denomination_history: "<h3>소속 교단·노회</h3><p>대한예수교장로회(합동) 서울강서노회</p><p>글로벌교회는 개혁주의 신앙 전통 안에서 성경을 신앙과 삶의 기준으로 삼으며, 예수 그리스도의 복음과 교회의 공공성을 소중히 여깁니다.</p><h3>글로벌교회 연혁</h3><p>글로벌교회는 시흥 지역에서 예배와 말씀의 공동체를 세우기 위해 개척되었습니다. 개척의 구체적인 연도와 주요 발자취는 확인되는 순서대로 이곳에 기록합니다.</p>",
  address: "경기도 시흥시 하상로8번길 12-1",
  map_url: "https://share.google/0DF5W8pHQeUwgCa4t",
};

const existingChurch = await request("/items/site_settings");
const missingChurchValues = Object.fromEntries(Object.entries(church).filter(([field]) => existingChurch[field] === null || existingChurch[field] === undefined || existingChurch[field] === ""));
if (Object.keys(missingChurchValues).length > 0) await request("/items/site_settings", "PATCH", missingChurchValues);
const settings = await request("/items/site_settings");
const ministers = await request(`/items/church_ministers?filter[site_settings][_eq]=${settings.id}&limit=-1`);
if (!ministers.some((minister) => minister.role !== settings.pastor_role)) await request("/items/church_ministers", "POST", [
  { site_settings: settings.id, name: "김민", role: "교육목사", description: "교육과 다음 세대 사역을 통해 믿음의 성장을 돕고 공동체를 섬깁니다.", sort: 1, status: "published" },
]);

console.log("Church information seeded.");
