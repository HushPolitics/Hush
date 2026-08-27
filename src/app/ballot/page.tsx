import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import BallotView from "@/components/views/BallotView";
import { listBallot } from "@/lib/repo";

export const metadata: Metadata = { title: "Voter's Guide" };

export default function BallotPage() {
  return (
    <AppShell kicker="Voter's Guide" title="General election · Nov 3, 2026">
      <BallotView ballot={listBallot()} />
    </AppShell>
  );
}
