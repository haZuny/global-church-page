import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { stories, storyRows } from "@/lib/content";

const featuredStory = stories["youth-vision-founder"];

export const metadata: Metadata = { title: "교회 이야기" };

export default function StoriesPage() {
  return <div className="subpage"><main id="main-content">
    <section className="archive-hero archive-hero--stories" aria-labelledby="page-title"><div className="page-shell archive-hero__inner"><div><p className="eyebrow">CHURCH STORIES</p><h1 id="page-title">함께한 날들의<br/>작은 기록</h1></div><p>함께 예배하고 배우며 자라가는<br/>글로벌교회의 오늘을 전합니다.</p></div></section>
    <section className="archive-content section" aria-label="교회 이야기 목록"><div className="page-shell"><div className="archive-toolbar reveal"><nav aria-label="이야기 분류"><span className="is-active">전체</span><span>예배</span><span>공동체</span><span>이웃 섬김</span><span>다음 세대</span></nav><span>PUBLIC RECORDS</span></div>
      <article className="archive-feature reveal"><Link href="/stories/youth-vision-founder" aria-label="청소년부 비전파운더 이야기 보기"><div className="archive-feature__image"><Image src={featuredStory.image} alt={featuredStory.alt} fill sizes="(max-width: 780px) 100vw, 54vw"/></div><div className="archive-feature__copy"><p><span>{featuredStory.category}</span><time dateTime={featuredStory.dateTime}>{featuredStory.date}</time></p><h2>{featuredStory.title}</h2><div><p>{featuredStory.subtitle}</p><span aria-hidden="true">→</span></div></div></Link></article>
      <div className="archive-grid">{storyRows.map(([slug, story, imageClass]) => <article className="archive-card reveal" key={slug}><Link href={`/stories/${slug}`}><div className={`archive-card__image ${imageClass}`}><Image src={story.image} alt={story.alt} fill sizes="(max-width: 780px) 100vw, 50vw"/></div><p><span>{story.category}</span><time dateTime={story.dateTime}>{story.date}</time></p><h2>{story.title}</h2><div>{story.summary}</div></Link></article>)}</div>
      <p className="archive-source reveal">사진과 이야기를 한곳에서 편안히 살펴볼 수 있도록 정리했습니다. 새로운 공동체 기록도 같은 형식으로 이어집니다.</p>
    </div></section>
    <section className="archive-bridge"><div className="page-shell"><p>이번 주 공동체 소식도 궁금하다면</p><Link href="/news">주보와 소식 보기 <span aria-hidden="true">→</span></Link></div></section>
  </main></div>;
}
