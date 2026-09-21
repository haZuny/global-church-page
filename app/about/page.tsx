import type { Metadata } from "next";
import { LegacyPage } from "@/components/legacy-page/legacy-page";
export const metadata: Metadata = { title: "교회 소개" };
export default function AboutPage() { return <LegacyPage file="about.html" pageClass="about-page" />; }
