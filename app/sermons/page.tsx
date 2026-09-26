import type { Metadata } from "next";
import Link from "next/link";
import { ContentState } from "@/components/content-state/content-state";
import { getSermons } from "@/lib/directus-content";

export const metadata: Metadata = { title: "설교" };
export const dynamic = "force-dynamic";

export default async function SermonsPage() {
  let sermons: Awaited<ReturnType<typeof getSermons>> = [];
  let failed = false;
  try { sermons = await getSermons(); } catch { failed = true; }
  const [latest, ...older] = sermons;
  return <div className="subpage"><main id="main-content">
    <section className="archive-hero archive-hero--sermons" aria-labelledby="sermons-title"><div className="page-shell archive-hero__inner"><div><p className="eyebrow">MESSAGES</p><h1 id="sermons-title">말씀을 듣고<br/>삶으로 이어갑니다.</h1></div><p>제목과 성경 본문을 먼저 살펴보고,<br/>지금 필요한 말씀을 천천히 들어보세요.</p></div></section>
    <section className="sermon-archive section" aria-label="설교 목록"><div className="page-shell"><div className="archive-toolbar"><nav aria-label="설교 분류"><span className="is-active">전체 설교</span></nav><span>MESSAGE ARCHIVE</span></div>
      {failed ? <ContentState title="설교를 불러오지 못했습니다." description="잠시 후 다시 시도해 주세요."/> : latest ? <><article className="sermon-feature"><div className="sermon-art" aria-label={`${latest.title} 설교`}><span className="sermon-art__book">{latest.scripture}</span><span className="sermon-art__verse">{latest.date}</span><span className="play-button" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 7 8 5-8 5V7Z"/></svg></span><span className="sermon-art__caption">LATEST MESSAGE</span></div><div className="sermon__content"><p className="eyebrow">LATEST MESSAGE</p><h2>{latest.title}</h2><p className="sermon__summary">{latest.summary}</p><dl className="sermon__info"><div><dt>말씀</dt><dd>{latest.scripture}</dd></div><div><dt>설교자</dt><dd>{latest.preacher}</dd></div><div><dt>날짜</dt><dd>{latest.date}</dd></div></dl><Link className="text-link" href={`/sermons/${latest.id}`}>설교 듣기 <span aria-hidden="true">→</span></Link></div></article>{older.length > 0 && <div className="notice-list">{older.map((sermon) => <Link href={`/sermons/${sermon.id}`} key={sermon.id}><time dateTime={sermon.dateTime}>{sermon.date}</time><span>설교</span><div><strong>{sermon.title}</strong><p>{sermon.summary}</p></div><i aria-hidden="true">→</i></Link>)}</div>}</> : <ContentState title="아직 공개된 설교가 없습니다." description="설교가 게시되면 이곳에서 바로 들으실 수 있습니다."/>}
    </div></section>
  </main></div>;
}
