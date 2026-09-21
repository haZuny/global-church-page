import type { Metadata } from "next";
import { LegacyPage } from "@/components/legacy-page/legacy-page";
export const metadata: Metadata = { title: "교회 이야기" };
export default function StoryDetailPage() { return <LegacyPage file="story.html" pageClass="story-page" />; }
