import type { Metadata } from "next";
import { LegacyPage } from "@/components/legacy-page/legacy-page";
export const metadata: Metadata = { title: "설교" };
export default function SermonsPage() { return <LegacyPage file="sermons.html" pageClass="sermons-page" />; }
