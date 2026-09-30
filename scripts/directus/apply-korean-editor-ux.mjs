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
  site_settings: ["교회정보", "공개 페이지 순서에 맞춰 교회 기본정보, 메인, 소개, 방문 정보를 관리합니다.", { church_name: "교회 이름", english_name: "영문 교회 이름", hero_title: "첫 화면 제목", hero_copy: "첫 화면 소개", introduction: "교회 소개 페이지 설명", greeting_title: "담임목사 소개 제목", greeting_lead: "목회 철학 요약", greeting_body: "목회 철학 및 소개", pastor_name: "담임목사 이름", pastor_role: "담임목사 직함", pastor_photo: "담임목사 사진", about_title: "교회 소개 페이지 제목", about_body: "이전 교회 소개 본문 1", about_body_secondary: "이전 교회 소개 본문 2", region: "이전 지역", vision_title: "이전 비전 제목", vision_intro: "이전 비전 소개", vision_one_title: "이전 비전 1 제목", vision_one_body: "이전 비전 1 설명", vision_two_title: "이전 비전 2 제목", vision_two_body: "이전 비전 2 설명", vision_three_title: "이전 비전 3 제목", vision_three_body: "이전 비전 3 설명", vision_statement: "이전 비전 한 문장", denomination_name: "이전 소속 교단·노회", denomination_intro: "이전 교단 소개 제목", denomination_detail: "이전 교단·노회 소개", church_history: "이전 개척·교회 연혁", denomination_history: "교단·연혁", ministers_intro: "이전 교역자 인삿말", address: "주소", map_url: "지도 링크", phone: "대표 연락처", transit_info: "대중교통 안내", parking_info: "주차 안내", visit_notice: "이전 방문 안내", show_sermons: "설교 메뉴 노출" }],
  church_ministers: ["섬기는 이", "교회정보에 표시할 부교역자를 관리합니다. 담임목사는 교회정보의 전용 항목에서 관리합니다.", { site_settings: "교회정보", name: "이름", role: "직함", description: "사역·소개", photo: "프로필 사진", sort: "노출 순서", status: "게시 상태" }],
  worship_services: ["이전 예배 안내", "예배 시간은 공개 웹에 고정되어 있어 더 이상 여기서 관리하지 않습니다.", { name: "이전 예배 이름", audience: "이전 대상", weekday: "이전 요일", weekdays: "이전 요일", start_time: "이전 시작 시간", location: "이전 장소", description: "이전 안내 문구", sort: "이전 노출 순서", status: "이전 게시 상태" }],
  stories: ["교회 이야기", "공동체 활동과 사진 기록을 작성합니다.", { slug: "주소 이름", title: "제목", subtitle: "이전 부제", summary: "이야기 요약", category: "분류", body: "본문", cover_image_url: "이전 대표 이미지 경로", cover_image: "이전 대표 이미지", cover_image_width: "이미지 너비", cover_image_height: "이미지 높이", cover_alt: "이미지 설명", published_at: "공개일", status: "게시 상태" }],
  story_media: ["이야기 이미지", "교회 이야기 안에 추가로 넣는 이미지입니다.", { story: "교회 이야기", file: "이미지 파일", alt: "이미지 설명", caption: "캡션", sort: "노출 순서" }],
  sermons: ["설교", "설교 제목, 본문, 영상 정보를 관리합니다.", { slug: "주소 이름", title: "제목", summary: "설교 요약", scripture: "성경 본문", preacher: "설교자", sermon_date: "설교일", video_url: "이전 영상 링크", video_file: "설교 영상", status: "게시 상태" }],
  bulletins: ["주보", "주보와 예배 자료를 관리합니다.", { slug: "주소 이름", title: "제목", category: "분류", summary: "주보 요약", body: "본문", document_image_url: "이전 주보 이미지 경로", document_file: "주보 파일", document_image_width: "이미지 너비", document_image_height: "이미지 높이", document_alt: "이미지 설명", published_at: "공개일", status: "게시 상태" }],
  bulletin_media: ["주보 첨부 파일", "주보에는 이미지와 내려받을 자료를 함께 연결할 수 있습니다.", { bulletin: "주보", file: "첨부 파일", alt: "이미지 설명", caption: "설명", sort: "노출 순서" }],
  news_items: ["공지", "공지 내용을 자유롭게 작성합니다.", { slug: "주소 이름", type: "유형", title: "제목", summary: "공지 요약", body: "본문", event_starts_at: "행사 시작", event_ends_at: "행사 종료", location: "장소", published_at: "공개일", status: "게시 상태" }],
};
const richTextFields = new Set(["stories.body", "bulletins.body", "news_items.body", "site_settings.greeting_body", "site_settings.denomination_history"]);
const multilineSiteFields = new Set(["address", "transit_info", "parking_info"]);

const siteFieldLayout = Object.fromEntries([
  ["church_name", 1], ["english_name", 2],
  ["hero_title", 10], ["hero_copy", 11],
  ["about_title", 20], ["introduction", 21],
  ["pastor_photo", 30], ["pastor_role", 31], ["pastor_name", 32], ["greeting_title", 33], ["greeting_lead", 34], ["greeting_body", 35],
  ["ministers", 40],
  ["denomination_history", 50],
  ["address", 60], ["map_url", 61], ["phone", 62], ["transit_info", 63], ["parking_info", 64],
  ["show_sermons", 70],
]);

const siteFieldLabels = {
  church_name: "기본정보 · 교회 이름",
  english_name: "기본정보 · 영문 교회 이름",
  hero_title: "메인페이지 · 첫 화면 제목",
  hero_copy: "메인페이지 · 첫 화면 소개",
  about_title: "교회 소개 · 페이지 제목",
  introduction: "교회 소개 · 페이지 설명",
  pastor_photo: "교회 소개 · 담임목사 사진",
  pastor_role: "교회 소개 · 담임목사 직함",
  pastor_name: "교회 소개 · 담임목사 이름",
  greeting_title: "교회 소개 · 담임목사 소개 제목",
  greeting_lead: "교회 소개 · 목회 철학 요약",
  greeting_body: "교회 소개 · 목회 철학 및 소개",
  ministers: "교회 소개 · 섬기는 이",
  denomination_history: "교회 소개 · 교단·연혁",
  address: "방문 정보 · 주소",
  map_url: "방문 정보 · 지도 링크",
  phone: "방문 정보 · 대표 연락처",
  transit_info: "방문 정보 · 대중교통 안내",
  parking_info: "방문 정보 · 주차 안내",
  show_sermons: "공개 메뉴 · 설교 메뉴 노출",
};

const collections = await request("/collections");
for (const [collection, [label, note, labels]] of Object.entries(models)) {
  const current = collections.find((item) => item.collection === collection);
  if (!current) continue;
  await request(`/collections/${collection}`, "PATCH", { meta: { ...current.meta, icon: "edit_note", note, hidden: ["story_media", "bulletin_media", "church_ministers", "worship_services"].includes(collection), translations: [{ language: "ko-KR", translation: label, singular: label, plural: label }] } });
  const fields = await request(`/fields/${collection}`);
  for (const [field, translation] of Object.entries(labels)) {
    const currentField = fields.find((item) => item.field === field);
    if (!currentField) continue;
    const statusOptions = field === "status" ? { interface: "select-dropdown", options: { choices: [{ text: "초안", value: "draft" }, { text: "게시됨", value: "published" }, { text: "보관됨", value: "archived" }] } } : {};
    const categoryOptions = field === "category" ? { interface: "select-dropdown", options: { choices: collection === "stories" ? ["장년부", "교육부서"].map((value) => ({ text: value, value })) : ["주보", "자료"].map((value) => ({ text: value, value })) } } : {};
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
    const legacyPath = (field.endsWith("_url") && field !== "map_url") || field.endsWith("_width") || field.endsWith("_height");
    const retiredSiteField = collection === "site_settings" && ["about_body", "about_body_secondary", "region", "vision_title", "vision_intro", "vision_one_title", "vision_one_body", "vision_two_title", "vision_two_body", "vision_three_title", "vision_three_body", "vision_statement", "denomination_name", "denomination_intro", "denomination_detail", "church_history", "ministers_intro", "visit_notice"].includes(field);
    const retiredContentField = (collection === "stories" && ["subtitle", "summary", "cover_image", "cover_alt"].includes(field)) || (collection === "bulletins" && ["summary", "document_file", "document_alt"].includes(field)) || (collection === "news_items" && ["summary", "type", "event_starts_at", "event_ends_at", "location"].includes(field));
    const retiredWorshipField = collection === "worship_services" && ["audience", "weekday", "location", "description"].includes(field);
    const isRichText = richTextFields.has(`${collection}.${field}`);
    const fieldNote = isRichText ? "제목, 굵게, 기울임, 글자 크기·색상, 목록, 인용, 링크로 읽기 쉬운 본문을 작성합니다. 공개 화면에는 안전한 서식만 표시됩니다." : collection === "site_settings" && multilineSiteFields.has(field) ? "여러 안내를 적을 때는 줄바꿈으로 구분하세요. 공개 사이트와 푸터에도 입력한 줄바꿈이 그대로 표시됩니다." : collection === "site_settings" && field === "pastor_photo" ? "교회 소개 첫 섹션에 표시할 담임목사 사진입니다. 실제 인물이 알아볼 수 있는 세로형 사진을 사용하세요." : collection === "site_settings" && field === "denomination_history" ? "소속 교단·노회, 개척 배경, 주요 발자취를 하나의 글에서 순서대로 작성합니다. 확인된 사실과 날짜만 기록하세요." : collection === "site_settings" && field === "show_sermons" ? "켜면 공개 사이트의 데스크톱·모바일 메뉴에 설교 탭이 표시됩니다. 설교 콘텐츠를 준비하기 전에는 끄세요." : collection === "stories" && field === "category" ? "공개 목록의 분류 필터와 동일합니다. 글의 주된 대상에 맞춰 하나를 선택하세요." : collection === "church_ministers" && field === "description" ? "부교역자의 담당 사역과 소개를 작성합니다. 담임목사는 교회정보의 전용 항목에서 관리합니다." : currentField.meta?.note;
    const fileOptions = field === "pastor_photo" ? { interface: "file-image" } : ["document_file", "video_file", "photo"].includes(field) ? { interface: "file" } : {};
    const interfaceName = isRichText ? "input-rich-text-html" : collection === "site_settings" && field === "show_sermons" ? "boolean" : collection === "site_settings" && multilineSiteFields.has(field) ? "input-multiline" : field === "summary" ? "input" : field === "body" ? "input-multiline" : weekdayOptions.interface ?? worshipTimeOptions.interface ?? worshipSortOptions.interface ?? dateOptions.interface ?? fileOptions.interface ?? currentField.meta?.interface;
    const options = isRichText ? {} : collection === "site_settings" && multilineSiteFields.has(field) ? { softLength: 1000, rows: 4 } : field === "body" ? { softLength: 10000, rows: 12 } : statusOptions.options ?? categoryOptions.options ?? typeOptions.options ?? weekdayOptions.options ?? worshipTimeOptions.options ?? worshipSortOptions.options ?? currentField.meta?.options;
    const layout = collection === "site_settings" ? siteFieldLayout[field] : undefined;
    await request(`/fields/${collection}/${field}`, "PATCH", { meta: { ...currentField.meta, ...statusOptions, ...categoryOptions, ...typeOptions, ...weekdayOptions, ...worshipTimeOptions, ...worshipSortOptions, ...dateOptions, ...fileOptions, special: field === "weekdays" ? ["cast-json"] : currentField.meta?.special, interface: interfaceName, options, note: fieldNote, required: collection === "stories" && field === "category" ? true : currentField.meta?.required, hidden: legacyPath || field === "slug" || retiredSiteField || retiredContentField || retiredWorshipField || (collection === "sermons" && field === "video_url"), group: collection === "site_settings" ? null : currentField.meta?.group, sort: layout ?? currentField.meta?.sort ?? 1, translations: [{ language: "ko-KR", translation: collection === "site_settings" ? (siteFieldLabels[field] ?? translation) : translation }] } });
  }
  if (collection === "site_settings") {
    const ministersField = fields.find((item) => item.field === "ministers");
    const layout = siteFieldLayout.ministers;
    if (ministersField) await request("/fields/site_settings/ministers", "PATCH", { meta: { ...ministersField.meta, group: null, sort: layout, translations: [{ language: "ko-KR", translation: siteFieldLabels.ministers }] } });
  }
}

console.log("Korean editor labels and guidance applied.");
