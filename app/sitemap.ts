import type { MetadataRoute } from "next";
import { getChurchInfo, getNewsEntriesPage, getSermons, getStoriesPage } from "@/lib/directus-content";
import { absoluteUrl } from "@/lib/site-url";

const staticPages: MetadataRoute.Sitemap = [
  { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
  { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.8 },
  { url: absoluteUrl("/stories"), changeFrequency: "weekly", priority: 0.8 },
  { url: absoluteUrl("/news"), changeFrequency: "weekly", priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [churchResult, storiesResult, newsResult, sermonsResult] = await Promise.allSettled([
    getChurchInfo(),
    getStoriesPage({ page: 1, pageSize: 1000 }),
    getNewsEntriesPage({ page: 1, pageSize: 1000 }),
    getSermons(),
  ]);
  const stories = storiesResult.status === "fulfilled" ? storiesResult.value.items.map((story) => ({ url: absoluteUrl(`/stories/${story.id}`), lastModified: new Date(story.dateTime), changeFrequency: "monthly" as const, priority: 0.7 })) : [];
  const news = newsResult.status === "fulfilled" ? newsResult.value.items.map((entry) => ({ url: absoluteUrl(`/news/${entry.href}`), lastModified: new Date(entry.dateTime), changeFrequency: "monthly" as const, priority: 0.7 })) : [];
  const sermons = churchResult.status === "fulfilled" && churchResult.value.showSermons && sermonsResult.status === "fulfilled" ? [{ url: absoluteUrl("/sermons"), changeFrequency: "weekly" as const, priority: 0.7 }, ...sermonsResult.value.map((sermon) => ({ url: absoluteUrl(`/sermons/${sermon.id}`), lastModified: new Date(sermon.dateTime), changeFrequency: "monthly" as const, priority: 0.6 }))] : [];
  return [...staticPages, ...stories, ...news, ...sermons];
}
