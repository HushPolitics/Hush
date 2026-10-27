import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import GuideView from "@/components/views/GuideView";
import { ballotMeasures, guidePositions, listPoliticians, listRaces, topicPool } from "@/lib/repo";

/**
 * Records change between deploys, so this page is rebuilt in the background
 * at most every five minutes rather than frozen at whatever the database
 * held when the deploy ran.
 */
export const revalidate = 300;


export const metadata: Metadata = { title: "HUSH. Guide" };

export default async function HushGuidePage() {
  const [politicians, races, positions] = await Promise.all([
    listPoliticians(),
    listRaces(),
    guidePositions(),
  ]);
  const bills = ballotMeasures();

  return (
    <AppShell>
      <GuideView
        politicians={politicians}
        races={races}
        topicPool={topicPool()}
        positions={positions}
        bills={bills}
      />
    </AppShell>
  );
}
