import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentState } from "@/components/content-state/content-state";
import { getNewsEntry } from "@/lib/directus-content";
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
const isPdfAttachment = (name: string, type: string) => type === "application/pdf" || /\.pdf$/i.test(name);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; try { const entry = await getNewsEntry(slug); return { title: entry?.title ?? "주보·소식", description: entry ? `${entry.title} | 글로벌교회 주보·소식` : undefined, alternates: { canonical: `/news/${slug}` }, openGraph: entry ? { type: "article", url: absoluteUrl(`/news/${slug}`), title: entry.title, description: `${entry.title} | 글로벌교회 주보·소식`, images: entry.image ? [{ url: entry.image, alt: entry.title }] : undefined } : undefined }; } catch { return { title: "주보·소식", alternates: { canonical: `/news/${slug}` } }; } }
export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let entry: Awaited<ReturnType<typeof getNewsEntry>>;
  try { entry = await getNewsEntry(slug); } catch { return <div className="subpage"><main id="main-content" tabIndex={-1} className="section"><div className="page-shell"><ContentState title="주보·소식을 불러오지 못했습니다." description="잠시 후 다시 시도해 주세요."/></div></main></div>; }
  if (!entry) notFound();
  const attachments = entry.kind === "bulletin" ? entry.attachments ?? [] : [];
  const pdfAttachments = attachments.filter((attachment) => isPdfAttachment(attachment.name, attachment.type));
  const downloadableAttachments = attachments.filter((attachment) => !isPdfAttachment(attachment.name, attachment.type));
  const isResource = entry.category === "자료";
  const attachmentSection = attachments.length > 0 && <section className="resource-attachments" aria-labelledby="resource-attachments-title"><div className="resource-attachments__heading"><p className="eyebrow">FILES</p><h2 id="resource-attachments-title">{isResource ? "첨부 자료" : "주보 파일"}</h2><p>본문 이미지는 글 안에서 확인하고, 첨부 파일은 내려받아 보관할 수 있습니다.</p></div>{pdfAttachments.map((attachment) => <article className="bulletin-pdf" key={attachment.id}><header><div><strong>{attachment.name}</strong><span>PDF · {formatFileSize(attachment.size)}</span></div><a href={`${attachment.url}?download=1`}>PDF 다운로드 <span aria-hidden="true">↓</span></a></header><object data={attachment.url} type="application/pdf" aria-label={`${attachment.name} 미리보기`}><p>이 브라우저에서는 PDF 미리보기를 지원하지 않습니다. <a href={`${attachment.url}?download=1`}>PDF를 내려받아 확인하세요.</a></p></object></article>)}{downloadableAttachments.length > 0 && <ul className="resource-downloads">{downloadableAttachments.map((attachment) => <li key={attachment.id}><div><strong>{attachment.name}</strong><span>{formatFileType(attachment.name, attachment.type)} · {formatFileSize(attachment.size)}</span></div><a href={`${attachment.url}?download=1`}>다운로드 <span aria-hidden="true">↓</span></a></li>)}</ul>}</section>;
  const content = <>{entry.body ? <RichText html={entry.body} className="story-detail__body"/> : !attachmentSection && <div className="story-detail__body"><p>등록된 본문이 없습니다.</p></div>}{attachmentSection}</>;
  return <div className="subpage"><main id="main-content" tabIndex={-1}><section className="detail-hero detail-hero--bulletin"><div className="page-shell detail-hero__inner"><Link className="detail-back" href="/news"><span aria-hidden="true">←</span> 주보·소식</Link><div className="detail-meta"><span>{entry.category}</span><time dateTime={entry.dateTime}>{entry.date}</time></div><h1>{entry.title}</h1></div></section><section className="bulletin-detail section" aria-label={entry.category}><div className="page-shell">{content}<nav className="detail-nav" aria-label="주보·소식 탐색"><Link href="/news">모든 주보·소식 보기</Link></nav></div></section></main></div>;
}
