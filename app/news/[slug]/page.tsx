import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bulletins } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; return { title: bulletins[slug]?.title ?? "주보·소식" }; }
export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bulletin = bulletins[slug];
  if (!bulletin) notFound();
  return <div className="subpage"><main id="main-content"><section className="detail-hero detail-hero--bulletin"><div className="page-shell detail-hero__inner"><Link className="detail-back" href="/news"><span aria-hidden="true">←</span> 주보·소식</Link><div className="detail-meta"><span>{bulletin.category}</span><time>{bulletin.date}</time></div><h1>{bulletin.title}</h1><p>{bulletin.summary}</p></div></section><section className="bulletin-detail section" aria-label="주보 문서"><div className="page-shell"><div className="bulletin-document"><div className="bulletin-document__toolbar"><p>주보 문서</p><span>화면을 확대해 읽어보세요</span></div><div className="bulletin-document__page"><img src={bulletin.image} alt={`${bulletin.title} 전체 내용`} loading="lazy"/></div></div><nav className="detail-nav" aria-label="주보 탐색"><Link href="/news">모든 주보·소식 보기</Link><Link href="/worship">예배 안내 보기 <span aria-hidden="true">→</span></Link></nav></div></section></main></div>;
}
