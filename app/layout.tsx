import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.scss";
import "../styles.css";
import { SiteChrome } from "@/components/site-chrome/site-chrome";
import { fallbackChurchInfo, getChurchInfo } from "@/lib/directus-content";
import { absoluteUrl, siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "글로벌교회 | 함께 비전을 세우는 공동체", template: "%s | 글로벌교회" },
  description: "시흥 글로벌교회의 분위기와 예배, 공동체 이야기를 편안하게 소개합니다.",
  alternates: { canonical: "/" },
  applicationName: "글로벌교회",
  keywords: ["글로벌교회", "시흥글로벌교회", "시흥 교회", "시흥시 교회", "시흥 예배"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "글로벌교회",
    title: "글로벌교회 | 함께 비전을 세우는 공동체",
    description: "시흥 글로벌교회의 분위기와 예배, 공동체 이야기를 편안하게 소개합니다.",
    images: [{ url: "/assets/images/church-building.png", width: 1774, height: 887, alt: "글로벌교회 건물 전경" }],
  },
  twitter: { card: "summary_large_image", title: "글로벌교회 | 함께 비전을 세우는 공동체", description: "시흥 글로벌교회의 분위기와 예배, 공동체 이야기를 편안하게 소개합니다.", images: ["/assets/images/church-building.png"] },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  other: process.env.NAVER_SITE_VERIFICATION ? { "naver-site-verification": process.env.NAVER_SITE_VERIFICATION } : undefined,
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  let church = fallbackChurchInfo;
  try { church = await getChurchInfo(); } catch { /* Keep the public shell usable while Directus recovers. */ }
  const churchSchema = {
    "@context": "https://schema.org",
    "@type": "Church",
    "@id": absoluteUrl("/#church"),
    name: church.churchName,
    alternateName: ["시흥글로벌교회", church.englishName],
    url: siteUrl,
    logo: absoluteUrl("/assets/images/logo1.png"),
    image: absoluteUrl("/assets/images/church-building.png"),
    description: church.introduction,
    address: { "@type": "PostalAddress", streetAddress: church.address, addressLocality: "시흥시", addressRegion: "경기도", addressCountry: "KR" },
    ...(church.phone ? { telephone: church.phone } : {}),
  };
  return <html lang="ko"><body><SiteChrome showSermons={church.showSermons} footerInfo={{ churchName: church.churchName, address: church.address, phone: church.phone, pastorName: church.pastorName, pastorRole: church.pastorRole }}>{children}</SiteChrome><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(churchSchema).replace(/</g, "\\u003c") }} /></body></html>;
}
