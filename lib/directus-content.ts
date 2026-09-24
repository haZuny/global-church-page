export type StoryBlock = { type: "note" | "quote" | "text"; text: string };
export type StoryEntry = { id: number; category: string; subtitle: string; date: string; dateTime: string; title: string; summary: string; image: string; imageWidth: number; imageHeight: number; alt: string; blocks: StoryBlock[] };
export type BulletinEntry = { id: number; title: string; date: string; category: string; summary: string; image: string; imageWidth: number; imageHeight: number };

const directusUrl = process.env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const directusAssetsUrl = process.env.DIRECTUS_ASSETS_URL ?? directusUrl;
const dateLabel = (value: string) => value.slice(0, 10).replaceAll("-", ". ");

async function readCollection<T>(path: string): Promise<T[]> {
  const response = await fetch(`${directusUrl}/items/${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Directus content request failed: ${response.status}`);
  return (await response.json()).data;
}

export async function getStories() {
  const items = await readCollection<any>("stories?sort=-published_at&limit=-1");
  return items.map((item): StoryEntry => ({ id: item.id, category: item.category, subtitle: item.subtitle, date: dateLabel(item.published_at), dateTime: item.published_at.slice(0, 10), title: item.title, summary: item.summary, image: item.cover_image ? `${directusAssetsUrl}/assets/${item.cover_image}` : item.cover_image_url, imageWidth: item.cover_image_width, imageHeight: item.cover_image_height, alt: item.cover_alt, blocks: typeof item.body === "string" ? JSON.parse(item.body) : item.body }));
}

export async function getStory(id: string) {
  return (await getStories()).find((story) => story.id === Number(id));
}

export async function getBulletins() {
  const items = await readCollection<any>("bulletins?sort=-published_at&limit=-1");
  return items.map((item): BulletinEntry => ({ id: item.id, title: item.title, date: dateLabel(item.published_at), category: item.category, summary: item.summary, image: item.document_image_url, imageWidth: item.document_image_width, imageHeight: item.document_image_height }));
}

export async function getBulletin(id: string) {
  return (await getBulletins()).find((bulletin) => bulletin.id === Number(id));
}
