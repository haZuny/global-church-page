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
  about_title: "시흥에서 함께 예배하고 함께 자라는 공동체",
  about_body: "글로벌교회는 경기도 시흥에 자리한 대한예수교장로회(합동) 소속 교회입니다. 말씀과 성령의 능력 안에서 복음을 누리고 전하며, 한 사람의 믿음이 가정과 이웃을 살리는 삶으로 이어지기를 소망합니다.",
  about_body_secondary: "규모나 프로그램보다 사람을 소중히 여깁니다. 어린이와 청소년, 청년과 장년이 각자의 자리에서 믿음을 배우고, 세대가 서로를 응원하며, 지역 안에서 사랑을 구체적으로 나누는 교회를 지향합니다.",
  region: "경기도 시흥시",
  vision_title: "말씀과 성령의 능력으로 세상 속에서 복음을 살아갑니다.",
  vision_intro: "글로벌교회는 예배에서 받은 은혜가 한 주의 삶과 관계, 지역을 향한 섬김으로 이어지는 믿음을 중요하게 여깁니다.",
  vision_one_title: "말씀의 능력을 경험하는 성도",
  vision_one_body: "성경을 지식으로만 머물게 하지 않고, 오늘의 선택과 관계를 새롭게 하는 말씀으로 받습니다.",
  vision_two_title: "성령의 열매가 자라는 삶",
  vision_two_body: "사랑과 기쁨, 오래 참음과 절제가 예배당을 넘어 가정과 일상에서 드러나도록 함께 훈련합니다.",
  vision_three_title: "전도와 선교의 사명을 실천하는 교회",
  vision_three_body: "복음을 말과 삶으로 이웃에게 전하고, 다음 세대와 세계를 향한 하나님의 마음에 참여합니다.",
  vision_statement: "한 사람을 세우고, 한 공동체를 살리며, 세상을 향해 복음을 전합니다.",
  denomination_name: "대한예수교장로회(합동) 서울강서노회",
  denomination_intro: "대한예수교장로회(합동) 서울강서노회 소속입니다.",
  denomination_detail: "글로벌교회는 개혁주의 신앙 전통 안에서 성경을 신앙과 삶의 기준으로 삼으며, 예수 그리스도의 복음과 교회의 공공성을 소중히 여깁니다.\n\n지역 교회가 홀로 서기보다 같은 신앙을 고백하는 교회들과 책임 있게 협력하고, 건강한 목회와 선교를 함께 이어가기 위해 노회와 교단의 질서 안에 있습니다.",
  ministers_intro: "말씀과 삶의 자리에서 함께 걸으며, 각 사람의 이야기에 귀 기울이는 교역자들입니다.",
  address: "경기도 시흥시 하상로8번길 12-1",
  map_url: "https://share.google/0DF5W8pHQeUwgCa4t",
  visit_notice: "바로 등록하거나 무엇을 결정하지 않아도 괜찮습니다. 먼저 예배에 참여하고 궁금한 점을 편하게 물어보세요.",
};

const existingChurch = await request("/items/site_settings");
const missingChurchValues = Object.fromEntries(Object.entries(church).filter(([field]) => existingChurch[field] === null || existingChurch[field] === undefined || existingChurch[field] === ""));
if (Object.keys(missingChurchValues).length > 0) await request("/items/site_settings", "PATCH", missingChurchValues);
const currentServices = await request("/items/worship_services?limit=1");
if (currentServices.length === 0) {
  await request("/items/worship_services", "POST", [
    { name: "주일예배", audience: "누구나", weekday: "주일", weekdays: ["주일"], start_time: "10:30:00", location: "예배당", description: "처음 오시는 분도 편안하게 참여할 수 있습니다.", sort: 1, status: "published" },
    { name: "어린이예배", audience: "4세–초등학생", weekday: "주일", weekdays: ["주일"], start_time: "10:30:00", location: "꿈마루 1층", description: "어린이를 위한 예배입니다.", sort: 2, status: "published" },
    { name: "청년예배", audience: "대학생·청년", weekday: "주일", weekdays: ["주일"], start_time: "14:00:00", location: "지유쓰", description: "대학생과 청년이 함께 드리는 예배입니다.", sort: 3, status: "published" },
    { name: "수요기도회", audience: "누구나", weekday: "수요일", weekdays: ["수요일"], start_time: "19:30:00", location: "작은예배실 3층", description: "한 주 가운데 함께 기도하는 시간입니다.", sort: 4, status: "published" },
  ]);
}
const settings = await request("/items/site_settings");
const ministers = await request("/items/church_ministers?limit=1");
if (ministers.length === 0) await request("/items/church_ministers", "POST", [
  { site_settings: settings.id, name: "권오선", role: "담임목사", description: "말씀과 예배 사역을 중심으로 교회의 방향과 공동체를 섬깁니다.", sort: 1, status: "published" },
  { site_settings: settings.id, name: "김민", role: "교육목사", description: "교육과 다음 세대 사역을 통해 믿음의 성장을 돕고 공동체를 섬깁니다.", sort: 2, status: "published" },
]);

console.log("Church information and worship services seeded.");
