import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import StanceCheckView from "@/components/views/StanceCheckView";
import { listPoliticians, listRaces, stancePositions, stanceStatements, topicPool } from "@/lib/repo";

export const metadata: Metadata = { title: "Stance Check" };

export default function StanceCheckPage() {
  return (
    <AppShell kicker="Stance Check" title="Where you stand, statement by statement">
      <StanceCheckView
        politicians={listPoliticians()}
        races={listRaces()}
        topicPool={topicPool()}
        statements={stanceStatements()}
        positions={stancePositions()}
      />
    </AppShell>
  );
}
