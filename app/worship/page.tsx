import type { Metadata } from "next";
import { getChurchInfo, getWorshipServices } from "@/lib/directus-content";

export const metadata: Metadata = { title: "예배 안내" };
export const dynamic = "force-dynamic";

export default async function WorshipPage() {
  const [church, services] = await Promise.all([getChurchInfo(), getWorshipServices()]);
  return <div className="subpage"><main id="main-content">
    <section className="archive-hero archive-hero--worship" aria-labelledby="worship-page-title"><div className="page-shell archive-hero__inner"><div><p className="eyebrow">WORSHIP WITH US</p><h1 id="worship-page-title">이번 주일,<br/>편안하게 오세요.</h1></div><p>예배 시간과 장소를 먼저 확인하고,<br/>처음 오시는 분도 부담 없이 준비할 수 있도록 안내합니다.</p></div></section>
    <section className="worship worship-page-section section" aria-labelledby="worship-schedule-title"><div className="worship__orb worship__orb--one"/><div className="worship__orb worship__orb--two"/><div className="page-shell worship__grid"><div className="section-heading reveal"><p className="eyebrow">WEEKLY SCHEDULE</p><h2 id="worship-schedule-title">함께 드리는<br/>예배입니다.</h2><p>{church.visitNotice}</p></div><div className="schedule reveal">{services.map((service) => <article key={service.id}><div><p>{service.name}</p><span>매주 {service.weekdays.join(" · ")}</span></div><strong>{service.time}</strong></article>)}</div></div></section>
    <section className="worship-visit section" aria-labelledby="worship-visit-title"><div className="page-shell worship-visit__grid"><div className="section-heading reveal"><p className="eyebrow">YOUR FIRST VISIT</p><h2 id="worship-visit-title">처음 오신다면<br/>이렇게 준비하세요.</h2></div><div className="worship-visit__copy reveal"><ol><li><strong>예배 10분 전 도착</strong><span>예배당 위치를 천천히 확인하고 안내를 받을 수 있어요.</span></li><li><strong>편안한 복장</strong><span>정해진 복장은 없습니다. 편안한 마음으로 오세요.</span></li><li><strong>궁금한 점은 현장에서</strong><span>{church.visitNotice}</span></li></ol></div></div></section>
    <section className="worship-location section" aria-labelledby="worship-location-title"><div className="page-shell worship-location__inner"><div><p className="eyebrow">LOCATION</p><h2 id="worship-location-title">{church.address}</h2></div><div><p>{church.churchName}</p>{church.mapUrl && <a className="button button--dark" href={church.mapUrl} target="_blank" rel="noopener noreferrer">지도에서 길 찾기</a>}</div></div></section>
  </main></div>;
}
