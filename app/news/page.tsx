import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "주보·소식" };

const bulletins = [
  ["2026-03-15", "2026. 03. 15", "주보", "2026년 3월 15일", "예배 순서와 공동체 안내를 확인하세요."],
  ["2026-03-08", "2026. 03. 08", "주보", "2026년 3월 8일", "예배 순서와 공동체 안내를 확인하세요."],
  ["2026-03-01", "2026. 03. 01", "주보", "2026년 3월 1일", "예배 순서와 공동체 안내를 확인하세요."],
  ["2026-02-22", "2026. 02. 22", "주보", "2026년 2월 22일", "예배 순서와 공동체 안내를 확인하세요."],
  ["2026-lunar-new-year", "2026. 02", "자료", "2026년 설 가정예배 순서지", "가정에서 함께 드리는 설 예배 순서지입니다."],
  ["2026-02-15", "2026. 02. 15", "주보", "2026년 2월 15일", "예배 순서와 공동체 안내를 확인하세요."],
  ["2026-02-08", "2026. 02. 08", "주보", "2026년 2월 8일", "예배 순서와 공동체 안내를 확인하세요."],
  ["2026-02-01", "2026. 02. 01", "주보", "2026년 2월 1일", "예배 순서와 공동체 안내를 확인하세요."],
] as const;

export default function NewsPage() {
  return <div className="subpage"><main id="main-content">
    <section className="archive-hero archive-hero--news" aria-labelledby="page-title"><div className="page-shell archive-hero__inner"><div><p className="eyebrow">BULLETIN &amp; NEWS</p><h1 id="page-title">주보와<br/>글로벌 소식</h1></div><p>매주 예배 순서와 공동체 일정을 확인하고,<br/>앞으로 함께할 모임과 행사 소식을 살펴보세요.</p></div></section>
    <section className="notice-archive section" aria-label="주보와 소식 목록"><div className="page-shell"><div className="archive-toolbar"><nav aria-label="소식 분류"><span className="is-active">전체</span><span>주보</span><span>공지</span><span>행사</span></nav><span>2026</span></div>
      <article className="bulletin-feature"><div className="bulletin-feature__date"><span>MAR</span><strong>15</strong><small>2026</small></div><div className="bulletin-feature__copy"><p><span>NEW</span> 이번 주 주보</p><h2>2026년 3월 15일<br/>글로벌교회 주보</h2><p>예배 순서와 한 주의 안내를 이 페이지에서 바로 확인할 수 있습니다.</p><div><Link className="button button--dark" href="/news/2026-03-15">이번 주보 보기</Link><a className="text-link" href="#bulletin-list">지난 주보 보기</a></div></div><div className="bulletin-feature__paper" aria-hidden="true"><span>GLOBAL<br/>WEEKLY</span><strong>03<br/>15</strong><small>함께 예배하고<br/>함께 살아갑니다</small></div></article>
      <div className="notice-list" id="bulletin-list"><div className="notice-list__head" aria-hidden="true"><span>날짜</span><span>분류</span><span>제목</span><span/></div>{bulletins.map(([slug, date, category, title, summary]) => <Link href={`/news/${slug}`} key={slug}><time dateTime={slug.startsWith("2026-") && slug !== "2026-lunar-new-year" ? slug : undefined}>{date}</time><span>{category}</span><div><strong>{title}</strong><p>{summary}</p></div><i aria-hidden="true">→</i></Link>)}</div>
      <p className="archive-source">주보와 예배 자료를 날짜순으로 모았습니다. 각 항목을 누르면 이 사이트 안에서 내용을 바로 확인할 수 있습니다.</p>
    </div></section>
    <section className="archive-bridge"><div className="page-shell"><p>글로벌교회의 요즘 모습이 궁금하다면</p><Link href="/stories">교회 이야기 보기 <span aria-hidden="true">→</span></Link></div></section>
  </main></div>;
}
