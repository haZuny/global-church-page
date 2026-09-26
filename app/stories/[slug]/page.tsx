import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentState } from "@/components/content-state/content-state";
import { getStory } from "@/lib/directus-content";
import { RichText } from "@/components/rich-text/rich-text";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; try { return { title: (await getStory(slug))?.title ?? "교회 이야기" }; } catch { return { title: "교회 이야기" }; } }
export default async function StoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let story: Awaited<ReturnType<typeof getStory>>;
  try { story = await getStory(slug); } catch { return <div className="subpage"><main id="main-content" className="section"><div className="page-shell"><ContentState title="교회 이야기를 불러오지 못했습니다." description="잠시 후 다시 시도해 주세요."/></div></main></div>; }
  if (!story) notFound();
  const images = story.media;
  return <div className="subpage"><main id="main-content"><section className="detail-hero detail-hero--story"><div className="page-shell detail-hero__inner"><Link className="detail-back" href="/stories"><span aria-hidden="true">←</span> 교회 이야기</Link><div className="detail-meta"><time dateTime={story.dateTime}>{story.date}</time></div><h1>{story.title}</h1></div></section><article className="story-detail section"><div className="page-shell">{images.map((image, index) => <figure className="story-detail__visual" key={`${image.image}-${index}`}><Image src={image.image} alt={image.alt} width={1600} height={1067} unoptimized sizes="(max-width: 980px) 100vw, 940px"/></figure>)}{!images.length && <ContentState title="등록된 사진이 없습니다." description="본문에서 자세한 이야기를 확인해 주세요."/>}{story.body ? <RichText html={story.body} className="story-detail__body"/> : <div className="story-detail__body"><ContentState title="등록된 본문이 없습니다." description="내용을 준비하고 있습니다."/></div>}<nav className="detail-nav" aria-label="교회 이야기 탐색"><Link href="/stories">모든 이야기 보기</Link></nav></div></article></main></div>;
}
