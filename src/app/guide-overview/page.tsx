import type { Metadata } from "next";
import GuideOverview from "@/components/GuideOverview";

export const metadata: Metadata = { title: "HUSH. Guide" };

export default function GuideOverviewPage() {
  return <GuideOverview />;
}
