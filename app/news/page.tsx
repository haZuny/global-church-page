import type { Metadata } from "next";
import { LegacyPage } from "@/components/legacy-page/legacy-page";
export const metadata: Metadata = { title: "주보·소식" };
export default function NewsPage() { return <LegacyPage file="news.html" pageClass="news-page" />; }
