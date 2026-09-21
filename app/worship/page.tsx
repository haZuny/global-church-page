import type { Metadata } from "next";
import { LegacyPage } from "@/components/legacy-page/legacy-page";
export const metadata: Metadata = { title: "예배 안내" };
export default function WorshipPage() { return <LegacyPage file="worship.html" pageClass="worship-page" />; }
