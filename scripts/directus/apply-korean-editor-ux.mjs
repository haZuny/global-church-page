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
  site_settings: ["교회정보", "교회 소개, 인사말, 교단, 방문 정보를 한곳에서 관리합니다.", { church_name: "교회 이름", english_name: "영문 교회 이름", hero_title: "첫 화면 제목", hero_copy: "첫 화면 소개", introduction: "짧은 교회 소개", greeting_title: "환영 인사 제목", greeting_lead: "환영 인사 한 줄", greeting_body: "환영 인사 본문", pastor_name: "담임목사 이름", about_title: "교회 소개 제목", about_body: "교회 소개 본문 1", about_body_secondary: "교회 소개 본문 2", region: "지역", vision_title: "비전 제목", vision_intro: "비전 소개", vision_one_title: "비전 1 제목", vision_one_body: "비전 1 설명", vision_two_title: "비전 2 제목", vision_two_body: "비전 2 설명", vision_three_title: "비전 3 제목", vision_three_body: "비전 3 설명", vision_statement: "비전 한 문장", denomination_name: "교단·노회", denomination_intro: "교단 소개 제목", denomination_detail: "교단 소개 본문", ministers_intro: "교역자 인삿말", address: "주소", map_url: "지도 링크", phone: "대표 연락처", transit_info: "대중교통 안내", parking_info: "주차 안내", visit_notice: "처음 방문 안내" }],
  church_ministers: ["교역자", "교회정보에 표시할 교역자를 관리합니다.", { site_settings: "교회정보", name: "이름", role: "역할", description: "교역자 소개", photo: "프로필 사진", sort: "노출 순서", status: "게시 상태" }],
  worship_services: ["예배 안내", "방문자가 확인하는 예배 이름, 요일, 시간만 관리합니다.", { name: "예배 이름", audience: "이전 대상", weekday: "이전 요일", weekdays: "요일", start_time: "시작 시간", location: "이전 장소", description: "이전 안내 문구", sort: "노출 순서", status: "게시 상태" }],
  stories: ["교회 이야기", "공동체 활동과 사진 기록을 작성합니다.", { slug: "주소 이름", title: "제목", subtitle: "이전 부제", summary: "이야기 요약", category: "이전 분류", body: "본문", cover_image_url: "이전 대표 이미지 경로", cover_image: "이전 대표 이미지", cover_image_width: "이미지 너비", cover_image_height: "이미지 높이", cover_alt: "이미지 설명", published_at: "공개일", status: "게시 상태" }],
  story_media: ["이야기 이미지", "교회 이야기 안에 추가로 넣는 이미지입니다.", { story: "교회 이야기", file: "이미지 파일", alt: "이미지 설명", caption: "캡션", sort: "노출 순서" }],
  sermons: ["설교", "설교 제목, 본문, 영상 정보를 관리합니다.", { slug: "주소 이름", title: "제목", summary: "설교 요약", scripture: "성경 본문", preacher: "설교자", sermon_date: "설교일", video_url: "이전 영상 링크", video_file: "설교 영상", status: "게시 상태" }],
  bulletins: ["주보", "주보와 예배 자료를 관리합니다.", { slug: "주소 이름", title: "제목", category: "분류", summary: "주보 요약", body: "본문", document_image_url: "이전 주보 이미지 경로", document_file: "주보 파일", document_image_width: "이미지 너비", document_image_height: "이미지 높이", document_alt: "이미지 설명", published_at: "공개일", status: "게시 상태" }],
  bulletin_media: ["주보 첨부 파일", "주보에 연결하는 이미지와 자료입니다.", { bulletin: "주보", file: "첨부 파일", alt: "이미지 설명", caption: "설명", sort: "노출 순서" }],
  news_items: ["공지", "공지 내용을 자유롭게 작성합니다.", { slug: "주소 이름", type: "유형", title: "제목", summary: "공지 요약", body: "본문", event_starts_at: "행사 시작", event_ends_at: "행사 종료", location: "장소", published_at: "공개일", status: "게시 상태" }],
};
const richTextFields = new Set(["stories.body", "bulletins.body", "news_items.body", "site_settings.greeting_body", "site_settings.vision_intro", "site_settings.vision_one_body", "site_settings.vision_two_body", "site_settings.vision_three_body", "site_settings.denomination_detail"]);

const collections = await request("/collections");
for (const [collection, [label, note, labels]] of Object.entries(models)) {
  const current = collections.find((item) => item.collection === collection);
  if (!current) continue;
  await request(`/collections/${collection}`, "PATCH", { meta: { ...current.meta, icon: "edit_note", note, hidden: ["story_media", "bulletin_media", "church_ministers"].includes(collection), translations: [{ language: "ko-KR", translation: label, singular: label, plural: label }] } });
  const fields = await request(`/fields/${collection}`);
  for (const [field, translation] of Object.entries(labels)) {
    const currentField = fields.find((item) => item.field === field);
    if (!currentField) continue;
    const statusOptions = field === "status" ? { interface: "select-dropdown", options: { choices: [{ text: "초안", value: "draft" }, { text: "게시됨", value: "published" }, { text: "보관됨", value: "archived" }] } } : {};
    const categoryOptions = field === "category" ? { interface: "select-dropdown", options: { choices: collection === "stories" ? ["예배", "공동체", "다음 세대", "이웃 섬김", "기타"].map((value) => ({ text: value, value })) : ["주보", "자료"].map((value) => ({ text: value, value })) } } : {};
    const typeOptions = field === "type" ? { interface: "select-dropdown", options: { choices: [{ text: "공지", value: "notice" }] } } : {};
    const weekdayOptions = collection === "worship_services" && field === "weekdays" ? { interface: "select-multiple-dropdown", options: { choices: ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "주일"].map((value) => ({ text: value, value })) } } : {};
    const worshipTimeOptions = collection === "worship_services" && field === "start_time" ? { interface: "select-dropdown", options: { choices: Array.from({ length: 144 }, (_, index) => {
      const totalMinutes = index * 10;
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      return { text: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`, value: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00` };
    }) } } : {};
    const worshipSortOptions = collection === "worship_services" && field === "sort" ? { interface: "select-dropdown", options: { choices: Array.from({ length: 20 }, (_, index) => ({ text: `${index + 1}번째`, value: index + 1 })) } } : {};
    const dateOptions = field === "published_at" || field.endsWith("_at") || field === "sermon_date" ? { interface: "datetime" } : {};
    const fileOptions = ["document_file", "video_file", "photo"].includes(field) ? { interface: "file" } : {};
    const legacyPath = (field.endsWith("_url") && field !== "map_url") || field.endsWith("_width") || field.endsWith("_height");
    const retiredSiteField = collection === "site_settings" && ["about_body", "about_body_secondary", "region", "vision_statement", "ministers_intro", "visit_notice"].includes(field);
    const retiredContentField = (collection === "stories" && ["subtitle", "summary", "category", "cover_image", "cover_alt"].includes(field)) || (collection === "bulletins" && ["summary", "document_file", "document_alt"].includes(field)) || (collection === "news_items" && ["summary", "type", "event_starts_at", "event_ends_at", "location"].includes(field));
    const retiredWorshipField = collection === "worship_services" && ["audience", "weekday", "location", "description"].includes(field);
    const isRichText = richTextFields.has(`${collection}.${field}`);
    const fieldNote = isRichText ? "제목, 굵게, 기울임, 글자 크기·색상, 목록, 인용, 링크로 읽기 쉬운 본문을 작성합니다. 공개 화면에는 안전한 서식만 표시됩니다." : collection === "church_ministers" && field === "description" ? "이 교역자의 사역 방향과 소개를 작성합니다. 각 교역자마다 별도로 입력한 문구가 교회 소개 화면 카드 아래에 표시됩니다." : currentField.meta?.note;
    const interfaceName = isRichText ? "input-rich-text-html" : field === "summary" ? "input" : field === "body" ? "input-multiline" : weekdayOptions.interface ?? worshipTimeOptions.interface ?? worshipSortOptions.interface ?? dateOptions.interface ?? fileOptions.interface ?? currentField.meta?.interface;
    const options = isRichText ? {} : field === "body" ? { softLength: 10000, rows: 12 } : statusOptions.options ?? categoryOptions.options ?? typeOptions.options ?? weekdayOptions.options ?? worshipTimeOptions.options ?? worshipSortOptions.options ?? currentField.meta?.options;
    await request(`/fields/${collection}/${field}`, "PATCH", { meta: { ...currentField.meta, ...statusOptions, ...categoryOptions, ...typeOptions, ...weekdayOptions, ...worshipTimeOptions, ...worshipSortOptions, ...dateOptions, ...fileOptions, special: field === "weekdays" ? ["cast-json"] : currentField.meta?.special, interface: interfaceName, options, note: fieldNote, hidden: legacyPath || field === "slug" || retiredSiteField || retiredContentField || retiredWorshipField || (collection === "sermons" && field === "video_url"), sort: currentField.meta?.sort ?? 1, translations: [{ language: "ko-KR", translation }] } });
  }
}

console.log("Korean editor labels and guidance applied.");
