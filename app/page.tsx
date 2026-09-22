import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
export const metadata: Metadata = { title: "함께 비전을 세우는 공동체" };
const Arrow = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10h11M11 6l4 4-4 4" />
  </svg>
);
export default function HomePage() {
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
          <p className="eyebrow hero__eyebrow">GLOBAL COMMUNITY CHURCH</p>
          <h1 id="hero-title">
            우리 안의 비전을
            <br />
            함께 세우는 교회
          </h1>
          <p className="hero__copy">
            믿음이 익숙하지 않아도 괜찮습니다.
            <br />
            시흥에서 함께 질문하고, 함께 자라갑니다.
          </p>
          <div className="hero__actions">
            <Link className="button button--solid" href="/worship">
              예배 시간 확인
              <Arrow />
            </Link>
          </div>
        </div>
        <Link className="hero__bottom-link" href="/about">
          어떤 교회인가요? <span aria-hidden="true">→</span>
        </Link>
        <div className="hero__quick-info" aria-label="길 찾기">
          <Link href="#location">
            길 찾기
            <Arrow />
          </Link>
        </div>
        <span className="demo-label">CONCEPT DEMO</span>
      </section>
      <section
        className="intro section"
        id="about"
        aria-labelledby="about-title"
      >
        <div className="page-shell intro__grid">
          <div className="section-heading">
            <p className="eyebrow">OUR HEART</p>
            <h2 id="about-title">
              교회는 함께 살아가는
              <br />
              사람들의 이야기라고 믿습니다.
            </h2>
          </div>
          <div className="intro__body">
            <p className="intro__lead">
              글로벌교회는 삶의 목적과 하나님의 뜻을 함께 고민하고, 각 사람 안에
              주신 비전을 세워가는 공동체를 꿈꿉니다.
            </p>
            <p>
              완벽한 사람을 기다리지 않습니다. 질문이 있어도, 믿음이 아직
              낯설어도 괜찮습니다. 하나님과 이웃을 알아가는 길을 함께 걷습니다.
            </p>
            <Link className="text-link" href="/about">
              교회 소개 자세히 보기
            </Link>
          </div>
        </div>
        <div className="values page-shell" aria-label="교회의 세 가지 가치">
          <article>
            <span>01</span>
            <h3>삶의 목적을 묻는 말씀</h3>
            <p>
              정답을 주입하기보다 하나님의 뜻을 함께 묻고 진지하게 대화합니다.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>함께 자라는 공동체</h3>
            <p>
              서로의 속도와 질문을 존중하며 예배와 일상의 자리를 함께 나눕니다.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>다음 세대를 세우는 비전</h3>
            <p>
              청소년과 청년이 자신의 부르심을 발견하고 삶으로 살아내도록
              돕습니다.
            </p>
          </article>
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
              이번 주일,
              <br />
              편안하게 오세요.
            </h2>
            <p>
              아래 시간과 장소는 레이아웃 확인을 위한 예시입니다.
              <br />
              운영 전 실제 예배 정보로 교체해 주세요.
            </p>
            <Link className="button button--cream" href="#location">
              예배 장소 확인
            </Link>
          </div>
          <div className="schedule">
            <article className="schedule__primary">
              <p>주일예배</p>
              <strong>10:30</strong>
              <div>
                <span>매주 일요일</span>
                <span>상세 시간·장소 확인 필요</span>
              </div>
            </article>
            {[
              ["어린이예배", "4세–초등학생 · 꿈마루 1층", "10:30"],
              ["청년예배", "대학생·청년 · 지유쓰", "14:00"],
              ["수요기도회", "누구나 · 작은예배실 3층", "19:30"],
            ].map(([title, copy, time]) => (
              <article key={title}>
                <div>
                  <p>{title}</p>
                  <span>{copy}</span>
                </div>
                <strong>{time}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>
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
            글로벌교회로
            <br />
            오시는 길
          </h2>
          <address>
            경기도 시흥시
            <br />
            하상로8번길 12-1
          </address>
          <dl>
            <div>
              <dt>지하철</dt>
              <dd>가까운 대중교통 정보를 입력해 주세요.</dd>
            </div>
            <div>
              <dt>주차</dt>
              <dd>주차 가능 여부를 입력해 주세요.</dd>
            </div>
            <div>
              <dt>문의</dt>
              <dd>연락처 입력 예정</dd>
            </div>
          </dl>
          <div className="location__actions">
            <a
              className="button button--dark"
              href="https://share.google/0DF5W8pHQeUwgCa4t"
              target="_blank"
              rel="noopener noreferrer"
            >
              지도에서 길 찾기
            </a>
            <Link className="text-link" href="#worship">
              예배 안내 다시 보기
            </Link>
          </div>
          <small>
            ※ 예배 시간과 연락처는 운영 전 실제 정보로 확인해 주세요.
          </small>
        </div>
      </section>
    </main>
  );
}
