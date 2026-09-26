import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.scss";
import "../styles.css";
import { SiteChrome } from "@/components/site-chrome/site-chrome";
import { fallbackChurchInfo, getChurchInfo } from "@/lib/directus-content";

export const metadata: Metadata = { title: { default: "글로벌교회 | 함께 비전을 세우는 공동체", template: "%s | 글로벌교회" }, description: "시흥 글로벌교회의 분위기와 예배, 공동체 이야기를 편안하게 소개합니다." };

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  let church = fallbackChurchInfo;
  try { church = await getChurchInfo(); } catch { /* Keep the public shell usable while Directus recovers. */ }
  return <html lang="ko"><body><SiteChrome footerInfo={{ churchName: church.churchName, tagline: church.heroTitle, address: church.address, phone: church.phone }}>{children}</SiteChrome></body></html>;
}
