import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContentImagePlaceholder, ContentState } from "@/components/content-state/content-state";
import { getStories } from "@/lib/directus-content";

export const metadata: Metadata = { title: "교회 이야기" };

export const dynamic = "force-dynamic";

export default async function StoriesPage() {
  let stories: Awaited<ReturnType<typeof getStories>> = [];
  let failed = false;
  try { stories = await getStories(); } catch { failed = true; }
  const [featuredStory, ...storyRows] = stories;
  return <div className="subpage"><main id="main-content">
    <section className="archive-hero archive-hero--stories" aria-labelledby="page-title"><div className="page-shell archive-hero__inner"><div><p className="eyebrow">CHURCH STORIES</p><h1 id="page-title">함께한 날들의<br/>작은 기록</h1></div><p>함께 예배하고 배우며 자라가는<br/>글로벌교회의 오늘을 전합니다.</p></div></section>
    <section className="archive-content section" aria-label="교회 이야기 목록"><div className="page-shell"><div className="archive-toolbar reveal"><span>PUBLIC RECORDS</span></div>
      {failed ? <ContentState title="교회 이야기를 불러오지 못했습니다." description="잠시 후 다시 시도해 주세요."/> : featuredStory ? <><article className="archive-feature reveal"><Link href={`/stories/${featuredStory.id}`} aria-label={`${featuredStory.title} 이야기 보기`}><div className="archive-feature__image">{featuredStory.image ? <Image src={featuredStory.image} alt={featuredStory.alt} fill unoptimized sizes="(max-width: 780px) 100vw, 54vw"/> : <ContentImagePlaceholder label={`${featuredStory.title} 이미지 준비 중`}/>}</div><div className="archive-feature__copy"><p><time dateTime={featuredStory.dateTime}>{featuredStory.date}</time></p><h2>{featuredStory.title}</h2><span aria-hidden="true">→</span></div></Link></article>
      <div className="archive-grid">{storyRows.map((story) => <article className="archive-card reveal" key={story.id}><Link href={`/stories/${story.id}`}><div className="archive-card__image">{story.image ? <Image src={story.image} alt={story.alt} fill unoptimized sizes="(max-width: 780px) 100vw, 50vw"/> : <ContentImagePlaceholder label={`${story.title} 이미지 준비 중`}/>}</div><p><time dateTime={story.dateTime}>{story.date}</time></p><h2>{story.title}</h2></Link></article>)}</div>
      <p className="archive-source reveal">사진과 이야기를 한곳에서 편안히 살펴볼 수 있도록 정리했습니다. 새로운 공동체 기록도 같은 형식으로 이어집니다.</p></> : <ContentState title="아직 공개된 교회 이야기가 없습니다." description="새로운 공동체 기록을 준비하고 있습니다."/>}
    </div></section>
    <section className="archive-bridge"><div className="page-shell"><p>이번 주 공동체 소식도 궁금하다면</p><Link href="/news">주보와 소식 보기 <span aria-hidden="true">→</span></Link></div></section>
  </main></div>;
}
