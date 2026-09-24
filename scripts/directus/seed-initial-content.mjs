import { readFile } from "node:fs/promises";

const envFile = await readFile(new URL("../../.env", import.meta.url), "utf8");
const localEnv = Object.fromEntries(envFile.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const env = { ...localEnv, ...process.env };
const baseUrl = env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) });
const loginBody = await login.json();
if (!login.ok) throw new Error(loginBody.errors?.[0]?.message ?? "Directus login failed.");

const request = async (path, method = "GET", body) => {
  const response = await fetch(`${baseUrl}${path}`, { method, headers: { authorization: `Bearer ${loginBody.data.access_token}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const responseBody = await response.json();
  if (!response.ok) throw new Error(responseBody.errors?.[0]?.message ?? `${method} ${path} failed.`);
  return responseBody.data;
};

const stories = [
  ["vision-founder", "지유쓰 · 청년부", "우리 안에 비전을 세우는 비전파운더", "삶의 목적과 하나님의 뜻을 함께 묻고, 우리 안에 주신 비전을 발견해 간 3일의 기록", "사진과 함께 청년부가 나눈 질문과 고백을 만나보세요.", "/assets/images/jiyouth-vision-founder.jpg", 640, 853, "청년부 비전파운더 안내 카드와 워크북", "2026-07-01", [{ type: "note", text: "비전파운더(청년부) · 2026. 06. 26–28" }, { type: "quote", text: "삶이란, 태어나 죽기까지\n주의 뜻(vision)이\n어떻게 채워져 가는지,\n맛보며 알아가는 것" }, { type: "text", text: "이를 위해 주께서 Build up, Rise up, Level up 하시고 ‘우리’ 안에 Vision을 만드시며 ‘우리’를 통해 Vision을 세워가십니다." }, { type: "text", text: "인생은 참으로 맛있고 멋스럽구나." }]],
  ["youth-vision-founder", "다음 세대", "청소년부 비전파운더", "삶의 목적과 하나님의 뜻에 관해 진지하게 공감하고 고백한 시간", "다음 세대가 함께 배우고 고백한 현장의 모습을 전합니다.", "/assets/images/jiyouth-vision-founder-youth.jpg", 640, 853, "청소년부 비전파운더 안내 카드와 워크북", "2026-07-29", [{ type: "note", text: "비전파운더(청소년부) 종료" }, { type: "text", text: "주입식이나 강제 설득이 아니라 ‘삶의 목적’과 ‘하나님의 뜻’에 대한 진지한 공감과 동의가 필요했던 시간이었습니다." }, { type: "quote", text: "주께서 아이들 입술에\n근사한 고백과 결단을\n넣어 주셨으니, 되었다." }]],
  ["youth-dining-room", "청년대학부", "청년대학부 식당 꾸미기", "함께 사용할 식당 공간을 손수 꾸미며 공동체의 자리를 준비한 날", "함께 쓰는 공간을 준비하며 나눈 협력의 시간을 전합니다.", "/assets/images/global-youth-dining.jpg", 1200, 1600, "청년대학부가 식당 공간을 꾸미는 모습", "2024-02-06", [{ type: "text", text: "청년대학부가 함께 사용할 식당 공간을 손수 꾸몄습니다." }, { type: "text", text: "빈 공간을 함께 정리하고 필요한 자리를 하나씩 채워 가며, 앞으로 이곳에서 나눌 식사와 대화를 준비했습니다." }, { type: "note", text: "이날의 기록은 현장 사진으로 전합니다." }]],
  ["youth-winter-camp", "다음 세대", "청소년부 겨울캠프", "청소년부가 함께 예배하고 교제한 겨울캠프의 사진 기록", "예배와 교제로 채운 겨울 한때를 사진으로 전합니다.", "/assets/images/global-youth-winter-camp.jpg", 1600, 1600, "청소년부 겨울캠프 현장", "2024-02-01", [{ type: "text", text: "청소년부가 일상에서 잠시 벗어나 한자리에 모여 예배하고 서로를 알아가는 시간을 보냈습니다." }, { type: "text", text: "함께한 겨울캠프의 분위기와 다음 세대 공동체의 모습을 사진으로 남겼습니다." }]],
  ["mens-cell-presentation", "셀 공동체", "남성 셀 발표", "각자의 자리에서 준비한 내용을 나누며 함께한 공동체 기록", "서로의 이야기를 듣고 격려한 셀 공동체의 모습입니다.", "/assets/images/global-men-cell.jpg", 1600, 1200, "남성 셀 모임 발표 현장", "2024-02-01", [{ type: "text", text: "남성 셀 공동체가 한자리에 모여 각자의 자리에서 준비한 내용을 발표하고 서로의 이야기를 들었습니다." }, { type: "text", text: "함께 배우고 응원하며 교제한 이날의 모습을 사진으로 남겼습니다." }]],
];

const bulletinDates = ["2026-03-15", "2026-03-08", "2026-03-01", "2026-02-22", "2026-02-15", "2026-02-08", "2026-02-01"];
const bulletins = [
  ...bulletinDates.map((slug) => ({ slug, title: `${slug.replaceAll("-", ". ")} 글로벌교회 주보`, category: "주보", summary: "예배 순서와 공동체 안내를 이 페이지에서 바로 확인하세요.", document_image_url: `/assets/bulletins/${slug}.jpg`, document_image_width: 840, document_image_height: 594, document_alt: `${slug} 글로벌교회 주보`, published_at: `${slug}T00:00:00`, status: "published" })),
  { slug: "2026-lunar-new-year", title: "2026년 설 가정예배 순서지", category: "가정예배 자료", summary: "가정에서 함께 드리는 설 예배의 순서와 말씀을 확인하세요.", document_image_url: "/assets/bulletins/2026-lunar-new-year.jpg", document_image_width: 840, document_image_height: 594, document_alt: "2026년 설 가정예배 순서지", published_at: "2026-02-01T00:00:00", status: "published" },
];

for (const [slug, category, title, subtitle, summary, cover_image_url, cover_image_width, cover_image_height, cover_alt, published_at, body] of stories) {
  const existing = await request(`/items/stories?filter[slug][_eq]=${encodeURIComponent(slug)}&limit=1`);
  if (!existing.length) await request("/items/stories", "POST", { slug, category, title, subtitle, summary, body, cover_image_url, cover_image_width, cover_image_height, cover_alt, published_at: `${published_at}T00:00:00`, status: "published" });
}
for (const bulletin of bulletins) {
  const existing = await request(`/items/bulletins?filter[slug][_eq]=${encodeURIComponent(bulletin.slug)}&limit=1`);
  if (!existing.length) await request("/items/bulletins", "POST", bulletin);
}

console.log("Initial stories and bulletins seeded.");
