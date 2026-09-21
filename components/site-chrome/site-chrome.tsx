"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer/site-footer";
import { SiteHeader } from "@/components/site-header/site-header";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isReactPage = pathname === "/" || ["/about", "/worship", "/stories", "/news", "/sermons"].some((path) => pathname === path || pathname.startsWith(`${path}/`));

  return (
    <>
      {isReactPage && (
        <>
          <a className="skip-link" href="#main-content">본문으로 바로가기</a>
          <SiteHeader />
        </>
      )}
      {children}
      {isReactPage && <SiteFooter variant={pathname === "/worship" ? "worship" : "default"} />}
    </>
  );
}
