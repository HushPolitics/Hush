import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import GuideView from "@/components/views/GuideView";
import { guidePositions, listPoliticians, listRaces, topicPool } from "@/lib/repo";

export const metadata: Metadata = { title: "HUSH Guide" };

export default function GuidePage() {
  return (
    <AppShell kicker="HUSH Guide" title="Your ballot, researched">
      <GuideView
        politicians={listPoliticians()}
        races={listRaces()}
        topicPool={topicPool()}
        positions={guidePositions()}
      />
    </AppShell>
  );
}
