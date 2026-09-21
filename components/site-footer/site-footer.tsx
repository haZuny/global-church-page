import Link from "next/link";
import styles from "./site-footer.module.scss";
const defaultLinks = [
  ["교회 이야기", "/stories"],
  ["주보·소식", "/news"],
  ["오시는 길", "/#location"],
] as const;
const worshipLinks = [
  ["교회 소개", "/about"],
  ["예배 안내", "/worship"],
  ["교회 이야기", "/stories"],
  ["주보·소식", "/news"],
] as const;

export function SiteFooter({ variant = "default" }: { variant?: "default" | "worship" }) {
  const links = variant === "worship" ? worshipLinks : defaultLinks;
  return <footer className={styles.footer}><div className="page-shell"><div className={styles.top}><Link className={styles.brand} href="/#home"><svg className={styles.mark} viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.5v25M7 12.5h18"/><circle cx="16" cy="16" r="13.5"/></svg><span>글로벌교회</span></Link><p>우리 안의 비전을 함께 세우는 공동체</p></div><div className={styles.bottom}><p>경기도 시흥시 하상로8번길 12-1 · 연락처 입력 예정</p><div className={styles.links}>{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}{variant === "default" && <span>개인정보처리방침 준비 중</span>}</div><p className={styles.copyright}>© 2026 GLOBAL COMMUNITY CHURCH</p></div></div></footer>;
}
