import { plainTextToRichText } from "@/lib/rich-text";

export type StoryImage = { image: string; alt: string };
export type StoryEntry = { id: number; date: string; dateTime: string; title: string; image: string; alt: string; body: string; media: StoryImage[] };
export type BulletinEntry = { id: number; title: string; date: string; category: string; image: string; body: string };
export type NewsEntry = { kind: "bulletin" | "notice"; id: number; href: string; title: string; date: string; dateTime: string; category: string; image?: string; body: string };
export type SermonEntry = { id: number; title: string; summary: string; scripture: string; preacher: string; date: string; dateTime: string; video?: string };
export type ChurchInfo = { churchName: string; englishName: string; heroTitle: string; heroCopy: string; introduction: string; greetingTitle: string; greetingLead: string; greetingBody: string; pastorName: string; aboutTitle: string; visionTitle: string; visionIntro: string; visions: { title: string; body: string }[]; denominationName: string; denominationIntro: string; denominationDetail: string; address: string; mapUrl?: string; phone?: string; transitInfo?: string; parkingInfo?: string };
export type Minister = { id: number; name: string; role: string; description: string; photo?: string };
export type WorshipService = { id: number; name: string; weekdays: string[]; time: string };

const directusUrl = process.env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const directusAssetsUrl = process.env.DIRECTUS_ASSETS_URL ?? directusUrl;
const dateLabel = (value: string) => value.slice(0, 10).replaceAll("-", ". ");

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
    greetingBody: plainTextToRichText(item.greeting_body),
    pastorName: item.pastor_name || "",
    aboutTitle: item.about_title || item.church_name,
    visionTitle: item.vision_title || "",
    visionIntro: plainTextToRichText(item.vision_intro),
    visions: [[item.vision_one_title, item.vision_one_body], [item.vision_two_title, item.vision_two_body], [item.vision_three_title, item.vision_three_body]].filter(([title]) => title).map(([title, body]) => ({ title, body: plainTextToRichText(body) })),
    denominationName: item.denomination_name || "",
    denominationIntro: item.denomination_intro || "",
    denominationDetail: plainTextToRichText(item.denomination_detail),
    address: item.address,
    mapUrl: item.map_url || undefined,
    phone: item.phone || undefined,
    transitInfo: item.transit_info || undefined,
    parkingInfo: item.parking_info || undefined,
  };
}

export async function getMinisters(): Promise<Minister[]> {
  const items = await readCollection<any>("church_ministers?sort=sort&limit=-1");
  return items.map((item) => ({ id: item.id, name: item.name, role: item.role, description: item.description || "", photo: item.photo ? `${directusAssetsUrl}/assets/${item.photo}` : undefined }));
}

export async function getWorshipServices(): Promise<WorshipService[]> {
  const items = await readCollection<any>("worship_services?sort=sort&limit=-1");
  return items.map((item) => ({ id: item.id, name: item.name, weekdays: Array.isArray(item.weekdays) ? item.weekdays : [], time: clockLabel(item.start_time) }));
}

export async function getStories() {
  const [items, mediaItems] = await Promise.all([readCollection<any>("stories?sort=-published_at&limit=-1"), readCollection<any>("story_media?sort=sort&limit=-1")]);
  return items.map((item): StoryEntry => {
    const media = mediaItems.filter((media) => media.story === item.id).map((media) => ({ image: `${directusAssetsUrl}/assets/${media.file}`, alt: media.alt || item.title }));
    const latestMedia = media.at(-1);
    return { id: item.id, date: dateLabel(item.published_at), dateTime: item.published_at.slice(0, 10), title: item.title, image: latestMedia?.image ?? "", alt: latestMedia?.alt ?? item.title, body: plainTextToRichText(item.body), media };
  });
}

export async function getStory(id: string) {
  return (await getStories()).find((story) => story.id === Number(id));
}

export async function getBulletins() {
  const [items, mediaItems] = await Promise.all([readCollection<any>("bulletins?sort=-published_at&limit=-1"), readCollection<any>("bulletin_media?sort=sort&limit=-1")]);
  return items.map((item): BulletinEntry => {
    const media = mediaItems.find((media) => media.bulletin === item.id);
    return { id: item.id, title: item.title, date: dateLabel(item.published_at), category: item.category, image: media ? `${directusAssetsUrl}/assets/${media.file}` : "", body: plainTextToRichText(item.body) };
  });
}

export async function getBulletin(id: string) {
  return (await getBulletins()).find((bulletin) => bulletin.id === Number(id));
}

export async function getNewsEntries(): Promise<NewsEntry[]> {
  const [bulletins, notices] = await Promise.all([
    getBulletins(),
    readCollection<any>("news_items?sort=-published_at&limit=-1"),
  ]);
  return [
    ...bulletins.map((item) => ({ kind: "bulletin" as const, id: item.id, href: `b-${item.id}`, title: item.title, date: item.date, dateTime: item.date.replaceAll(". ", "-"), category: item.category, image: item.image || undefined, body: item.body })),
    ...notices.map((item) => ({ kind: "notice" as const, id: item.id, href: `n-${item.id}`, title: item.title, date: dateLabel(item.published_at), dateTime: item.published_at.slice(0, 10), category: "공지", body: plainTextToRichText(item.body) })),
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
