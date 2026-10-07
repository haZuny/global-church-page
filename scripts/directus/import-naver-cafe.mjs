import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const envFile = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8").catch(() => "")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const env = { ...envFile, ...process.env };
const baseUrl = env.DIRECTUS_URL ?? "https://cms.globalchurch.kr";
const token = env.DIRECTUS_TOKEN;
const cdpUrl = env.NAVER_CAFE_CDP_URL ?? "http://127.0.0.1:9222";
if (!token) throw new Error("DIRECTUS_TOKEN is required.");

const statePath = new URL("../../data/naver-cafe-import.json", import.meta.url);
await mkdir(new URL("../../data/", import.meta.url), { recursive: true });
const state = JSON.parse(await readFile(statePath, "utf8").catch(() => "{\"completed\":[]}"));
const completed = new Set(state.completed);
const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { authorization: `Bearer ${token}`, ...(options.headers ?? {}) }, signal: AbortSignal.timeout(30_000) });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${path} (${response.status}): ${json.errors?.[0]?.message ?? "요청 실패"}`);
  return json.data;
};
const categoryFor = (menu) => ({ "사진": ["stories", "공동체"], "소식": ["news_items"], "공지사항": ["news_items"], "주보": ["bulletins", "주보"], "자료실": ["bulletins", "자료"] })[menu];
const toPublishedAt = (value) => {
  const parts = value.match(/(\d{4})\.(\d{2})\.(\d{2})\.\s*(\d{2}):(\d{2})/);
  if (!parts) throw new Error(`게시일 형식을 읽을 수 없습니다: ${value}`);
  return `${parts[1]}-${parts[2]}-${parts[3]}T${parts[4]}:${parts[5]}:00+09:00`;
};
const browser = await chromium.connectOverCDP(cdpUrl);
const context = browser.contexts()[0];
const page = await context.newPage();
const existingTitles = new Set();
for (const collection of ["stories", "news_items", "bulletins"]) {
  for (const item of await request(`/items/${collection}?fields=title&limit=-1`)) existingTitles.add(item.title);
}
const links = [];
for (let pageNumber = 1; pageNumber <= 30; pageNumber += 1) {
  await page.goto(`https://cafe.naver.com/f-e/cafes/31143929/menus/0?viewType=L&page=${pageNumber}`, { waitUntil: "domcontentloaded" });
  await page.locator("a.article").first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => undefined);
  if ((await page.locator("body").innerText()).includes("카페 가입하기")) throw new Error("현재 Chrome 프로필에서 네이버 로그인 또는 카페 가입을 확인하세요.");
  const rows = await page.locator("tr").evaluateAll((elements) => elements.map((row) => {
    const article = row.querySelector("a.article[href*='/articles/']");
    const menu = row.querySelector("a.board_name");
    return article && menu ? { href: article.href, title: article.textContent.trim(), menu: menu.textContent.trim() } : null;
  }).filter(Boolean));
  if (!rows.length) break;
  links.push(...rows);
}
if (!links.length) throw new Error("카페 게시글을 찾지 못했습니다. 현재 Chrome 프로필의 로그인·가입 상태를 확인하세요.");
for (const item of links) {
  const target = categoryFor(item.menu);
  const sourceId = item.href.match(/articles\/(\d+)/)?.[1];
  if (!target || !sourceId || completed.has(sourceId)) continue;
  if (existingTitles.has(item.title)) { completed.add(sourceId); state.completed = [...completed]; await writeFile(statePath, JSON.stringify(state, null, 2)); continue; }
  await page.goto(item.href);
  const frame = page.frameLocator("#cafe_main");
  const title = await frame.locator(".title_text").innerText();
  const date = await frame.locator(".article_info .date").innerText();
  const text = (await frame.locator(".se-main-container").innerText().catch(() => "")).replace(/\n{3,}/g, "\n\n").trim();
  const images = await frame.locator(".se-main-container img").evaluateAll((els) => els.map((image) => image.currentSrc || image.src).filter(Boolean));
  const ids = [];
  for (const url of images) {
    try {
      const file = await request("/files/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
      ids.push(file.id);
      await request("/items/content_assets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ file: file.id, status: "published" }) });
    } catch (error) {
      console.warn(`이미지 건너뜀 (${title}): ${error.message}`);
    }
  }
  const body = `${text ? `<p>${text.replace(/\n/g, "<br>")}</p>` : ""}${ids.map((id) => `<p><img src=\"${baseUrl}/assets/${id}\" alt=\"${title}\"></p>`).join("")}`;
  const publishedAt = toPublishedAt(date);
  const payload = target[0] === "stories" ? { title, body, category: target[1], status: "published", published_at: publishedAt } : target[0] === "bulletins" ? { title, body, category: target[1], status: "published", published_at: publishedAt } : { title, body, status: "published", published_at: publishedAt };
  await request(`/items/${target[0]}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  existingTitles.add(title);
  completed.add(sourceId); state.completed = [...completed]; await writeFile(statePath, JSON.stringify(state, null, 2));
}
