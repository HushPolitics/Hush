import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import BallotView from "@/components/views/BallotView";
import { listPoliticians, listRaces } from "@/lib/repo";

/**
 * Records change between deploys, so this page is rebuilt in the background
 * at most every five minutes rather than frozen at whatever the database
 * held when the deploy ran.
 */
export const revalidate = 300;


export const metadata: Metadata = { title: "Your Ballot" };

export default async function YourBallotPage() {
  const [races, politicians] = await Promise.all([listRaces(), listPoliticians()]);

  return (
    <AppShell>
      <BallotView races={races} politicians={politicians} />
    </AppShell>
  );
}
