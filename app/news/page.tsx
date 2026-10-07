import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContentPagination } from "@/components/content-pagination/content-pagination";
import { ContentState } from "@/components/content-state/content-state";
import { contentImageUrl, getNewsEntriesPage } from "@/lib/directus-content";

export const metadata: Metadata = { title: "주보·소식", description: "글로벌교회 주보와 소식.", alternates: { canonical: "/news" } };

export const dynamic = "force-dynamic";
const newsFilters = ["전체", "주보", "공지", "자료"] as const;
type NewsFilter = typeof newsFilters[number];
const pageSize = 6;

const pageNumber = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const newsListHref = (category: NewsFilter, page: number) => {
  const params = new URLSearchParams();
  if (category !== "전체") params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/news?${query}` : "/news";
};

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ category?: string; page?: string }> }) {
  const params = await searchParams;
  const selectedFilter: NewsFilter = newsFilters.includes(params.category as NewsFilter) ? params.category as NewsFilter : "전체";
  const requestedPage = pageNumber(params.page);
  let entries: Awaited<ReturnType<typeof getNewsEntriesPage>>["items"] = [];
  let pagination = { page: requestedPage, totalPages: 1 };
  let failed = false;
  try {
    const result = await getNewsEntriesPage({ category: selectedFilter, page: requestedPage, pageSize });
    entries = result.items;
    pagination = result;
  } catch { failed = true; }
  const latestEntry = entries[0];
  const animateList = selectedFilter === "전체" && requestedPage === 1;
  return (
    <div className="subpage">
      <main id="main-content" tabIndex={-1}>
        <section
          className="archive-hero archive-hero--news"
          aria-labelledby="page-title"
        >
          <div className="page-shell archive-hero__inner">
            <div>
              <p className="eyebrow">주보·소식</p>
              <h1 id="page-title">
                주보와{" "}
                <br />
                글로벌 소식
              </h1>
            </div>
            <p>
              주보와 교회 소식을 확인할 수 있습니다.
            </p>
          </div>
        </section>
        <section
          className="notice-archive section"
          aria-label="주보와 소식 목록"
        >
          <div className="page-shell">
            <div className={`archive-toolbar${animateList ? " reveal" : ""}`}>
              <nav aria-label="소식 분류">
                {newsFilters.map((filter) => <Link key={filter} href={newsListHref(filter, 1)} className={selectedFilter === filter ? "is-active" : undefined} aria-current={selectedFilter === filter ? "page" : undefined}>{filter}</Link>)}
              </nav>
              <span>2026</span>
            </div>
            {failed ? <ContentState title="주보·소식을 불러오지 못했습니다." description="잠시 후 다시 시도해 주세요."/> : latestEntry ? <><Link className={`bulletin-feature${animateList ? " reveal" : ""}`} href={`/news/${latestEntry.href}`} aria-label={`${latestEntry.title} 상세 보기`}>
              <div className="bulletin-feature__copy">
                <p><span>NEW</span> 가장 최근 소식</p>
                <time dateTime={latestEntry.dateTime}>{latestEntry.date}</time>
                <h2>{latestEntry.title}</h2>
                <span className="bulletin-feature__action">내용 보기 <i aria-hidden="true">→</i></span>
              </div>
              <div className={`bulletin-feature__visual${latestEntry.image ? " bulletin-feature__visual--image" : ""}`}>
                {latestEntry.image ? <Image src={contentImageUrl(latestEntry.image, "news-feature")!} alt="" fill unoptimized sizes="(max-width: 780px) 100vw, 38vw" /> : <div className="bulletin-feature__paper" aria-hidden="true"><span>{latestEntry.category}</span><strong>{latestEntry.date.replaceAll(". ", ".\n")}</strong></div>}
              </div>
            </Link>
            <div className={`notice-list${animateList ? " reveal" : ""}`} id="bulletin-list">
              <div className="notice-list__head" aria-hidden="true">
                <span>날짜</span>
                <span>분류</span>
                <span>제목</span>
                <span />
              </div>
              {entries.map((entry) => (
                <Link href={`/news/${entry.href}`} key={`${entry.kind}-${entry.id}`}>
                  <time dateTime={entry.dateTime}>
                    {entry.date}
                  </time>
                  <span>{entry.category}</span>
                  <div>
                    <strong>{entry.title}</strong>
                  </div>
                  <i aria-hidden="true">→</i>
                </Link>
              ))}
            </div>
            <ContentPagination currentPage={pagination.page} totalPages={pagination.totalPages} hrefForPage={(page) => newsListHref(selectedFilter, page)}/></> : <div className="archive-filter-empty"><ContentState title={selectedFilter === "전체" ? "등록된 주보·소식이 없습니다." : `등록된 ${selectedFilter} 항목이 없습니다.`}/>{selectedFilter !== "전체" && <Link href="/news" className="archive-filter-reset">전체 소식 보기 <span aria-hidden="true">→</span></Link>}</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
