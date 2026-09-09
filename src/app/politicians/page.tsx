import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import PoliticiansView from "@/components/views/PoliticiansView";
import { listPoliticians, listRaces } from "@/lib/repo";

export const metadata: Metadata = { title: "Politicians" };

export default function PoliticiansPage() {
  return (
    <AppShell>
      <PoliticiansView politicians={listPoliticians()} races={listRaces()} />
    </AppShell>
  );
}
