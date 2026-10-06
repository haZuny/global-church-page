import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContentState } from "@/components/content-state/content-state";
import { ResponsiveHeroImage } from "@/components/responsive-hero-image/responsive-hero-image";
import { contentImageUrl, fallbackChurchInfo, getChurchInfo, getNewsEntriesPage, getStoriesPage } from "@/lib/directus-content";
export const metadata: Metadata = { title: "글로벌교회", alternates: { canonical: "/" } };
export const dynamic = "force-dynamic";
const Arrow = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10h11M11 6l4 4-4 4" />
  </svg>
);
const worshipSchedule = [
  { name: "수요일 밤 예배", detail: "매주 수요일", time: "20:00" },
  { name: "금요일 밤 기도회", detail: "매주 금요일", time: "20:00" },
  { name: "평일 밤 기도회", detail: "매주 월요일 ~ 금요일", time: "20:00" },
] as const;
const sundayServices = [
  { name: "1부 예배", detail: "", time: "09:00" },
  { name: "2부 예배", detail: "", time: "10:50" },
  { name: "3부 예배", detail: "청년·젊은 부부·청소년", time: "14:00" },
] as const;
export default async function HomePage() {
  const [churchResult, storiesResult, newsResult] = await Promise.allSettled([
    getChurchInfo(),
    getStoriesPage({ page: 1, pageSize: 3 }),
    getNewsEntriesPage({ page: 1, pageSize: 1 }),
  ]);
  const church = churchResult.status === "fulfilled" ? churchResult.value : fallbackChurchInfo;
  const stories = storiesResult.status === "fulfilled" ? storiesResult.value.items : [];
  const newsEntries = newsResult.status === "fulfilled" ? newsResult.value.items : [];
  const latestStories = stories.slice(0, 3);
  const latestStory = latestStories[0];
  const latestNews = newsEntries[0];
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(church.address)}&z=17&output=embed`;
  return (
    <main id="main-content" tabIndex={-1} className="home-page">
      <section className="hero" id="home" aria-labelledby="hero-title">
        <ResponsiveHeroImage />
        <div className="hero__content page-shell">
          <p className="eyebrow hero__eyebrow">{church.englishName}</p>
          <h1 id="hero-title">
            {church.heroTitle.split(" ").slice(0, -2).join(" ") || church.heroTitle}
            {church.heroTitle.includes(" ") && <>{" "}<br />{church.heroTitle.split(" ").slice(-2).join(" ")}</>}
          </h1>
          <p className="hero__copy">
            {church.heroCopy}
          </p>
          <div className="hero__actions">
            <Link className="button button--solid" href="/about">
              교회 소개 더보기
              <Arrow />
            </Link>
            <a className="hero__directions" href="#location">
              길 찾기
              <Arrow />
            </a>
          </div>
        </div>
      </section>
      <section className="home-updates home-updates--stories section" aria-labelledby="home-stories-title">
        <div className="page-shell">
          <div className="home-updates__heading">
            <div className="section-heading">
              <p className="eyebrow">CHURCH STORIES</p>
              <h2 id="home-stories-title">우리의 소중한 순간들</h2>
            </div>
            <p>최근의 사진과 기록으로 글로벌교회의 오늘을 전합니다.</p>
          </div>
          {latestStory ? <div className="home-updates__grid">
            <article className={`latest-story${latestStory.image ? "" : " latest-story--text-only"}`}>
              <Link href={`/stories/${latestStory.id}`} aria-label={`${latestStory.title} 이야기 보기`}>
                {latestStory.image && <div className="latest-story__image"><Image src={contentImageUrl(latestStory.image, "home-preview")!} alt={latestStory.alt} fill unoptimized sizes="(max-width: 780px) 100vw, 52vw"/></div>}
                <div className="latest-story__copy"><p><time dateTime={latestStory.dateTime}>{latestStory.date}</time></p><h3>{latestStory.title}</h3></div>
              </Link>
            </article>
            {latestStories.length > 1 && <div className="update-list" aria-label="최근 교회 이야기 목록">
              {latestStories.slice(1).map((story) => <Link href={`/stories/${story.id}`} key={story.id}><time dateTime={story.dateTime}>{story.date}</time><div><strong>{story.title}</strong></div></Link>)}
            </div>}
          </div> : <ContentState title="아직 공개된 교회 이야기가 없습니다." description="새로운 공동체 기록을 준비하고 있습니다. 예배 시간과 방문 정보는 아래에서 확인하실 수 있습니다."/>}
          {latestStory && <Link className="update-list__more" href="/stories">교회 이야기 전체 보기</Link>}
        </div>
      </section>
      <section
        className="worship section"
        id="worship"
        aria-labelledby="worship-title"
      >
        <div className="worship__orb worship__orb--one" />
        <div className="worship__orb worship__orb--two" />
        <div className="page-shell worship__grid">
          <div className="section-heading">
            <p className="eyebrow">SUNDAY WITH US</p>
            <h2 id="worship-title">
              예배 시간
            </h2>
            <p>처음 오신 분도 별도 등록 없이 예배에 참여하실 수 있습니다.</p>
          </div>
          <div className="schedule">
            <article className="schedule__sunday">
              <div className="schedule__sunday-heading"><p>주일예배</p><span>매주 주일</span></div>
              <ul aria-label="주일예배 시간">
                {sundayServices.map((service) => <li key={service.name}><div><strong>{service.name}</strong>{service.detail && <span>{service.detail}</span>}</div><time>{service.time}</time></li>)}
              </ul>
            </article>
            <div className="schedule__weekday" aria-label="평일 예배 시간">
              <p className="schedule__weekday-label">평일 예배</p>
              {worshipSchedule.map((service) => (
                <article key={service.name}>
                  <div>
                    <p>{service.name}</p>
                    <span>{service.detail}</span>
                  </div>
                  <strong>{service.time}</strong>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="home-updates home-updates--news section" aria-labelledby="home-news-title">
        <div className="page-shell">
          <div className="home-updates__heading">
            <div className="section-heading"><p className="eyebrow">BULLETIN &amp; NEWS</p><h2 id="home-news-title">주보와 소식</h2></div>
            <p>가장 최근에 발행된 주보 또는 공지입니다.</p>
          </div>
          {latestNews ? <article className={`latest-story latest-news-card${latestNews.image ? "" : " latest-story--text-only latest-news-card--text-only"}`}>
            <Link href={`/news/${latestNews.href}`} aria-label={`${latestNews.title} 보기`}>
              {latestNews.image && <div className="latest-story__image"><Image src={contentImageUrl(latestNews.image, "home-preview")!} alt={latestNews.title} fill unoptimized sizes="(max-width: 780px) 100vw, 52vw"/></div>}
              <div className="latest-story__copy"><p><time dateTime={latestNews.dateTime}>{latestNews.date}</time><span>{latestNews.category}</span></p><h3>{latestNews.title}</h3></div>
            </Link>
          </article> : <ContentState title="아직 공개된 주보·소식이 없습니다." description="새 소식이 게시되면 이곳에서 바로 확인하실 수 있습니다."/>}
          {latestNews && <Link className="update-list__more" href="/news">주보·소식 전체 보기</Link>}
        </div>
      </section>
      <section
        className="location section"
        id="location"
        aria-labelledby="location-title"
      >
        <div className="location__map">
          <iframe
            title={`${church.churchName} 위치 지도`}
            src={mapEmbedUrl}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
        <div className="location__card">
          <p className="eyebrow">VISIT US</p>
          <h2 id="location-title">
            {church.churchName}로
            <br />
            오시는 길
          </h2>
          <address>
            {church.address}
          </address>
          <div className="location__quick-actions" aria-label="방문 빠른 메뉴">
            <a href={church.mapUrl || "#location"} target="_blank" rel="noopener noreferrer">길찾기</a>
            {church.phone && <a href={`tel:${church.phone.replace(/[^\d+]/g, "")}`}>전화 문의</a>}
          </div>
          <dl>
            <div>
              <dt>대중교통</dt>
              <dd>{church.transitInfo || "대중교통 정보는 교회에 문의해 주세요."}</dd>
            </div>
            <div>
              <dt>주차</dt>
              <dd>{church.parkingInfo || "주차 정보는 교회에 문의해 주세요."}</dd>
            </div>
            <div>
              <dt>문의</dt>
              <dd>{church.phone || "연락처 정보는 준비 중입니다."}</dd>
            </div>
          </dl>
          <div className="location__actions">
            <a
              className="button button--dark"
              href={church.mapUrl || "#location"}
              target="_blank"
              rel="noopener noreferrer"
            >
              지도에서 길 찾기
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
