export type StoryBlock = { type: "note" | "quote" | "text"; text: string };
export type StoryImage = { image: string; alt: string };
export type StoryEntry = { id: number; date: string; dateTime: string; title: string; summary: string; image: string; imageWidth: number; imageHeight: number; alt: string; blocks: StoryBlock[]; media: StoryImage[] };
export type BulletinEntry = { id: number; title: string; date: string; category: string; summary: string; image: string; imageWidth: number; imageHeight: number };
export type NewsEntry = { kind: "bulletin" | "notice"; id: number; href: string; title: string; date: string; dateTime: string; category: string; summary: string; image?: string; imageWidth?: number; imageHeight?: number; body: string[] };
export type SermonEntry = { id: number; title: string; summary: string; scripture: string; preacher: string; date: string; dateTime: string; video?: string };

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

export async function getStories() {
  const [items, mediaItems] = await Promise.all([readCollection<any>("stories?sort=-published_at&limit=-1"), readCollection<any>("story_media?sort=sort&limit=-1")]);
  return items.map((item): StoryEntry => {
    const media = mediaItems.filter((media) => media.story === item.id).map((media) => ({ image: `${directusAssetsUrl}/assets/${media.file}`, alt: media.alt || item.title }));
    const image = media[0]?.image ?? (item.cover_image ? `${directusAssetsUrl}/assets/${item.cover_image}` : item.cover_image_url);
    return { id: item.id, date: dateLabel(item.published_at), dateTime: item.published_at.slice(0, 10), title: item.title, summary: item.summary, image, imageWidth: item.cover_image_width ?? 1600, imageHeight: item.cover_image_height ?? 1067, alt: media[0]?.alt ?? item.cover_alt ?? item.title, blocks: storyBlocks(item.body), media };
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
