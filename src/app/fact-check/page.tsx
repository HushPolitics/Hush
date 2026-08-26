import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import FactCheckView from "@/components/views/FactCheckView";
import { listFactChecks, listPoliticians, listTrending } from "@/lib/repo";

export const metadata: Metadata = { title: "Fact check" };

export default function FactCheckPage() {
  return (
    <AppShell kicker="Fact check" title="Claims & verdicts">
      <FactCheckView
        checks={listFactChecks()}
        politicians={listPoliticians()}
        trending={listTrending()}
      />
    </AppShell>
  );
}
