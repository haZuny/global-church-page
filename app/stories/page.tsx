import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContentPagination } from "@/components/content-pagination/content-pagination";
import { ContentImagePlaceholder, ContentState } from "@/components/content-state/content-state";
import { contentImageUrl, getStoriesPage } from "@/lib/directus-content";

export const metadata: Metadata = { title: "교회 이야기", description: "글로벌교회가 함께 예배하고 배우며 자라가는 오늘의 기록을 전합니다.", alternates: { canonical: "/stories" } };

export const dynamic = "force-dynamic";

const storyFilters = ["전체", "장년부", "교육부서"] as const;
type StoryFilter = typeof storyFilters[number];
// The first entry is featured, leaving six cards to fill the two-row desktop grid.
const pageSize = 7;

const pageNumber = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const storyListHref = (category: StoryFilter, page: number) => {
  const params = new URLSearchParams();
  if (category !== "전체") params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/stories?${query}` : "/stories";
};

export default async function StoriesPage({ searchParams }: { searchParams: Promise<{ category?: string; page?: string }> }) {
  const params = await searchParams;
  const selectedFilter: StoryFilter = storyFilters.includes(params.category as StoryFilter) ? params.category as StoryFilter : "전체";
  const requestedPage = pageNumber(params.page);
  let stories: Awaited<ReturnType<typeof getStoriesPage>>["items"] = [];
  let pagination = { page: requestedPage, totalPages: 1 };
  let failed = false;
  try {
    const result = await getStoriesPage({ category: selectedFilter === "전체" ? undefined : selectedFilter, page: requestedPage, pageSize });
    stories = result.items;
    pagination = result;
  } catch { failed = true; }
  const [featuredStory, ...storyRows] = stories;
  const animateList = selectedFilter === "전체" && requestedPage === 1;
  return <div className="subpage"><main id="main-content" tabIndex={-1}>
    <section className="archive-hero archive-hero--stories" aria-labelledby="page-title"><div className="page-shell archive-hero__inner"><div><p className="eyebrow">CHURCH STORIES</p><h1 id="page-title">함께한 날들의{" "}<br/>작은 기록</h1></div><p>함께 예배하고 배우며 자라가는{" "}<br/>글로벌교회의 오늘을 전합니다.</p></div></section>
    <section className="archive-content section" aria-label="교회 이야기 목록"><div className="page-shell"><div className={`archive-toolbar${animateList ? " reveal" : ""}`}><nav aria-label="교회 이야기 분류">{storyFilters.map((filter) => <Link key={filter} href={storyListHref(filter, 1)} className={selectedFilter === filter ? "is-active" : undefined} aria-current={selectedFilter === filter ? "page" : undefined}>{filter}</Link>)}</nav><span>PUBLIC RECORDS</span></div>
      {failed ? <ContentState title="교회 이야기를 불러오지 못했습니다." description="잠시 후 다시 시도해 주세요."/> : featuredStory ? <><article className={`archive-feature${animateList ? " reveal" : ""}`}><Link href={`/stories/${featuredStory.id}`} aria-label={`${featuredStory.title} 이야기 보기`}><div className="archive-feature__image">{featuredStory.image ? <Image src={contentImageUrl(featuredStory.image, "story-feature")!} alt={featuredStory.alt} fill unoptimized sizes="(max-width: 780px) 100vw, 54vw"/> : <ContentImagePlaceholder label={`${featuredStory.title} 이미지 준비 중`}/>}</div><div className="archive-feature__copy"><p><time dateTime={featuredStory.dateTime}>{featuredStory.date}</time></p><h2>{featuredStory.title}</h2><span aria-hidden="true">→</span></div></Link></article>
      <div className="archive-grid">{storyRows.map((story) => <article className={`archive-card${animateList ? " reveal" : ""}`} key={story.id}><Link href={`/stories/${story.id}`}><div className="archive-card__image">{story.image ? <Image src={contentImageUrl(story.image, "story-card")!} alt={story.alt} fill unoptimized sizes="(max-width: 780px) 100vw, 50vw"/> : <ContentImagePlaceholder label={`${story.title} 이미지 준비 중`}/>}</div><p><time dateTime={story.dateTime}>{story.date}</time></p><h2>{story.title}</h2></Link></article>)}</div>
      <p className={`archive-source${animateList ? " reveal" : ""}`}>글로벌교회가 함께한 날들을 사진으로 담았습니다.</p><ContentPagination currentPage={pagination.page} totalPages={pagination.totalPages} hrefForPage={(page) => storyListHref(selectedFilter, page)}/></> : <div className="archive-filter-empty"><ContentState title={selectedFilter === "전체" ? "아직 공개된 교회 이야기가 없습니다." : `${selectedFilter} 교회 이야기가 없습니다.`} description={selectedFilter === "전체" ? "새 소식이 올라오면 이곳에서 알려드릴게요." : "다른 분류의 이야기를 보거나 전체 이야기를 확인해 주세요."}/>{selectedFilter !== "전체" && <Link href="/stories" className="archive-filter-reset">전체 이야기 보기 <span aria-hidden="true">→</span></Link>}</div>}
    </div></section>
  </main></div>;
}
