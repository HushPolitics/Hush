import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import BallotView from "@/components/views/BallotView";
import { listBallot } from "@/lib/repo";

export const metadata: Metadata = { title: "Ballot" };

export default function BallotPage() {
  return (
    <AppShell kicker="Ballot" title="General election · Nov 3, 2026">
      <BallotView ballot={listBallot()} />
    </AppShell>
  );
}
