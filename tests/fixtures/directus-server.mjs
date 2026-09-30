import { createServer } from "node:http";

const port = Number(process.env.TEST_DIRECTUS_PORT || 8056);
let shouldFail = false;

const siteSettings = {
  church_name: "글로벌교회",
  english_name: "Global Community Church",
  hero_title: "시흥에서 함께 예배하고 함께 자라는 공동체",
  hero_copy: "처음 오신 분도 편안히 예배에 참여하실 수 있습니다.",
  introduction: "시흥에서 함께 예배하고 자라는 공동체입니다.",
  greeting_title: "말씀과 삶을 함께 세워 갑니다.",
  greeting_lead: "한 사람의 걸음을 소중히 여기며 함께합니다.",
  greeting_body: "글로벌교회는 예배와 일상에서 함께 자라갑니다.",
  pastor_name: "권오선",
  pastor_role: "담임목사",
  about_title: "시흥에서 함께 예배하고 함께 자라는 공동체",
  denomination_history: "대한예수교장로회(합동) 서울강서노회 소속입니다.",
  address: "경기 시흥시 하상로8번길 12-1",
  phone: "031-318-5791",
  transit_info: "서해선 시흥시청역 하차",
  parking_info: "교회 앞 공영주차장을 이용해 주세요.",
  map_url: "https://map.example.test/global-church",
  show_sermons: false,
};

const stories = [
  { id: 101, title: "함께한 주일의 기록", category: "장년부", body: "함께 예배하고 식탁을 나누었습니다.", published_at: "2026-09-25T00:00:00.000Z" },
  { id: 102, title: "청소년부 가을 모임", category: "교육부서", body: "다음 세대가 함께 이야기했습니다.", published_at: "2026-09-20T00:00:00.000Z" },
];

const bulletins = [
  { id: 301, title: "9월 넷째 주 주보", category: "주보", body: "이번 주 예배 순서입니다.", published_at: "2026-09-24T00:00:00.000Z" },
  { id: 302, title: "새가족 안내 자료", category: "자료", body: "방문 전 참고할 자료입니다.", published_at: "2026-09-10T00:00:00.000Z" },
];

const notices = [
  { id: 201, title: "추석 예배 안내", body: "예배 시간과 방문 안내를 확인해 주세요.", published_at: "2026-09-26T00:00:00.000Z" },
  { id: 202, title: "주차 안내", body: "주차장 이용 방법을 안내합니다.", published_at: "2026-09-18T00:00:00.000Z" },
];

const ministers = [{ id: 1, name: "김민", role: "교육목사", description: "다음 세대와 함께 예배합니다.", status: "published", sort: 1 }];

const page = (items, url) => {
  const limit = Number(url.searchParams.get("limit") || items.length || 1);
  const offset = Number(url.searchParams.get("offset") || 0);
  const category = url.searchParams.get("filter[category][_eq]");
  const id = url.searchParams.get("filter[id][_eq]");
  const filteredByCategory = category ? items.filter((item) => item.category === category) : items;
  const filtered = id ? filteredByCategory.filter((item) => String(item.id) === id) : filteredByCategory;
  return { data: filtered.slice(offset, offset + limit), meta: { filter_count: filtered.length } };
};

const collectionPayload = (collection, url) => {
  if (collection === "stories") return page(stories, url);
  if (collection === "bulletins") return page(bulletins, url);
  if (collection === "news_items") return page(notices, url);
  if (collection === "church_ministers") return page(ministers, url);
  if (collection === "story_media" || collection === "bulletin_media") return { data: [] };
  if (collection === "sermons") return { data: [] };
  return { data: [] };
};

createServer((request, response) => {
  const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);
  if (url.pathname === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }
  if (url.pathname === "/test/failure") {
    shouldFail = url.searchParams.get("enabled") === "1";
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ shouldFail }));
    return;
  }
  if (shouldFail && url.pathname.startsWith("/items/")) {
    response.writeHead(503, { "content-type": "application/json" });
    response.end(JSON.stringify({ errors: [{ message: "Test content service unavailable" }] }));
    return;
  }
  if (url.pathname === "/items/site_settings") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ data: siteSettings }));
    return;
  }
  const match = /^\/items\/([^/]+)$/.exec(url.pathname);
  if (match) {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(collectionPayload(match[1], url)));
    return;
  }
  response.writeHead(404);
  response.end();
}).listen(port, "127.0.0.1");
