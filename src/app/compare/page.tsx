import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import CompareView from "@/components/views/CompareView";
import { guidePositions, listPoliticians, stanceGrid } from "@/lib/repo";

/**
 * Records change between deploys, so this page is rebuilt in the background
 * at most every five minutes rather than frozen at whatever the database
 * held when the deploy ran.
 */
export const revalidate = 300;


export const metadata: Metadata = { title: "Compare" };

export default async function ComparePage() {
  const [politicians, stances, positions] = await Promise.all([
    listPoliticians(),
    stanceGrid(),
    guidePositions(),
  ]);

  return (
    <AppShell>
      <CompareView politicians={politicians} stances={stances} guidePositions={positions} />
    </AppShell>
  );
}
