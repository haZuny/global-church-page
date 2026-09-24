import type { Metadata } from "next";
import Link from "next/link";
import { getNewsEntries } from "@/lib/directus-content";

export const metadata: Metadata = { title: "주보·소식" };

export const dynamic = "force-dynamic";
export default async function NewsPage() {
  const entries = await getNewsEntries();
  const latestBulletin = entries.find((entry) => entry.kind === "bulletin");
  return (
    <div className="subpage">
      <main id="main-content">
        <section
          className="archive-hero archive-hero--news"
          aria-labelledby="page-title"
        >
          <div className="page-shell archive-hero__inner">
            <div>
              <p className="eyebrow">BULLETIN &amp; NEWS</p>
              <h1 id="page-title">
                주보와
                <br />
                글로벌 소식
              </h1>
            </div>
            <p>
              매주 예배 순서와 공동체 일정을 확인하고,
              <br />
              앞으로 함께할 모임과 공지 내용을 살펴보세요.
            </p>
          </div>
        </section>
        <section
          className="notice-archive section"
          aria-label="주보와 소식 목록"
        >
          <div className="page-shell">
            <div className="archive-toolbar reveal">
              <nav aria-label="소식 분류">
                <span className="is-active">전체</span>
                <span>주보</span>
                <span>공지</span>
                <span>자료</span>
              </nav>
              <span>2026</span>
            </div>
            <article className="bulletin-feature reveal">
              <div className="bulletin-feature__date">
                <span>MAR</span>
                <strong>15</strong>
                <small>2026</small>
              </div>
              <div className="bulletin-feature__copy">
                <p>
                  <span>NEW</span> 이번 주 주보
                </p>
                <h2>
                  2026년 3월 15일
                  <br />
                  글로벌교회 주보
                </h2>
                <p>
                  예배 순서와 한 주의 안내를 이 페이지에서 바로 확인할 수
                  있습니다.
                </p>
                <div>
                  {latestBulletin && <Link className="button button--dark" href={`/news/${latestBulletin.href}`}>이번 주보 보기</Link>}
                  <a className="text-link" href="#bulletin-list">
                    지난 주보 보기
                  </a>
                </div>
              </div>
              <div className="bulletin-feature__paper" aria-hidden="true">
                <span>
                  GLOBAL
                  <br />
                  WEEKLY
                </span>
                <strong>
                  03
                  <br />
                  15
                </strong>
                <small>
                  함께 예배하고
                  <br />
                  함께 살아갑니다
                </small>
              </div>
            </article>
            <div className="notice-list reveal" id="bulletin-list">
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
                    <p>{entry.summary}</p>
                  </div>
                  <i aria-hidden="true">→</i>
                </Link>
              ))}
            </div>
            <p className="archive-source reveal">
              주보와 예배 자료를 날짜순으로 모았습니다. 각 항목을 누르면 이
              사이트 안에서 내용을 바로 확인할 수 있습니다.
            </p>
          </div>
        </section>
        <section className="archive-bridge">
          <div className="page-shell">
            <p>처음 방문을 준비하고 있다면</p>
            <Link href="/worship">
              예배 안내 보기 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
