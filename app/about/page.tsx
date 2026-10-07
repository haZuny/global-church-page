import type { Metadata } from "next";
import { contentImageUrl, fallbackChurchInfo, getChurchInfo, getMinisters } from "@/lib/directus-content";
import { RichText } from "@/components/rich-text/rich-text";
import { ContentState } from "@/components/content-state/content-state";

export const metadata: Metadata = { title: "교회 소개", description: "글로벌교회 목회자, 교역자, 교단과 연혁.", alternates: { canonical: "/about" } };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [churchResult, ministersResult] = await Promise.allSettled([getChurchInfo(), getMinisters()]);
  const church = churchResult.status === "fulfilled" ? churchResult.value : fallbackChurchInfo;
  const ministers = ministersResult.status === "fulfilled" ? ministersResult.value : [];
  const servingMinisters = ministers.filter((minister) => minister.name !== church.pastorName && minister.role !== church.pastorRole);
  return <div className="subpage about-page"><main id="main-content" tabIndex={-1}>
    <section className="about-hero" aria-labelledby="about-page-title"><div className="page-shell about-hero__inner"><p className="eyebrow">교회 소개</p><h1 id="about-page-title" style={{ overflowWrap: "anywhere", wordBreak: "break-all" }}>{church.aboutTitle}</h1><p>{church.introduction}</p></div></section>
    <nav className="about-local-nav" aria-label="교회 소개 목차"><div className="page-shell"><a href="#pastor">담임목사</a><a href="#ministers">섬기는 이</a><a href="#history">교단·연혁</a></div></nav>
    <section className="pastor-message section" id="pastor" aria-labelledby="pastor-title"><div className="page-shell pastor-message__grid"><div className="pastor-message__portrait">{church.pastorPhoto ? <img src={contentImageUrl(church.pastorPhoto, "profile")} alt={`${church.pastorName} ${church.pastorRole} 사진`}/> : <div role="img" aria-label={`${church.pastorName || "담임목사"} 사진 없음`}><small>사진이 없습니다.</small></div>}</div><div className="pastor-message__copy"><p className="eyebrow">담임목사</p><h2 id="pastor-title">{church.pastorTitle}</h2><p className="pastor-message__lead">{church.pastorLead}</p><RichText html={church.pastorBody}/><p className="pastor-message__sign">{church.pastorRole} <strong>{church.pastorName}</strong></p></div></div></section>
    <section className="ministers-section section" id="ministers" aria-labelledby="ministers-title"><div className="page-shell"><div className="ministers-section__heading"><div className="section-heading"><h2 id="ministers-title">섬기는 분들</h2></div></div>{servingMinisters.length ? <div className="minister-grid">{servingMinisters.map((minister) => <article className="minister-card" key={minister.id}>{minister.photo ? <img className="minister-card__photo" src={contentImageUrl(minister.photo, "profile")} alt={`${minister.name} ${minister.role} 사진`}/> : <div className="minister-card__photo" role="img" aria-label={`${minister.name} ${minister.role} 사진 없음`}><small>사진이 없습니다.</small></div>}<p>{minister.role}</p><h3>{minister.name}</h3><div>{minister.description}</div></article>)}</div> : <ContentState title="등록된 교역자 정보가 없습니다."/>}</div></section>
    <section className="denomination-section section" id="history" aria-labelledby="history-title"><div className="page-shell denomination-section__grid"><div className="section-heading"><p className="eyebrow">교단·연혁</p><h2 id="history-title">교단과{" "}<br className="about-title-break"/>연혁</h2></div><div className="denomination-section__copy"><RichText html={church.denominationHistory}/></div></div></section>
  </main></div>;
}
