import type { Metadata } from "next";
import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import FeedView from "@/components/views/FeedView";
import {
  guidePositions,
  listArticles,
  listBills,
  listElectionUpdates,
  listFactChecks,
  listPoliticians,
  listRaces,
  listVotes,
  stancePositions,
} from "@/lib/repo";

/**
 * Records change between deploys, so this page is rebuilt in the background
 * at most every five minutes rather than frozen at whatever the database
 * held when the deploy ran.
 */
export const revalidate = 300;


export const metadata: Metadata = { title: "Feed" };

export default async function FeedPage() {
  const [politicians, factChecks, races, guide, stance, votes, bills, electionUpdates, articles] =
    await Promise.all([
      listPoliticians(),
      listFactChecks(),
      listRaces(),
      guidePositions(),
      stancePositions(),
      listVotes(),
      listBills(),
      listElectionUpdates(),
      listArticles(),
    ]);

  return (
    <AppShell>
      <Suspense fallback={null}>
        <FeedView
          politicians={politicians}
          factChecks={factChecks}
          races={races}
          guide={guide}
          stance={stance}
          votes={votes}
          bills={bills}
          electionUpdates={electionUpdates}
          articles={articles}
        />
      </Suspense>
    </AppShell>
  );
}
