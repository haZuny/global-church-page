import { readFile } from "node:fs/promises";

if (process.env.SEED_SAMPLE_CONTENT !== "1") throw new Error("Set SEED_SAMPLE_CONTENT=1 to add sample content.");

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

const samplePrefix = "[샘플]";
const dateAt = (index) => `2026-09-${String(26 - (index % 24)).padStart(2, "0")}T09:00:00.000Z`;
const statusAt = (index) => index % 11 === 0 ? "archived" : index % 7 === 0 ? "draft" : "published";
const existing = await Promise.all(["stories", "bulletins", "news_items", "sermons"].map((collection) => request(`/items/${collection}?filter[title][_starts_with]=${encodeURIComponent(samplePrefix)}&limit=1&fields=id`)));
if (existing.some((items) => items.length)) throw new Error("Sample content already exists. Remove it before seeding again.");

const storyTitles = ["새가족 환영 모임", "수요 기도회 나눔", "함께 준비한 주일 식사", "청소년 겨울 모임", "이웃과 나눈 반찬", "성경 읽기 모임", "교회 마당 정리", "가족 예배 이야기", "찬양 연습 기록", "아동부 봄 활동", "소그룹 첫 만남", "지역 나눔 장터", "새 학기 기도 모임", "어르신 방문 기록", "주일 오후 산책", "교사 모임", "부활절 준비", "한 주의 감사 나눔"];
const bulletinTitles = ["9월 넷째 주 주보", "가정예배 자료", "새가족 안내 자료", "10월 첫째 주 주보", "기도회 순서지", "다음 세대 안내", "10월 둘째 주 주보", "소그룹 나눔 자료", "교회학교 안내", "10월 셋째 주 주보", "봉사자 안내 자료", "추수감사 준비 자료", "10월 넷째 주 주보", "예배 순서 참고", "새벽기도 안내", "11월 첫째 주 주보"];
const noticeTitles = ["이번 주 안내", "주차 안내 변경", "교회학교 모임 안내", "수요 기도회 안내", "봉사자 모집 안내", "새가족 환영 모임", "가정예배 안내", "주일 식사 안내", "소그룹 신청 안내", "예배 시간 안내", "교회 청소 안내", "다음 세대 일정", "기도 제목 나눔", "성경 읽기 안내", "주차장 이용 안내", "추수감사 준비", "성탄절 준비 모임", "새벽기도 안내", "교역자 휴가 안내", "주보 배부 안내", "이웃 섬김 안내", "교회학교 교사 모임", "영상 예배 안내", "한 주 소식"];
const sermonTitles = ["함께 걷는 믿음", "마음을 살피는 기도", "오늘의 작은 순종", "서로를 세우는 말", "평범한 하루의 감사", "빛 가운데 살아가기", "기다림의 시간", "함께 드리는 예배", "사랑으로 섬기는 삶", "두려움 대신 소망", "말씀을 따라 걷기", "관계 안에서 배우기", "작은 친절의 시작", "기도하는 공동체", "다시 시작하는 용기", "삶으로 드리는 예배", "서로의 짐을 나누기", "평안을 전하는 사람", "감사로 여는 하루", "말씀을 붙드는 시간", "사랑을 선택하는 믿음", "소망을 품는 공동체", "함께 자라는 교회", "오늘도 동행하시는 하나님"];

const stories = await request("/items/stories", "POST", storyTitles.map((title, index) => ({ title: `${samplePrefix} ${title}`, body: `<h2>${title}</h2><p>관리 화면과 공개 화면을 확인하기 위한 <strong>샘플 교회 이야기</strong>입니다.</p><ul><li>이미지 포함/미포함 상태를 함께 점검합니다.</li><li>목록 검색과 페이지 이동도 확인합니다.</li></ul>`, published_at: dateAt(index), status: statusAt(index) })));
const bulletins = await request("/items/bulletins", "POST", bulletinTitles.map((title, index) => ({ title: `${samplePrefix} ${title}`, category: index % 3 === 1 ? "자료" : "주보", body: `<p>관리 화면 확인을 위한 샘플 ${index % 3 === 1 ? "자료" : "주보"} 본문입니다.</p><p>파일과 이미지가 있을 때와 없을 때를 함께 확인합니다.</p>`, published_at: dateAt(index), status: statusAt(index) })));
await request("/items/news_items", "POST", noticeTitles.map((title, index) => ({ title: `${samplePrefix} ${title}`, body: `<p>검색·상태 필터·페이지네이션 확인을 위한 샘플 공지입니다.</p><blockquote>실제 운영 공지가 아닙니다.</blockquote>`, published_at: dateAt(index), status: statusAt(index) })));
await request("/items/sermons", "POST", sermonTitles.map((title, index) => ({ title: `${samplePrefix} ${title}`, summary: "관리 화면의 검색과 설교 목록 페이지를 확인하기 위한 샘플 설교 요약입니다.", scripture: index % 2 ? "로마서 12:9-13" : "마태복음 5:13-16", preacher: index % 2 ? "샘플 교역자" : "샘플 담임목사", sermon_date: dateAt(index).slice(0, 10), status: statusAt(index) })));

const sources = [
  ["sample-community-01.jpg", "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1600&q=85"],
  ["sample-community-02.jpg", "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1600&q=85"],
  ["sample-community-03.jpg", "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=85"],
  ["sample-community-04.jpg", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85"],
];

const imageIds = [];
for (const [name, url] of sources) {
  const image = await fetch(url);
  if (!image.ok) throw new Error(`Unable to download ${url}`);
  const upload = new FormData();
  upload.append("file", new Blob([await image.arrayBuffer()], { type: image.headers.get("content-type") ?? "image/jpeg" }), name);
  const response = await fetch(`${baseUrl}/files`, { method: "POST", headers: { authorization: headers.authorization }, body: upload });
  const json = await response.json();
  if (!response.ok) throw new Error(json.errors?.[0]?.message ?? `Unable to upload ${name}`);
  imageIds.push(json.data.id);
}

const publishedStories = stories.filter((item) => item.status === "published").slice(0, 5);
const publishedBulletins = bulletins.filter((item) => item.status === "published").slice(0, 5);
await request("/items/story_media", "POST", publishedStories.map((item, index) => ({ story: item.id, file: imageIds[index % imageIds.length], sort: 1 })));
await request("/items/bulletin_media", "POST", publishedBulletins.map((item, index) => ({ bulletin: item.id, file: imageIds[index % imageIds.length], sort: 1 })));
await request("/items/story_media", "POST", { story: publishedStories[0].id, file: imageIds[1], sort: 2 });
await request("/items/bulletin_media", "POST", { bulletin: publishedBulletins[0].id, file: imageIds[2], sort: 2 });

console.log("Sample list content seeded.");
