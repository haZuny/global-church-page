import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSermon } from "@/lib/directus-content";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; return { title: (await getSermon(slug))?.title ?? "설교" }; }

export default async function SermonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sermon = await getSermon(slug);
  if (!sermon) notFound();
  return <div className="subpage"><main id="main-content"><section className="detail-hero detail-hero--story"><div className="page-shell detail-hero__inner"><Link className="detail-back" href="/sermons"><span aria-hidden="true">←</span> 설교</Link><div className="detail-meta"><time dateTime={sermon.dateTime}>{sermon.date}</time></div><h1>{sermon.title}</h1><p className="detail-subtitle">{sermon.scripture}</p><p>{sermon.summary}</p></div></section><article className="sermon-archive section" aria-label="설교 내용"><div className="page-shell"><article className="sermon-feature"><div className="sermon-art" aria-label={sermon.video ? "설교 영상" : "설교 영상이 아직 없습니다."}>{sermon.video ? <video controls preload="metadata" src={sermon.video}>이 브라우저에서는 영상을 재생할 수 없습니다.</video> : <><span className="sermon-art__book">{sermon.scripture}</span><span className="sermon-art__verse">{sermon.date}</span><span className="sermon-art__caption">VIDEO 준비 중</span></>}</div><div className="sermon__content"><h2>{sermon.title}</h2><p className="sermon__summary">{sermon.summary}</p><dl className="sermon__info"><div><dt>말씀</dt><dd>{sermon.scripture}</dd></div><div><dt>설교자</dt><dd>{sermon.preacher}</dd></div><div><dt>날짜</dt><dd>{sermon.date}</dd></div></dl></div></article><nav className="detail-nav" aria-label="설교 탐색"><Link href="/sermons">모든 설교 보기</Link></nav></div></article></main></div>;
}
