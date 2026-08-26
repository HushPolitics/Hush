import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import CompareView from "@/components/views/CompareView";
import { listPoliticians, listRaces, stanceGrid } from "@/lib/repo";

export const metadata: Metadata = { title: "Compare" };

export default function ComparePage() {
  return (
    <AppShell kicker="Compare" title="Vote compare & side-by-side">
      <CompareView
        politicians={listPoliticians()}
        races={listRaces()}
        stances={stanceGrid()}
      />
    </AppShell>
  );
}
