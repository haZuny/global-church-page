"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./site-header.module.scss";

const links = [["교회 소개", "/about"], ["교회 이야기", "/stories"], ["주보·소식", "/news"], ["설교", "/sermons"]] as const;
const revealSelector = ".home-page .intro .section-heading, .home-page .intro__body, .home-page .values, .home-page .worship .section-heading, .home-page .schedule, .home-page .location__card, .reveal, .about-page .pastor-message__label, .about-page .pastor-message__copy, .about-page .church-introduction .section-heading, .about-page .church-introduction__copy, .about-page .vision-section__heading, .about-page .vision-list, .about-page .vision-statement, .about-page .denomination-section .section-heading, .about-page .denomination-section__copy, .about-page .ministers-section__heading, .about-page .minister-card, .worship-page-section .section-heading, .worship-page-section .schedule, .worship-visit .section-heading, .worship-visit__copy, .story-detail__visual, .story-detail__body, .bulletin-document, .detail-nav";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
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
  }, [pathname]);

  return <header className={`${styles.header} ${pathname !== "/" ? styles.solid : ""} ${scrolled ? styles.scrolled : ""} ${open ? styles.menuOpen : ""}`}><Link className={styles.brand} href="/#home" aria-label="글로벌교회 홈으로 이동" onClick={close}><svg className={styles.mark} viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.5v25M7 12.5h18"/><circle cx="16" cy="16" r="13.5"/></svg><span>글로벌교회</span></Link><nav className={styles.desktopNav} aria-label="주요 메뉴">{links.map(([name, href]) => { const current = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} className={current ? styles.current : undefined} aria-current={current ? "page" : undefined}>{name}</Link>; })}</nav><Link className={styles.cta} href="/#worship">처음 오셨나요?</Link><button className={styles.menuToggle} type="button" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "메뉴 닫기" : "메뉴 열기"} onClick={() => setOpen(!open)}><span/><span/></button><div className={styles.mobileMenu} id="mobile-menu" hidden={!open}><nav aria-label="모바일 주요 메뉴">{links.map(([name, href]) => { const current = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} onClick={close} aria-current={current ? "page" : undefined}>{name}</Link>; })}</nav><p>시흥 글로벌교회<br/>예배 시간과 연락처는 운영 전 확인이 필요합니다.</p></div></header>;
}
