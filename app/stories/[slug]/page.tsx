import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStory } from "@/lib/directus-content";
import { RichText } from "@/components/rich-text/rich-text";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; return { title: (await getStory(slug))?.title ?? "교회 이야기" }; }
export default async function StoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) notFound();
  const images = story.media;
  return <div className="subpage"><main id="main-content"><section className="detail-hero detail-hero--story"><div className="page-shell detail-hero__inner"><Link className="detail-back" href="/stories"><span aria-hidden="true">←</span> 교회 이야기</Link><div className="detail-meta"><time dateTime={story.dateTime}>{story.date}</time></div><h1>{story.title}</h1></div></section><article className="story-detail section"><div className="page-shell">{images.map((image, index) => <figure className="story-detail__visual" key={`${image.image}-${index}`}><Image src={image.image} alt={image.alt} width={1600} height={1067} unoptimized sizes="(max-width: 980px) 100vw, 940px"/></figure>)}<RichText html={story.body} className="story-detail__body"/><nav className="detail-nav" aria-label="교회 이야기 탐색"><Link href="/stories">모든 이야기 보기</Link></nav></div></article></main></div>;
}
