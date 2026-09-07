import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import StanceCheckView from "@/components/views/StanceCheckView";
import { listFactChecks, listPoliticians, listRaces, stancePositions, stanceStatements, topicPool } from "@/lib/repo";

export const metadata: Metadata = { title: "Stance Check" };

export default function StanceCheckPage() {
  return (
    <AppShell>
      <StanceCheckView
        politicians={listPoliticians()}
        races={listRaces()}
        topicPool={topicPool()}
        statements={stanceStatements()}
        positions={stancePositions()}
        checks={listFactChecks()}
      />
    </AppShell>
  );
}
