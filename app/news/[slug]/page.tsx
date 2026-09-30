import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentState } from "@/components/content-state/content-state";
import { contentImageUrl, getNewsEntry, isImageAttachment } from "@/lib/directus-content";
import { RichText } from "@/components/rich-text/rich-text";
import { absoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
const formatFileSize = (size?: number) => {
  if (!size) return "크기 정보 없음";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  return `${(size / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};
const formatFileType = (name: string, type: string) => name.includes(".") ? name.split(".").at(-1)?.toUpperCase() || "파일" : type.split("/").at(-1)?.toUpperCase() || "파일";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; try { const entry = await getNewsEntry(slug); return { title: entry?.title ?? "주보·소식", description: entry ? `${entry.title} | 글로벌교회 주보·소식` : undefined, alternates: { canonical: `/news/${slug}` }, openGraph: entry ? { type: "article", url: absoluteUrl(`/news/${slug}`), title: entry.title, description: `${entry.title} | 글로벌교회 주보·소식`, images: entry.image ? [{ url: entry.image, alt: entry.title }] : undefined } : undefined }; } catch { return { title: "주보·소식", alternates: { canonical: `/news/${slug}` } }; } }
export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let entry: Awaited<ReturnType<typeof getNewsEntry>>;
  try { entry = await getNewsEntry(slug); } catch { return <div className="subpage"><main id="main-content" tabIndex={-1} className="section"><div className="page-shell"><ContentState title="주보·소식을 불러오지 못했습니다." description="잠시 후 다시 시도해 주세요."/></div></main></div>; }
  if (!entry) notFound();
  const attachments = entry.kind === "bulletin" ? entry.attachments ?? [] : [];
  const imageAttachments = attachments.filter(isImageAttachment);
  const downloadableAttachments = attachments.filter((attachment) => !isImageAttachment(attachment));
  const isResource = entry.category === "자료";
  const documentImage = !isResource ? imageAttachments[0] : undefined;
  const resourceAttachments = isResource && attachments.length > 0 && <section className="resource-attachments" aria-labelledby="resource-attachments-title"><div className="resource-attachments__heading"><p className="eyebrow">FILES</p><h2 id="resource-attachments-title">첨부 자료</h2><p>문서는 내려받아 확인하고, 이미지는 화면에서 먼저 살펴본 뒤 원본이 필요할 때만 저장할 수 있습니다.</p></div>{downloadableAttachments.length > 0 && <ul className="resource-downloads">{downloadableAttachments.map((attachment) => <li key={attachment.id}><div><strong>{attachment.name}</strong><span>{formatFileType(attachment.name, attachment.type)} · {formatFileSize(attachment.size)}</span></div><a href={`${attachment.url}?download=1`}>다운로드 <span aria-hidden="true">↓</span></a></li>)}</ul>}{imageAttachments.length > 0 && <div className="resource-images">{imageAttachments.map((attachment) => <article key={attachment.id}><a className="resource-images__preview" href={attachment.url} target="_blank" rel="noreferrer"><Image src={contentImageUrl(attachment.url, "resource-preview")!} alt={`${attachment.name} 원본 보기`} fill unoptimized sizes="(max-width: 680px) 100vw, 50vw"/><span>원본 보기</span></a><div><strong>{attachment.name}</strong><span>{formatFileType(attachment.name, attachment.type)} · {formatFileSize(attachment.size)}</span><a href={`${attachment.url}?download=1`}>원본 다운로드 <span aria-hidden="true">↓</span></a></div></article>)}</div>}</section>;
  const content = <>{documentImage && <div className="bulletin-document"><div className="bulletin-document__toolbar"><p>주보 이미지</p><span>화면을 확대해 읽어보세요</span></div><div className="bulletin-document__page"><Image src={contentImageUrl(documentImage.url, "document")!} alt={`${entry.title} 전체 내용`} fill unoptimized sizes="(max-width: 1040px) 100vw, 1040px"/></div></div>}{entry.body ? <RichText html={entry.body} className="story-detail__body"/> : !documentImage && !resourceAttachments && <div className="story-detail__body"><p>등록된 본문이 없습니다.</p></div>}{resourceAttachments}</>;
  return <div className="subpage"><main id="main-content" tabIndex={-1}><section className="detail-hero detail-hero--bulletin"><div className="page-shell detail-hero__inner"><Link className="detail-back" href="/news"><span aria-hidden="true">←</span> 주보·소식</Link><div className="detail-meta"><span>{entry.category}</span><time dateTime={entry.dateTime}>{entry.date}</time></div><h1>{entry.title}</h1></div></section><section className="bulletin-detail section" aria-label={entry.category}><div className="page-shell">{content}<nav className="detail-nav" aria-label="주보·소식 탐색"><Link href="/news">모든 주보·소식 보기</Link></nav></div></section></main></div>;
}
