"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [["교회 소개", "/about"], ["교회 이야기", "/stories"], ["주보·소식", "/news"], ["설교", "/sermons"]] as const;
const revealSelector = ".home-page .intro .section-heading, .home-page .intro__body, .home-page .values, .home-page .worship .section-heading, .home-page .schedule, .home-page .location__card";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    const syncHeader = () => setScrolled(window.scrollY > 24);
    syncHeader();
    window.addEventListener("scroll", syncHeader, { passive: true });
    return () => window.removeEventListener("scroll", syncHeader);
  }, []);

  useEffect(() => {
    const targets = [...document.querySelectorAll<HTMLElement>(revealSelector)];
    if (!targets.length) return;
    const revealPassedTargets = () => targets.forEach((target) => {
      if (target.getBoundingClientRect().top < window.innerHeight * 0.9) target.classList.add("is-visible");
    });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }
    targets.forEach((target) => target.classList.add("reveal"));
    revealPassedTargets();
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }), { rootMargin: "0px 0px -10%", threshold: 0.08 });
    targets.forEach((target) => observer.observe(target));
    window.addEventListener("scroll", revealPassedTargets, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", revealPassedTargets);
    };
  }, []);

  return <header className={`site-header ${scrolled ? "is-scrolled" : ""} ${open ? "is-menu-open" : ""}`}><Link className="brand" href="/#home" aria-label="글로벌교회 홈으로 이동" onClick={close}><svg className="brand__mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.5v25M7 12.5h18"/><circle cx="16" cy="16" r="13.5"/></svg><span>글로벌교회</span></Link><nav className="desktop-nav" aria-label="주요 메뉴">{links.map(([name, href]) => <Link key={href} href={href}>{name}</Link>)}</nav><Link className="header-cta" href="/#worship">처음 오셨나요?</Link><button className="menu-toggle" type="button" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "메뉴 닫기" : "메뉴 열기"} onClick={() => setOpen(!open)}><span/><span/></button><div className="mobile-menu" id="mobile-menu" hidden={!open}><nav aria-label="모바일 주요 메뉴">{links.map(([name, href]) => <Link key={href} href={href} onClick={close}>{name}</Link>)}</nav><p>시흥 글로벌교회<br/>예배 시간과 연락처는 운영 전 확인이 필요합니다.</p></div></header>;
}
