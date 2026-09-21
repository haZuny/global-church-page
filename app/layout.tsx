import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.scss";
import "../styles.css";
import { SiteChrome } from "@/components/site-chrome/site-chrome";

export const metadata: Metadata = { title: { default: "글로벌교회 | 함께 비전을 세우는 공동체", template: "%s | 글로벌교회" }, description: "시흥 글로벌교회의 분위기와 예배, 공동체 이야기를 편안하게 소개합니다." };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="ko"><body><SiteChrome>{children}</SiteChrome></body></html>;
}
