import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import BallotView from "@/components/views/BallotView";
import { listPoliticians, listRaces } from "@/lib/repo";

export const metadata: Metadata = { title: "Your Ballot" };

export default function YourBallotPage() {
  return (
    <AppShell>
      <BallotView races={listRaces()} politicians={listPoliticians()} />
    </AppShell>
  );
}
