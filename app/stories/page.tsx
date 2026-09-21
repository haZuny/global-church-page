import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "교회 이야기" };

const stories = [
  ["vision-founder", "지유쓰 · 청년부", "2026. 07. 01", "2026-07-01", "우리 안에 비전을 세우는 비전파운더", "삶의 목적과 하나님의 뜻을 함께 묻고, 우리 안에 주신 비전을 발견해 간 3일의 기록입니다.", "/assets/images/jiyouth-vision-founder.jpg", "청년부 비전파운더 안내 카드와 워크북", ""],
  ["youth-dining-room", "청년대학부", "2024. 02. 06", "2024-02-06", "청년대학부 식당 꾸미기", "함께 사용할 식당 공간을 손수 꾸미며 공동체의 자리를 준비했습니다.", "/assets/images/global-youth-dining.jpg", "청년대학부가 식당 공간을 꾸미는 모습", "archive-card__image--lobby archive-card__image--thumb"],
  ["youth-winter-camp", "다음 세대", "2024. 02. 01", "2024-02-01", "청소년부 겨울캠프", "청소년부가 함께 예배하고 교제한 겨울캠프의 사진 기록입니다.", "/assets/images/global-youth-winter-camp.jpg", "청소년부 겨울캠프 현장", "archive-card__image--detail"],
  ["mens-cell-presentation", "셀 공동체", "2024. 02. 01", "2024-02-01", "남성 셀 발표", "각자의 자리에서 준비한 내용을 나누며 함께한 공동체 기록입니다.", "/assets/images/global-men-cell.jpg", "남성 셀 모임 발표 현장", "archive-card__image--detail"],
] as const;

export default function StoriesPage() {
  return <div className="subpage"><main id="main-content">
    <section className="archive-hero archive-hero--stories" aria-labelledby="page-title"><div className="page-shell archive-hero__inner"><div><p className="eyebrow">CHURCH STORIES</p><h1 id="page-title">함께한 날들의<br/>작은 기록</h1></div><p>함께 예배하고 배우며 자라가는<br/>글로벌교회의 오늘을 전합니다.</p></div></section>
    <section className="archive-content section" aria-label="교회 이야기 목록"><div className="page-shell"><div className="archive-toolbar"><nav aria-label="이야기 분류"><span className="is-active">전체</span><span>예배</span><span>공동체</span><span>이웃 섬김</span><span>다음 세대</span></nav><span>PUBLIC RECORDS</span></div>
      <article className="archive-feature"><Link href="/stories/youth-vision-founder" aria-label="청소년부 비전파운더 이야기 보기"><div className="archive-feature__image"><img src="/assets/images/jiyouth-vision-founder-youth.jpg" alt="청소년부 비전파운더 안내 카드와 워크북"/></div><div className="archive-feature__copy"><p><span>다음 세대</span><time dateTime="2026-07-29">2026. 07. 29</time></p><h2>청소년부<br/>비전파운더</h2><div><p>삶의 목적과 하나님의 뜻에 관해 진지하게 공감하고 고백한 시간입니다.</p><span aria-hidden="true">→</span></div></div></Link></article>
      <div className="archive-grid">{stories.map(([slug, category, date, dateTime, title, summary, image, alt, imageClass]) => <article className="archive-card" key={slug}><Link href={`/stories/${slug}`}><div className={`archive-card__image ${imageClass}`}><img src={image} alt={alt} loading="lazy"/></div><p><span>{category}</span><time dateTime={dateTime}>{date}</time></p><h2>{title}</h2><div>{summary}</div></Link></article>)}</div>
      <p className="archive-source">사진과 이야기를 한곳에서 편안히 살펴볼 수 있도록 정리했습니다. 새로운 공동체 기록도 같은 형식으로 이어집니다.</p>
    </div></section>
    <section className="archive-bridge"><div className="page-shell"><p>이번 주 공동체 소식도 궁금하다면</p><Link href="/news">주보와 소식 보기 <span aria-hidden="true">→</span></Link></div></section>
  </main></div>;
}
