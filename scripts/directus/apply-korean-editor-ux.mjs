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

const models = {
  site_settings: ["사이트 기본 정보", "교회명, 주소, 연락처 등 공통 방문 정보를 관리합니다.", { church_name: "교회 이름", introduction: "교회 소개", address: "주소", map_url: "지도 링크", phone: "연락처", visit_notice: "방문 안내" }],
  worship_services: ["예배 안내", "방문자가 확인하는 예배 시간과 장소를 관리합니다.", { name: "예배 이름", audience: "대상", weekday: "요일", start_time: "시작 시간", location: "장소", description: "안내 문구", sort: "노출 순서", status: "게시 상태" }],
  stories: ["교회 이야기", "공동체 활동과 사진 기록을 작성합니다.", { slug: "주소 이름", title: "제목", subtitle: "이전 부제", summary: "이야기 요약", category: "이전 분류", body: "본문", cover_image_url: "이전 대표 이미지 경로", cover_image: "이전 대표 이미지", cover_image_width: "이미지 너비", cover_image_height: "이미지 높이", cover_alt: "이미지 설명", published_at: "공개일", status: "게시 상태" }],
  story_media: ["이야기 이미지", "교회 이야기 안에 추가로 넣는 이미지입니다.", { story: "교회 이야기", file: "이미지 파일", alt: "이미지 설명", caption: "캡션", sort: "노출 순서" }],
  sermons: ["설교", "설교 제목, 본문, 영상 정보를 관리합니다.", { slug: "주소 이름", title: "제목", summary: "설교 요약", scripture: "성경 본문", preacher: "설교자", sermon_date: "설교일", video_url: "이전 영상 링크", video_file: "설교 영상", status: "게시 상태" }],
  bulletins: ["주보", "주보와 예배 자료를 관리합니다.", { slug: "주소 이름", title: "제목", category: "분류", summary: "주보 요약", body: "본문", document_image_url: "이전 주보 이미지 경로", document_file: "주보 파일", document_image_width: "이미지 너비", document_image_height: "이미지 높이", document_alt: "이미지 설명", published_at: "공개일", status: "게시 상태" }],
  bulletin_media: ["주보 첨부 파일", "주보에 연결하는 이미지와 자료입니다.", { bulletin: "주보", file: "첨부 파일", alt: "이미지 설명", caption: "설명", sort: "노출 순서" }],
  news_items: ["공지", "공지 내용을 자유롭게 작성합니다.", { slug: "주소 이름", type: "유형", title: "제목", summary: "공지 요약", body: "본문", event_starts_at: "행사 시작", event_ends_at: "행사 종료", location: "장소", published_at: "공개일", status: "게시 상태" }],
};

const collections = await request("/collections");
for (const [collection, [label, note, labels]] of Object.entries(models)) {
  const current = collections.find((item) => item.collection === collection);
  if (!current) continue;
  await request(`/collections/${collection}`, "PATCH", { meta: { ...current.meta, icon: "edit_note", note, hidden: ["story_media", "bulletin_media"].includes(collection), translations: [{ language: "ko-KR", translation: label, singular: label, plural: label }] } });
  const fields = await request(`/fields/${collection}`);
  for (const [field, translation] of Object.entries(labels)) {
    const currentField = fields.find((item) => item.field === field);
    if (!currentField) continue;
    const statusOptions = field === "status" ? { interface: "select-dropdown", options: { choices: [{ text: "초안", value: "draft" }, { text: "게시됨", value: "published" }, { text: "보관됨", value: "archived" }] } } : {};
    const categoryOptions = field === "category" ? { interface: "select-dropdown", options: { choices: collection === "stories" ? ["예배", "공동체", "다음 세대", "이웃 섬김", "기타"].map((value) => ({ text: value, value })) : ["주보", "자료"].map((value) => ({ text: value, value })) } } : {};
    const typeOptions = field === "type" ? { interface: "select-dropdown", options: { choices: [{ text: "공지", value: "notice" }] } } : {};
    const weekdayOptions = field === "weekday" ? { interface: "select-dropdown", options: { choices: ["주일", "수요일", "금요일", "토요일", "기타"].map((value) => ({ text: value, value })) } } : {};
    const dateOptions = field === "published_at" || field.endsWith("_at") || field === "sermon_date" ? { interface: "datetime" } : {};
    const fileOptions = ["document_file", "video_file"].includes(field) ? { interface: "file" } : {};
    const legacyPath = field.endsWith("_url") || field.endsWith("_width") || field.endsWith("_height");
    const interfaceName = field === "summary" ? "input" : field === "body" ? "input-multiline" : dateOptions.interface ?? fileOptions.interface ?? currentField.meta?.interface;
    const options = field === "body" ? { softLength: 10000, rows: 12 } : statusOptions.options ?? categoryOptions.options ?? typeOptions.options ?? weekdayOptions.options ?? currentField.meta?.options;
    await request(`/fields/${collection}/${field}`, "PATCH", { meta: { ...currentField.meta, ...statusOptions, ...categoryOptions, ...typeOptions, ...weekdayOptions, ...dateOptions, ...fileOptions, interface: interfaceName, options, hidden: legacyPath || field === "slug" || (collection === "stories" && ["subtitle", "category", "cover_image", "cover_alt"].includes(field)) || (collection === "bulletins" && ["document_file", "document_alt"].includes(field)) || (collection === "sermons" && field === "video_url") || ["type", "event_starts_at", "event_ends_at", "location"].includes(field), sort: currentField.meta?.sort ?? 1, translations: [{ language: "ko-KR", translation }] } });
  }
}

console.log("Korean editor labels and guidance applied.");
