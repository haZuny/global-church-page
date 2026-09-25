import type { Metadata } from "next";
import { getChurchInfo, getMinisters } from "@/lib/directus-content";
import { RichText } from "@/components/rich-text/rich-text";

export const metadata: Metadata = { title: "교회 소개" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [church, ministers] = await Promise.all([getChurchInfo(), getMinisters()]);
  return <div className="subpage about-page"><main id="main-content">
    <section className="about-hero" aria-labelledby="about-page-title"><div className="page-shell about-hero__inner"><p className="eyebrow">ABOUT {church.englishName.toUpperCase()}</p><h1 id="about-page-title">{church.aboutTitle}</h1><p>{church.introduction}</p></div></section>
    <nav className="about-local-nav" aria-label="교회 소개 목차"><div className="page-shell"><a href="#greeting">소개 인사</a><a href="#ministers">교역자 소개</a><a href="#vision">비전</a><a href="#denomination">교단 소개</a></div></nav>
    <section className="pastor-message section" id="greeting" aria-labelledby="greeting-title"><div className="page-shell pastor-message__grid"><div className="pastor-message__label"><p className="eyebrow">INTRODUCTION</p><span>01</span></div><div className="pastor-message__copy"><h2 id="greeting-title">{church.greetingTitle}</h2><p className="pastor-message__lead">{church.greetingLead}</p><RichText html={church.greetingBody}/><p className="pastor-message__sign">{church.churchName} 담임목사 <strong>{church.pastorName}</strong></p></div></div></section>
    <section className="ministers-section section" id="ministers" aria-labelledby="ministers-title"><div className="page-shell"><div className="ministers-section__heading"><div className="section-heading"><p className="eyebrow">OUR MINISTERS</p><h2 id="ministers-title">함께 섬기는<br/>교역자를 소개합니다.</h2></div></div><div className="minister-grid">{ministers.map((minister) => <article className="minister-card" key={minister.id}>{minister.photo ? <img className="minister-card__photo" src={minister.photo} alt={`${minister.name} ${minister.role} 프로필 사진`}/> : <div className="minister-card__photo" role="img" aria-label={`${minister.name} ${minister.role} 프로필 사진 준비 중`}><span>PROFILE PHOTO</span><small>프로필 사진 준비 중</small></div>}<p>{minister.role}</p><h3>{minister.name} 목사</h3><div>{minister.description}</div></article>)}</div></div></section>
    <section className="vision-section section" id="vision" aria-labelledby="vision-title"><div className="page-shell"><div className="vision-section__heading"><div className="section-heading"><p className="eyebrow">OUR VISION</p><h2 id="vision-title">{church.visionTitle}</h2></div><RichText html={church.visionIntro} className="vision-section__intro" /></div><div className="vision-list">{church.visions.map((vision, index) => <article key={vision.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{vision.title}</h3><RichText html={vision.body} className="vision-list__body" /></article>)}</div></div></section>
    <section className="denomination-section section" id="denomination" aria-labelledby="denomination-title"><div className="page-shell denomination-section__grid"><div className="section-heading"><p className="eyebrow">OUR DENOMINATION</p><h2 id="denomination-title">교단을<br/>소개합니다.</h2></div><div className="denomination-section__copy"><h3>{church.denominationIntro}</h3><RichText html={church.denominationDetail}/></div></div></section>
  </main></div>;
}
