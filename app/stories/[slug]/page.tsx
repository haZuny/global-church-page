import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentState } from "@/components/content-state/content-state";
import { getStory } from "@/lib/directus-content";
import { RichText } from "@/components/rich-text/rich-text";
import { absoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; try { const story = await getStory(slug); return { title: story?.title ?? "교회 이야기", description: story ? `${story.title} | 글로벌교회 교회 이야기` : undefined, alternates: { canonical: `/stories/${slug}` }, openGraph: story ? { type: "article", url: absoluteUrl(`/stories/${slug}`), title: story.title, description: `${story.title} | 글로벌교회 교회 이야기`, images: story.image ? [{ url: story.image, alt: story.alt }] : undefined } : undefined }; } catch { return { title: "교회 이야기", alternates: { canonical: `/stories/${slug}` } }; } }
export default async function StoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let story: Awaited<ReturnType<typeof getStory>>;
  try { story = await getStory(slug); } catch { return <div className="subpage"><main id="main-content" tabIndex={-1} className="section"><div className="page-shell"><ContentState title="교회 이야기를 불러오지 못했습니다." description="잠시 후 다시 시도해 주세요."/></div></main></div>; }
  if (!story) notFound();
  return <div className="subpage"><main id="main-content" tabIndex={-1}><section className="detail-hero detail-hero--story"><div className="page-shell detail-hero__inner"><Link className="detail-back" href="/stories"><span aria-hidden="true">←</span> 교회 이야기</Link><div className="detail-meta"><time dateTime={story.dateTime}>{story.date}</time></div><h1>{story.title}</h1></div></section><article className="story-detail section"><div className="page-shell">{story.body ? <RichText html={story.body} className="story-detail__body"/> : <div className="story-detail__body"><ContentState title="등록된 본문이 없습니다." description="내용을 준비하고 있습니다."/></div>}<nav className="detail-nav" aria-label="교회 이야기 탐색"><Link href="/stories">모든 이야기 보기</Link></nav></div></article></main></div>;
}
