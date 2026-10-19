import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import PoliticiansView from "@/components/views/PoliticiansView";
import { listPoliticians, listRaces, stanceGrid } from "@/lib/repo";

/**
 * Records change between deploys, so this page is rebuilt in the background
 * at most every five minutes rather than frozen at whatever the database
 * held when the deploy ran.
 */
export const revalidate = 300;


export const metadata: Metadata = { title: "Politicians" };

export default async function PoliticiansPage() {
  const [politicians, races, stances] = await Promise.all([
    listPoliticians(),
    listRaces(),
    stanceGrid(),
  ]);

  return (
    <AppShell>
      <PoliticiansView politicians={politicians} races={races} stances={stances} />
    </AppShell>
  );
}
