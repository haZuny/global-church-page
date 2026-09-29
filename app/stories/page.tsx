import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContentImagePlaceholder, ContentState } from "@/components/content-state/content-state";
import { contentImageUrl, getStories } from "@/lib/directus-content";

export const metadata: Metadata = { title: "교회 이야기" };

export const dynamic = "force-dynamic";

const storyFilters = ["전체", "장년부", "교육부서"] as const;
type StoryFilter = typeof storyFilters[number];

export default async function StoriesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  let stories: Awaited<ReturnType<typeof getStories>> = [];
  let failed = false;
  try { stories = await getStories(); } catch { failed = true; }
  const params = await searchParams;
  const selectedFilter: StoryFilter = storyFilters.includes(params.category as StoryFilter) ? params.category as StoryFilter : "전체";
  const filteredStories = selectedFilter === "전체" ? stories : stories.filter((story) => story.category === selectedFilter);
  const [featuredStory, ...storyRows] = filteredStories;
  return <div className="subpage"><main id="main-content" tabIndex={-1}>
    <section className="archive-hero archive-hero--stories" aria-labelledby="page-title"><div className="page-shell archive-hero__inner"><div><p className="eyebrow">CHURCH STORIES</p><h1 id="page-title">함께한 날들의<br/>작은 기록</h1></div><p>함께 예배하고 배우며 자라가는<br/>글로벌교회의 오늘을 전합니다.</p></div></section>
    <section className="archive-content section" aria-label="교회 이야기 목록"><div className="page-shell"><div className="archive-toolbar reveal"><nav aria-label="교회 이야기 분류">{storyFilters.map((filter) => <Link key={filter} href={filter === "전체" ? "/stories" : `/stories?category=${encodeURIComponent(filter)}`} className={selectedFilter === filter ? "is-active" : undefined} aria-current={selectedFilter === filter ? "page" : undefined}>{filter}</Link>)}</nav><span>PUBLIC RECORDS</span></div>
      {failed ? <ContentState title="교회 이야기를 불러오지 못했습니다." description="잠시 후 다시 시도해 주세요."/> : featuredStory ? <><article className="archive-feature reveal"><Link href={`/stories/${featuredStory.id}`} aria-label={`${featuredStory.title} 이야기 보기`}><div className="archive-feature__image">{featuredStory.image ? <Image src={contentImageUrl(featuredStory.image, "story-feature")!} alt={featuredStory.alt} fill unoptimized sizes="(max-width: 780px) 100vw, 54vw"/> : <ContentImagePlaceholder label={`${featuredStory.title} 이미지 준비 중`}/>}</div><div className="archive-feature__copy"><p><time dateTime={featuredStory.dateTime}>{featuredStory.date}</time></p><h2>{featuredStory.title}</h2><span aria-hidden="true">→</span></div></Link></article>
      <div className="archive-grid">{storyRows.map((story) => <article className="archive-card reveal" key={story.id}><Link href={`/stories/${story.id}`}><div className="archive-card__image">{story.image ? <Image src={contentImageUrl(story.image, "story-card")!} alt={story.alt} fill unoptimized sizes="(max-width: 780px) 100vw, 50vw"/> : <ContentImagePlaceholder label={`${story.title} 이미지 준비 중`}/>}</div><p><time dateTime={story.dateTime}>{story.date}</time></p><h2>{story.title}</h2></Link></article>)}</div>
      <p className="archive-source reveal">사진과 이야기를 한곳에서 편안히 살펴볼 수 있도록 정리했습니다. 새로운 공동체 기록도 같은 형식으로 이어집니다.</p></> : <div className="archive-filter-empty"><ContentState title={selectedFilter === "전체" ? "아직 공개된 교회 이야기가 없습니다." : `${selectedFilter} 교회 이야기가 없습니다.`} description={selectedFilter === "전체" ? "새로운 공동체 기록을 준비하고 있습니다." : "다른 분류의 이야기를 보거나 전체 이야기를 확인해 주세요."}/>{selectedFilter !== "전체" && <Link href="/stories" className="archive-filter-reset">전체 이야기 보기 <span aria-hidden="true">→</span></Link>}</div>}
    </div></section>
    <section className="archive-bridge"><div className="page-shell"><p>이번 주 공동체 소식도 궁금하다면</p><Link href="/news">주보와 소식 보기 <span aria-hidden="true">→</span></Link></div></section>
  </main></div>;
}
