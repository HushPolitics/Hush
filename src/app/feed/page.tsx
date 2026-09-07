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

export const metadata: Metadata = { title: "Feed" };

export default function FeedPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <FeedView
          politicians={listPoliticians()}
          factChecks={listFactChecks()}
          races={listRaces()}
          guide={guidePositions()}
          stance={stancePositions()}
          votes={listVotes()}
          bills={listBills()}
          electionUpdates={listElectionUpdates()}
          articles={listArticles()}
        />
      </Suspense>
    </AppShell>
  );
}
