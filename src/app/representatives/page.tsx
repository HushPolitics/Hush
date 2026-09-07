import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import RepresentativesView from "@/components/views/RepresentativesView";
import { listPoliticians, listRaces } from "@/lib/repo";

export const metadata: Metadata = { title: "Your Representatives" };

export default function RepresentativesPage() {
  return (
    <AppShell>
      <RepresentativesView politicians={listPoliticians()} races={listRaces()} />
    </AppShell>
  );
}
