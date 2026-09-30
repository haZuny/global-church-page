import { plainTextToRichText } from "@/lib/rich-text";

export type StoryImage = { image: string; alt: string };
export type StoryEntry = { id: number; category: "장년부" | "교육부서"; date: string; dateTime: string; title: string; image: string; alt: string; body: string; media: StoryImage[] };
export type BulletinAttachment = { id: string; name: string; title?: string; type: string; size?: number; width?: number; height?: number; url: string };
export type BulletinEntry = { id: number; title: string; date: string; category: string; image: string; body: string; attachments: BulletinAttachment[] };
export type NewsEntry = { kind: "bulletin" | "notice"; id: number; href: string; title: string; date: string; dateTime: string; category: string; image?: string; body: string; attachments?: BulletinAttachment[] };
export type SermonEntry = { id: number; title: string; summary: string; scripture: string; preacher: string; date: string; dateTime: string; video?: string };
export type ChurchInfo = { churchName: string; englishName: string; heroTitle: string; heroCopy: string; introduction: string; pastorTitle: string; pastorLead: string; pastorBody: string; pastorName: string; pastorRole: string; pastorPhoto?: string; aboutTitle: string; denominationHistory: string; address: string; showSermons: boolean; mapUrl?: string; phone?: string; transitInfo?: string; parkingInfo?: string };
export type Minister = { id: number; name: string; role: string; description: string; photo?: string };
export type PageResult<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };
export type StoryCategory = "장년부" | "교육부서";
export type NewsCategory = "전체" | "주보" | "공지" | "자료";
export type ContentImagePreset = "home-preview" | "story-feature" | "story-card" | "story-detail" | "news-feature" | "resource-preview" | "document" | "profile";

export const fallbackChurchInfo: ChurchInfo = {
  churchName: "글로벌교회", englishName: "Global Community Church", heroTitle: "시흥에서 함께 예배하고 함께 자라는 공동체", heroCopy: "예배와 일상에서 함께 질문하고 자라갑니다.", introduction: "시흥에서 함께 예배하고 자라는 공동체입니다.", pastorTitle: "글로벌교회를 찾아주신 여러분을 환영합니다.", pastorLead: "처음 오신 분도 편안히 머물 수 있도록 돕겠습니다.", pastorBody: "", pastorName: "", pastorRole: "담임목사", aboutTitle: "시흥에서 함께 예배하고 함께 자라는 공동체", denominationHistory: "", address: "주소를 준비하고 있습니다.", showSermons: false,
};

const directusUrl = process.env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const directusAssetsUrl = process.env.DIRECTUS_ASSETS_URL ?? directusUrl;
const dateLabel = (value: string) => value.slice(0, 10).replaceAll("-", ". ");
const assetUrl = (file: unknown) => {
  const id = typeof file === "string" ? file : typeof file === "object" && file !== null && "id" in file && typeof file.id === "string" ? file.id : undefined;
  return id ? `${directusAssetsUrl}/assets/${id}` : undefined;
};
const imageTransforms: Record<ContentImagePreset, { width: number; height?: number; fit?: "cover" | "contain"; quality: number }> = {
  "home-preview": { width: 1280, height: 800, fit: "cover", quality: 82 },
  "story-feature": { width: 1200, height: 900, fit: "cover", quality: 84 },
  "story-card": { width: 960, height: 720, fit: "cover", quality: 80 },
  "story-detail": { width: 1600, height: 1200, fit: "cover", quality: 86 },
  "news-feature": { width: 960, height: 1200, fit: "cover", quality: 84 },
  "resource-preview": { width: 960, height: 720, fit: "cover", quality: 80 },
  document: { width: 1400, fit: "contain", quality: 88 },
  profile: { width: 960, height: 1200, fit: "cover", quality: 84 },
};

/** Keeps the uploaded original intact while requesting a size appropriate to each public frame. */
export function contentImageUrl(source: string | undefined, preset: ContentImagePreset) {
  if (!source) return undefined;
  try {
    const url = new URL(source);
    if (!url.pathname.includes("/assets/")) return source;
    const transform = imageTransforms[preset];
    url.searchParams.set("width", String(transform.width));
    if (transform.height) url.searchParams.set("height", String(transform.height));
    if (transform.fit) url.searchParams.set("fit", transform.fit);
    url.searchParams.set("quality", String(transform.quality));
    url.searchParams.set("format", "webp");
    url.searchParams.set("withoutEnlargement", "true");
    return url.toString();
  } catch {
    return source;
  }
}
export const isImageAttachment = (attachment: BulletinAttachment) => attachment.type.startsWith("image/") || /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(attachment.name);

async function readCollection<T>(path: string): Promise<T[]> {
  const response = await fetch(`${directusUrl}/items/${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Directus content request failed: ${response.status}`);
  return (await response.json()).data;
}

const normalizePage = (page: number | undefined) => Number.isFinite(page) && page && page > 0 ? Math.floor(page) : 1;

async function readCollectionPage<T>(collection: string, { page, pageSize, query = {} }: { page?: number; pageSize: number; query?: Record<string, string> }): Promise<PageResult<T>> {
  const currentPage = normalizePage(page);
  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String((currentPage - 1) * pageSize),
    meta: "filter_count",
    ...query,
  });
  const response = await fetch(`${directusUrl}/items/${collection}?${params}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Directus content request failed: ${response.status}`);
  const payload = await response.json();
  const totalItems = Number(payload.meta?.filter_count ?? payload.data.length);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems > 0 && currentPage > totalPages) {
    return readCollectionPage(collection, { page: totalPages, pageSize, query });
  }
  return { items: payload.data, page: Math.min(currentPage, totalPages), pageSize, totalItems, totalPages };
}

async function readSingleton<T>(collection: string): Promise<T> {
  const response = await fetch(`${directusUrl}/items/${collection}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Directus ${collection} request failed: ${response.status}`);
  return (await response.json()).data;
}

export async function getChurchInfo(): Promise<ChurchInfo> {
  const item = await readSingleton<any>("site_settings");
  return {
    churchName: item.church_name,
    englishName: item.english_name || item.church_name,
    heroTitle: item.hero_title || item.church_name,
    heroCopy: item.hero_copy || item.introduction,
    introduction: item.introduction,
    pastorTitle: item.greeting_title || item.church_name,
    pastorLead: item.greeting_lead || "",
    pastorBody: plainTextToRichText(item.greeting_body),
    pastorName: item.pastor_name || "",
    pastorRole: item.pastor_role || "담임목사",
    pastorPhoto: assetUrl(item.pastor_photo),
    aboutTitle: item.about_title || item.church_name,
    denominationHistory: plainTextToRichText(item.denomination_history),
    showSermons: Boolean(item.show_sermons),
    address: item.address,
    mapUrl: item.map_url || undefined,
    phone: item.phone || undefined,
    transitInfo: item.transit_info || undefined,
    parkingInfo: item.parking_info || undefined,
  };
}

export async function getMinisters(): Promise<Minister[]> {
  const items = await readCollection<any>("church_ministers?filter[status][_eq]=published&sort=sort&limit=-1");
  return items.map((item) => ({ id: item.id, name: item.name, role: item.role, description: item.description || "", photo: assetUrl(item.photo) }));
}

function mapStories(items: any[], mediaItems: any[]) {
  return items.map((item): StoryEntry => {
    const media = mediaItems.filter((media) => media.story === item.id).map((media) => ({ image: `${directusAssetsUrl}/assets/${media.file}`, alt: item.title }));
    const latestMedia = media.at(-1);
    return { id: item.id, category: item.category === "교육부서" ? "교육부서" : "장년부", date: dateLabel(item.published_at), dateTime: item.published_at.slice(0, 10), title: item.title, image: latestMedia?.image ?? "", alt: item.title, body: plainTextToRichText(item.body), media };
  });
}

export async function getStoriesPage({ category, page, pageSize }: { category?: StoryCategory; page?: number; pageSize: number }): Promise<PageResult<StoryEntry>> {
  const storyPage = await readCollectionPage<any>("stories", { page, pageSize, query: { sort: "-published_at", ...(category ? { "filter[category][_eq]": category } : {}) } });
  const storyIds = storyPage.items.map((item) => item.id);
  const mediaItems = storyIds.length ? await readCollection<any>(`story_media?sort=sort&limit=-1&filter[story][_in]=${storyIds.join(",")}`) : [];
  return { ...storyPage, items: mapStories(storyPage.items, mediaItems) };
}

export async function getStory(id: string) {
  const items = await readCollection<any>(`stories?filter[id][_eq]=${encodeURIComponent(id)}&limit=1`);
  if (!items.length) return undefined;
  const mediaItems = await readCollection<any>(`story_media?sort=sort&limit=-1&filter[story][_eq]=${items[0].id}`);
  return mapStories(items, mediaItems)[0];
}

function mapBulletins(items: any[], mediaItems: any[]) {
  return items.map((item): BulletinEntry => {
    const attachments = mediaItems.filter((media) => media.bulletin === item.id).flatMap((media): BulletinAttachment[] => {
      const file = typeof media.file === "string" ? { id: media.file, filename_download: "첨부 파일", type: "" } : media.file;
      if (!file?.id) return [];
      return [{ id: file.id, name: file.filename_download || "첨부 파일", title: file.title || undefined, type: file.type || "", size: file.filesize || undefined, width: file.width || undefined, height: file.height || undefined, url: `${directusAssetsUrl}/assets/${file.id}` }];
    });
    const image = attachments.find(isImageAttachment);
    return { id: item.id, title: item.title, date: dateLabel(item.published_at), category: item.category, image: image?.url ?? "", body: plainTextToRichText(item.body), attachments };
  });
}

export async function getBulletinsPage({ category, page, pageSize }: { category?: Exclude<NewsCategory, "전체" | "공지">; page?: number; pageSize: number }): Promise<PageResult<BulletinEntry>> {
  const bulletinPage = await readCollectionPage<any>("bulletins", { page, pageSize, query: { sort: "-published_at", ...(category ? { "filter[category][_eq]": category } : {}) } });
  const bulletinIds = bulletinPage.items.map((item) => item.id);
  const mediaItems = bulletinIds.length ? await readCollection<any>(`bulletin_media?sort=sort&limit=-1&fields=bulletin,file.id,file.type,file.filename_download,file.filesize,file.title,file.width,file.height&filter[bulletin][_in]=${bulletinIds.join(",")}`) : [];
  return { ...bulletinPage, items: mapBulletins(bulletinPage.items, mediaItems) };
}

export async function getBulletin(id: string) {
  const items = await readCollection<any>(`bulletins?filter[id][_eq]=${encodeURIComponent(id)}&limit=1`);
  if (!items.length) return undefined;
  const mediaItems = await readCollection<any>(`bulletin_media?sort=sort&limit=-1&fields=bulletin,file.id,file.type,file.filename_download,file.filesize,file.title,file.width,file.height&filter[bulletin][_eq]=${items[0].id}`);
  return mapBulletins(items, mediaItems)[0];
}

const mapBulletinsToNews = (items: BulletinEntry[]): NewsEntry[] => items.map((item) => ({ kind: "bulletin", id: item.id, href: `b-${item.id}`, title: item.title, date: item.date, dateTime: item.date.replaceAll(". ", "-"), category: item.category, image: item.image || undefined, body: item.body, attachments: item.attachments }));
const mapNoticesToNews = (items: any[]): NewsEntry[] => items.map((item) => ({ kind: "notice", id: item.id, href: `n-${item.id}`, title: item.title, date: dateLabel(item.published_at), dateTime: item.published_at.slice(0, 10), category: "공지", body: plainTextToRichText(item.body) }));

async function getNoticesPage({ page, pageSize }: { page?: number; pageSize: number }): Promise<PageResult<NewsEntry>> {
  const noticePage = await readCollectionPage<any>("news_items", { page, pageSize, query: { sort: "-published_at" } });
  return { ...noticePage, items: mapNoticesToNews(noticePage.items) };
}

export async function getNewsEntriesPage({ category = "전체", page, pageSize }: { category?: NewsCategory; page?: number; pageSize: number }): Promise<PageResult<NewsEntry>> {
  if (category === "공지") return getNoticesPage({ page, pageSize });
  if (category === "주보" || category === "자료") {
    const bulletins = await getBulletinsPage({ category, page, pageSize });
    return { ...bulletins, items: mapBulletinsToNews(bulletins.items) };
  }

  const currentPage = normalizePage(page);
  const [bulletinCount, noticeCount] = await Promise.all([
    readCollectionPage<any>("bulletins", { page: 1, pageSize: 1, query: { sort: "-published_at" } }),
    readCollectionPage<any>("news_items", { page: 1, pageSize: 1, query: { sort: "-published_at" } }),
  ]);
  const totalItems = bulletinCount.totalItems + noticeCount.totalItems;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const requiredItems = safePage * pageSize;
  const [bulletins, notices] = await Promise.all([
    getBulletinsPage({ page: 1, pageSize: requiredItems }),
    getNoticesPage({ page: 1, pageSize: requiredItems }),
  ]);
  const items = [...mapBulletinsToNews(bulletins.items), ...notices.items]
    .sort((a, b) => b.dateTime.localeCompare(a.dateTime))
    .slice((safePage - 1) * pageSize, safePage * pageSize);
  return { items, page: safePage, pageSize, totalItems, totalPages };
}

export async function getNewsEntry(key: string) {
  const match = /^(b|n)-(\d+)$/.exec(key);
  if (!match) return undefined;
  if (match[1] === "b") {
    const bulletin = await getBulletin(match[2]);
    return bulletin ? mapBulletinsToNews([bulletin])[0] : undefined;
  }
  const notices = await readCollection<any>(`news_items?filter[id][_eq]=${match[2]}&limit=1`);
  return mapNoticesToNews(notices)[0];
}

export async function getSermons() {
  const items = await readCollection<any>("sermons?sort=-sermon_date&limit=-1");
  return items.map((item): SermonEntry => ({ id: item.id, title: item.title, summary: item.summary, scripture: item.scripture, preacher: item.preacher, date: dateLabel(item.sermon_date), dateTime: item.sermon_date, video: item.video_file ? `${directusAssetsUrl}/assets/${item.video_file}` : undefined }));
}

export async function getSermon(id: string) {
  return (await getSermons()).find((sermon) => sermon.id === Number(id));
}
