import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewsEntry } from "@/lib/directus-content";
import { RichText } from "@/components/rich-text/rich-text";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; return { title: (await getNewsEntry(slug))?.title ?? "주보·소식" }; }
export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getNewsEntry(slug);
  if (!entry) notFound();
  const content = <>{entry.kind === "bulletin" && entry.image && <div className="bulletin-document"><div className="bulletin-document__toolbar"><p>주보 문서</p><span>화면을 확대해 읽어보세요</span></div><div className="bulletin-document__page"><Image src={entry.image} alt={`${entry.title} 전체 내용`} width={840} height={594} unoptimized sizes="(max-width: 1040px) 100vw, 1040px"/></div></div>}{entry.body ? <RichText html={entry.body} className="story-detail__body"/> : !entry.image && <div className="story-detail__body"><p>등록된 본문이 없습니다.</p></div>}</>;
  return <div className="subpage"><main id="main-content"><section className="detail-hero detail-hero--bulletin"><div className="page-shell detail-hero__inner"><Link className="detail-back" href="/news"><span aria-hidden="true">←</span> 주보·소식</Link><div className="detail-meta"><span>{entry.category}</span><time dateTime={entry.dateTime}>{entry.date}</time></div><h1>{entry.title}</h1></div></section><section className="bulletin-detail section" aria-label={entry.category}><div className="page-shell">{content}<nav className="detail-nav" aria-label="주보·소식 탐색"><Link href="/news">모든 주보·소식 보기</Link></nav></div></section></main></div>;
}
