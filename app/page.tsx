import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getChurchInfo, getNewsEntries, getStories, getWorshipServices } from "@/lib/directus-content";
export const metadata: Metadata = { title: "함께 비전을 세우는 공동체" };
export const dynamic = "force-dynamic";
const Arrow = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10h11M11 6l4 4-4 4" />
  </svg>
);
export default async function HomePage() {
  const [church, services, stories, newsEntries] = await Promise.all([getChurchInfo(), getWorshipServices(), getStories(), getNewsEntries()]);
  const latestStories = stories.slice(0, 3);
  const latestStory = latestStories[0];
  const latestNews = newsEntries[0];
  return (
    <main id="main-content" className="home-page">
      <section className="hero" id="home" aria-labelledby="hero-title">
        <Image
          className="hero__image"
          src="/assets/images/church-building.png"
          alt="푸른 하늘 아래 자리한 글로벌교회 건물 전경"
          fill
          priority
          sizes="100vw"
        />
        <div className="hero__veil" />
        <div className="hero__content page-shell">
          <p className="eyebrow hero__eyebrow">{church.englishName}</p>
          <h1 id="hero-title">
            {church.heroTitle.split(" ").slice(0, -2).join(" ") || church.heroTitle}
            {church.heroTitle.includes(" ") && <><br />{church.heroTitle.split(" ").slice(-2).join(" ")}</>}
          </h1>
          <p className="hero__copy">
            {church.heroCopy}
          </p>
          <div className="hero__actions">
            <Link className="button button--solid" href="/about">
              교회 소개 더보기
              <Arrow />
            </Link>
          </div>
        </div>
        <div className="hero__quick-info" aria-label="길 찾기">
          <Link href="#location">
            길 찾기
            <Arrow />
          </Link>
        </div>
        <span className="demo-label">CONCEPT DEMO</span>
      </section>
      {latestStory && <section className="home-updates home-updates--stories section" aria-labelledby="home-stories-title">
        <div className="page-shell">
          <div className="home-updates__heading">
            <div className="section-heading">
              <p className="eyebrow">CHURCH STORIES</p>
              <h2 id="home-stories-title">함께 살아가는<br/>이야기</h2>
            </div>
            <p>최근의 사진과 기록으로 글로벌교회의 오늘을 전합니다.</p>
          </div>
          <div className="home-updates__grid">
            <article className="latest-story">
              <Link href={`/stories/${latestStory.id}`} aria-label={`${latestStory.title} 이야기 보기`}>
                <div className="latest-story__image"><Image src={latestStory.image} alt={latestStory.alt} fill unoptimized sizes="(max-width: 780px) 100vw, 52vw"/></div>
                <div className="latest-story__copy"><p><time dateTime={latestStory.dateTime}>{latestStory.date}</time></p><h3>{latestStory.title}</h3></div>
              </Link>
            </article>
            {latestStories.length > 1 && <div className="update-list" aria-label="최근 교회 이야기 목록">
              {latestStories.slice(1).map((story) => <Link href={`/stories/${story.id}`} key={story.id}><time dateTime={story.dateTime}>{story.date}</time><div><strong>{story.title}</strong></div></Link>)}
            </div>}
          </div>
          <Link className="update-list__more" href="/stories">교회 이야기 전체 보기</Link>
        </div>
      </section>}
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
              이번 주
              <br />
              예배 시간
            </h2>
            <p>처음 오신 분도 별도 등록 없이 예배에 참여하실 수 있습니다.</p>
          </div>
          <div className="schedule">
            {services.map((service) => (
              <article key={service.id}>
                <div>
                  <p>{service.name}</p>
                  <span>매주 {service.weekdays.join(" · ")}</span>
                </div>
                <strong>{service.time}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>
      {latestNews && <section className="home-updates home-updates--news section" aria-labelledby="home-news-title">
        <div className="page-shell">
          <div className="home-updates__heading">
            <div className="section-heading"><p className="eyebrow">BULLETIN &amp; NEWS</p><h2 id="home-news-title">이번 주<br/>주보·소식</h2></div>
            <p>가장 최근에 발행된 주보 또는 공지입니다.</p>
          </div>
          <article className="latest-story latest-news-card">
            <Link href={`/news/${latestNews.href}`} aria-label={`${latestNews.title} 보기`}>
              {latestNews.image && <div className="latest-story__image"><Image src={latestNews.image} alt={latestNews.title} fill unoptimized sizes="(max-width: 780px) 100vw, 52vw"/></div>}
              <div className="latest-story__copy"><p><time dateTime={latestNews.dateTime}>{latestNews.date}</time><span>{latestNews.category}</span></p><h3>{latestNews.title}</h3></div>
            </Link>
          </article>
          <Link className="update-list__more" href="/news">주보·소식 전체 보기</Link>
        </div>
      </section>}
      <section
        className="location section"
        id="location"
        aria-labelledby="location-title"
      >
        <div className="location__map" aria-hidden="true">
          <div className="map-road map-road--one" />
          <div className="map-road map-road--two" />
          <div className="map-road map-road--three" />
          <div className="map-block map-block--one" />
          <div className="map-block map-block--two" />
          <div className="map-block map-block--three" />
          <div className="map-water" />
          <div className="map-pin">
            <svg viewBox="0 0 32 40">
              <path d="M16 39S3 25.5 3 14.5a13 13 0 1 1 26 0C29 25.5 16 39 16 39Z" />
              <circle cx="16" cy="14" r="5" />
            </svg>
          </div>
          <span className="map-label map-label--one">시흥시</span>
          <span className="map-label map-label--two">글로벌교회</span>
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
          <dl>
            <div>
              <dt>지하철</dt>
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
