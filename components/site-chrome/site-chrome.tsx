"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer/site-footer";
import { SiteHeader } from "@/components/site-header/site-header";
import styles from "./site-chrome.module.scss";
import publicPageStyles from "./public-pages.module.scss";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isReactPage = pathname === "/" || ["/about", "/worship", "/stories", "/news", "/sermons"].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const pageScope = pathname === "/" ? styles.home : pathname.startsWith("/about") ? styles.about : pathname.startsWith("/worship") ? styles.worship : pathname.startsWith("/stories") ? styles.stories : pathname.startsWith("/news") ? styles.news : pathname.startsWith("/sermons") ? styles.sermons : undefined;

  return (
    <div className={`${styles.chrome} ${publicPageStyles.chrome}`}>
      {isReactPage && (
        <>
          <a className="skip-link" href="#main-content">본문으로 바로가기</a>
          <SiteHeader />
        </>
      )}
      <div className={pageScope}>{children}</div>
      {isReactPage && <SiteFooter variant={pathname === "/worship" ? "worship" : "default"} />}
    </div>
  );
}
