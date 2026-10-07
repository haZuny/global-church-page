import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import { defaultDirectusUrl, defaultNaverCafeCdpUrl } from "./local-development.mjs";

const envFile = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8").catch(() => "")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const env = { ...envFile, ...process.env };
const baseUrl = env.DIRECTUS_URL ?? defaultDirectusUrl;
const token = env.DIRECTUS_TOKEN;
if (!token) throw new Error("DIRECTUS_TOKEN is required.");

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { authorization: `Bearer ${token}`, ...(options.headers ?? {}) }, signal: AbortSignal.timeout(30_000) });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${path} (${response.status}): ${json.errors?.[0]?.message ?? "요청 실패"}`);
  return json.data;
};
const toPublishedAt = (value) => {
  const parts = value.match(/(\d{4})\.(\d{2})\.(\d{2})\.\s*(\d{2}):(\d{2})/);
  if (!parts) throw new Error(`게시일 형식을 읽을 수 없습니다: ${value}`);
  return `${parts[1]}-${parts[2]}-${parts[3]}T${parts[4]}:${parts[5]}:00+09:00`;
};
const bulletinKey = (title, publishedAt) => `${title}\u0000${new Date(publishedAt).getTime()}`;
const statePath = new URL("../../data/naver-bulletin-file-repair.json", import.meta.url);
const state = JSON.parse(await readFile(statePath, "utf8").catch(() => "{\"completed\":[]}"));
const completed = new Set(state.completed);
const bulletins = await request("/items/bulletins?fields=id,title,published_at,body&limit=-1");
const byKey = new Map(bulletins.map((item) => [bulletinKey(item.title, item.published_at), item]));
const browser = await chromium.connectOverCDP(env.NAVER_CAFE_CDP_URL ?? defaultNaverCafeCdpUrl);
const page = await browser.contexts()[0].newPage();
const articles = [];
for (let pageNumber = 1; pageNumber <= 30; pageNumber += 1) {
  await page.goto(`https://cafe.naver.com/f-e/cafes/31143929/menus/0?viewType=L&page=${pageNumber}`, { waitUntil: "domcontentloaded" });
  await page.locator("a.article").first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => undefined);
  const rows = await page.locator("tr").evaluateAll((elements) => elements.map((row) => {
    const article = row.querySelector("a.article[href*='/articles/']");
    const menu = row.querySelector("a.board_name")?.textContent.trim();
    return article && (menu === "주보" || menu === "자료실") ? { href: article.href } : null;
  }).filter(Boolean));
  if (!rows.length) break;
  articles.push(...rows);
}
for (const article of articles) {
  const sourceId = article.href.match(/articles\/(\d+)/)?.[1];
  if (!sourceId || completed.has(sourceId)) continue;
  await page.goto(article.href, { waitUntil: "domcontentloaded" });
  const frame = page.frameLocator("#cafe_main");
  const title = await frame.locator(".title_text").innerText();
  const publishedAt = toPublishedAt(await frame.locator(".article_info .date").innerText());
  const bulletin = byKey.get(bulletinKey(title, publishedAt));
  if (!bulletin) { console.warn(`게시물 찾지 못함: ${title}`); continue; }
  const files = await frame.locator(".se-section-file").evaluateAll((sections) => sections.map((section) => {
    const name = section.querySelector(".se-file-name")?.textContent.trim() ?? "첨부파일";
    const extension = section.querySelector(".se-file-extension")?.textContent.trim() ?? "";
    const url = section.querySelector("a.se-file-save-button")?.href;
    return url ? { name: `${name}${extension}`, url } : null;
  }).filter(Boolean));
  const text = (await frame.locator(".se-main-container .se-section:not(.se-section-file)").allInnerTexts()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  await request(`/items/bulletins/${bulletin.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: text ? `<p>${text.replace(/\n/g, "<br>")}</p>` : "" }) });
  const existing = await request(`/items/bulletin_media?filter[bulletin][_eq]=${bulletin.id}&fields=file.id&limit=-1`);
  if (!existing.length) for (let index = 0; index < files.length; index += 1) {
    const file = await request("/files/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: files[index].url }) });
    await request(`/files/${file.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ filename_download: files[index].name }) });
    await request("/items/bulletin_media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bulletin: bulletin.id, file: file.id, sort: index + 1 }) });
  }
  completed.add(sourceId); state.completed = [...completed]; await writeFile(statePath, JSON.stringify(state, null, 2));
}
