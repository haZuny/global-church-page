import type { Metadata } from "next";
import { contentImageUrl, getChurchInfo, getMinisters } from "@/lib/directus-content";
import { RichText } from "@/components/rich-text/rich-text";
import { ContentState } from "@/components/content-state/content-state";

export const metadata: Metadata = { title: "교회 소개" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [church, ministers] = await Promise.all([getChurchInfo(), getMinisters()]);
  const servingMinisters = ministers.filter((minister) => minister.name !== church.pastorName && minister.role !== church.pastorRole);
  return <div className="subpage about-page"><main id="main-content" tabIndex={-1}>
    <section className="about-hero" aria-labelledby="about-page-title"><div className="page-shell about-hero__inner"><p className="eyebrow">ABOUT {church.englishName.toUpperCase()}</p><h1 id="about-page-title" style={{ overflowWrap: "anywhere", wordBreak: "break-all" }}>{church.aboutTitle}</h1><p>{church.introduction}</p></div></section>
    <nav className="about-local-nav" aria-label="교회 소개 목차"><div className="page-shell"><a href="#pastor">담임목사</a><a href="#ministers">섬기는 이</a><a href="#history">교단·연혁</a></div></nav>
    <section className="pastor-message section" id="pastor" aria-labelledby="pastor-title"><div className="page-shell pastor-message__grid"><div className="pastor-message__portrait">{church.pastorPhoto ? <img src={contentImageUrl(church.pastorPhoto, "profile")} alt={`${church.pastorName} ${church.pastorRole} 프로필 사진`}/> : <div role="img" aria-label={`${church.pastorName || "담임목사"} 프로필 사진 준비 중`}><span>PASTOR PHOTO</span><small>프로필 사진 준비 중</small></div>}</div><div className="pastor-message__copy"><p className="eyebrow">LEAD PASTOR</p><h2 id="pastor-title">{church.pastorTitle}</h2><p className="pastor-message__lead">{church.pastorLead}</p><RichText html={church.pastorBody}/><p className="pastor-message__sign">{church.pastorRole} <strong>{church.pastorName}</strong></p></div></div></section>
    <section className="ministers-section section" id="ministers" aria-labelledby="ministers-title"><div className="page-shell"><div className="ministers-section__heading"><div className="section-heading"><p className="eyebrow">OUR TEAM</p><h2 id="ministers-title">함께 섬기는<br/>이들을 소개합니다.</h2></div></div>{servingMinisters.length ? <div className="minister-grid">{servingMinisters.map((minister) => <article className="minister-card" key={minister.id}>{minister.photo ? <img className="minister-card__photo" src={contentImageUrl(minister.photo, "profile")} alt={`${minister.name} ${minister.role} 프로필 사진`}/> : <div className="minister-card__photo" role="img" aria-label={`${minister.name} ${minister.role} 프로필 사진 준비 중`}><span>PROFILE PHOTO</span><small>프로필 사진 준비 중</small></div>}<p>{minister.role}</p><h3>{minister.name} 목사</h3><div>{minister.description}</div></article>)}</div> : <ContentState title="섬기는 이를 준비하고 있습니다." description="교역자 소개를 곧 안내해 드리겠습니다."/>}</div></section>
    <section className="denomination-section section" id="history" aria-labelledby="history-title"><div className="page-shell denomination-section__grid"><div className="section-heading"><p className="eyebrow">DENOMINATION &amp; HISTORY</p><h2 id="history-title">교단과<br/>연혁</h2></div><div className="denomination-section__copy"><RichText html={church.denominationHistory}/></div></div></section>
  </main></div>;
}
