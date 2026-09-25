export type StoryBlock = { type: "note" | "quote" | "text"; text: string };
export type StoryImage = { image: string; alt: string };
export type StoryEntry = { id: number; date: string; dateTime: string; title: string; summary: string; image: string; imageWidth: number; imageHeight: number; alt: string; blocks: StoryBlock[]; media: StoryImage[] };
export type BulletinEntry = { id: number; title: string; date: string; category: string; summary: string; image: string; imageWidth: number; imageHeight: number };
export type NewsEntry = { kind: "bulletin" | "notice"; id: number; href: string; title: string; date: string; dateTime: string; category: string; summary: string; image?: string; imageWidth?: number; imageHeight?: number; body: string[] };
export type SermonEntry = { id: number; title: string; summary: string; scripture: string; preacher: string; date: string; dateTime: string; video?: string };
export type ChurchInfo = { churchName: string; englishName: string; heroTitle: string; heroCopy: string; introduction: string; greetingTitle: string; greetingLead: string; greetingBody: string[]; pastorName: string; aboutTitle: string; aboutBody: string[]; region: string; visionTitle: string; visionIntro: string; visions: { title: string; body: string }[]; visionStatement: string; denominationName: string; denominationIntro: string; denominationDetail: string[]; ministersIntro?: string; address: string; mapUrl?: string; phone?: string; transitInfo?: string; parkingInfo?: string; visitNotice?: string };
export type Minister = { id: number; name: string; role: string; description: string; photo?: string };
export type WorshipService = { id: number; name: string; weekdays: string[]; time: string; location: string; description?: string };

const directusUrl = process.env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const directusAssetsUrl = process.env.DIRECTUS_ASSETS_URL ?? directusUrl;
const dateLabel = (value: string) => value.slice(0, 10).replaceAll("-", ". ");

function storyBlocks(value: unknown): StoryBlock[] {
  if (Array.isArray(value)) return value as StoryBlock[];
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as StoryBlock[] : [{ type: "text", text: value }];
  } catch {
    return value.split(/\n+/).filter(Boolean).map((text) => ({ type: "text", text }));
  }
}

async function readCollection<T>(path: string): Promise<T[]> {
  const response = await fetch(`${directusUrl}/items/${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Directus content request failed: ${response.status}`);
  return (await response.json()).data;
}

async function readSingleton<T>(collection: string): Promise<T> {
  const response = await fetch(`${directusUrl}/items/${collection}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Directus ${collection} request failed: ${response.status}`);
  return (await response.json()).data;
}

const paragraphLines = (value: unknown) => typeof value === "string" ? value.split(/\n+/).map((line) => line.trim()).filter(Boolean) : [];
const clockLabel = (value: string) => value.slice(0, 5);

export async function getChurchInfo(): Promise<ChurchInfo> {
  const item = await readSingleton<any>("site_settings");
  return {
    churchName: item.church_name,
    englishName: item.english_name || item.church_name,
    heroTitle: item.hero_title || item.church_name,
    heroCopy: item.hero_copy || item.introduction,
    introduction: item.introduction,
    greetingTitle: item.greeting_title || item.church_name,
    greetingLead: item.greeting_lead || "",
    greetingBody: paragraphLines(item.greeting_body),
    pastorName: item.pastor_name || "",
    aboutTitle: item.about_title || item.church_name,
    aboutBody: [item.about_body, item.about_body_secondary].filter(Boolean),
    region: item.region || "",
    visionTitle: item.vision_title || "",
    visionIntro: item.vision_intro || "",
    visions: [[item.vision_one_title, item.vision_one_body], [item.vision_two_title, item.vision_two_body], [item.vision_three_title, item.vision_three_body]].filter(([title]) => title).map(([title, body]) => ({ title, body: body || "" })),
    visionStatement: item.vision_statement || "",
    denominationName: item.denomination_name || "",
    denominationIntro: item.denomination_intro || "",
    denominationDetail: paragraphLines(item.denomination_detail),
    ministersIntro: item.ministers_intro || undefined,
    address: item.address,
    mapUrl: item.map_url || undefined,
    phone: item.phone || undefined,
    transitInfo: item.transit_info || undefined,
    parkingInfo: item.parking_info || undefined,
    visitNotice: item.visit_notice || undefined,
  };
}

export async function getMinisters(): Promise<Minister[]> {
  const items = await readCollection<any>("church_ministers?sort=sort&limit=-1");
  return items.map((item) => ({ id: item.id, name: item.name, role: item.role, description: item.description || "", photo: item.photo ? `${directusAssetsUrl}/assets/${item.photo}` : undefined }));
}

export async function getWorshipServices(): Promise<WorshipService[]> {
  const items = await readCollection<any>("worship_services?sort=sort&limit=-1");
  return items.map((item) => ({ id: item.id, name: item.name, weekdays: Array.isArray(item.weekdays) ? item.weekdays : item.weekday ? [item.weekday] : [], time: clockLabel(item.start_time), location: item.location, description: item.description || undefined }));
}

export async function getStories() {
  const [items, mediaItems] = await Promise.all([readCollection<any>("stories?sort=-published_at&limit=-1"), readCollection<any>("story_media?sort=sort&limit=-1")]);
  return items.map((item): StoryEntry => {
    const media = mediaItems.filter((media) => media.story === item.id).map((media) => ({ image: `${directusAssetsUrl}/assets/${media.file}`, alt: media.alt || item.title }));
    const latestMedia = media.at(-1);
    const image = latestMedia?.image ?? (item.cover_image ? `${directusAssetsUrl}/assets/${item.cover_image}` : item.cover_image_url);
    return { id: item.id, date: dateLabel(item.published_at), dateTime: item.published_at.slice(0, 10), title: item.title, summary: item.summary, image, imageWidth: item.cover_image_width ?? 1600, imageHeight: item.cover_image_height ?? 1067, alt: latestMedia?.alt ?? item.cover_alt ?? item.title, blocks: storyBlocks(item.body), media };
  });
}

export async function getStory(id: string) {
  return (await getStories()).find((story) => story.id === Number(id));
}

export async function getBulletins() {
  const items = await readCollection<any>("bulletins?sort=-published_at&limit=-1");
  return items.map((item): BulletinEntry => ({ id: item.id, title: item.title, date: dateLabel(item.published_at), category: item.category, summary: item.summary, image: item.document_file ? `${directusAssetsUrl}/assets/${item.document_file}` : item.document_image_url, imageWidth: item.document_image_width ?? 840, imageHeight: item.document_image_height ?? 594 }));
}

export async function getBulletin(id: string) {
  return (await getBulletins()).find((bulletin) => bulletin.id === Number(id));
}

function bodyLines(value: unknown): string[] {
  if (typeof value === "string") {
    try { return bodyLines(JSON.parse(value)); } catch { return value.split(/\n+/).filter(Boolean); }
  }
  if (Array.isArray(value)) return value.flatMap(bodyLines);
  if (value && typeof value === "object") {
    const item = value as { text?: unknown; children?: unknown };
    if (typeof item.text === "string") return item.text.trim() ? [item.text] : [];
    return bodyLines(item.children);
  }
  return [];
}

export async function getNewsEntries(): Promise<NewsEntry[]> {
  const [bulletins, notices] = await Promise.all([
    getBulletins(),
    readCollection<any>("news_items?sort=-published_at&limit=-1"),
  ]);
  return [
    ...bulletins.map((item) => ({ kind: "bulletin" as const, id: item.id, href: `b-${item.id}`, title: item.title, date: item.date, dateTime: item.date.replaceAll(". ", "-"), category: item.category, summary: item.summary, image: item.image, imageWidth: item.imageWidth, imageHeight: item.imageHeight, body: [] })),
    ...notices.map((item) => ({ kind: "notice" as const, id: item.id, href: `n-${item.id}`, title: item.title, date: dateLabel(item.published_at), dateTime: item.published_at.slice(0, 10), category: "공지", summary: item.summary, body: bodyLines(item.body) })),
  ].sort((a, b) => b.dateTime.localeCompare(a.dateTime));
}

export async function getNewsEntry(key: string) {
  const match = /^(b|n)-(\d+)$/.exec(key);
  if (!match) return undefined;
  return (await getNewsEntries()).find((entry) => entry.kind === (match[1] === "b" ? "bulletin" : "notice") && entry.id === Number(match[2]));
}

export async function getSermons() {
  const items = await readCollection<any>("sermons?sort=-sermon_date&limit=-1");
  return items.map((item): SermonEntry => ({ id: item.id, title: item.title, summary: item.summary, scripture: item.scripture, preacher: item.preacher, date: dateLabel(item.sermon_date), dateTime: item.sermon_date, video: item.video_file ? `${directusAssetsUrl}/assets/${item.video_file}` : item.video_url || undefined }));
}

export async function getSermon(id: string) {
  return (await getSermons()).find((sermon) => sermon.id === Number(id));
}
