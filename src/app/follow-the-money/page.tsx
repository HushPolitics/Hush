import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import FollowTheMoneyView from "@/components/views/FollowTheMoneyView";
import { getFundingSummary, listPoliticians, listRaces } from "@/lib/repo";
import { ballotPoliticianIds } from "@/lib/feed";

export const metadata: Metadata = { title: "Follow the Money" };

export default async function FollowTheMoneyPage() {
  const races = listRaces();
  const ballotIds = ballotPoliticianIds(races);
  const politicians = listPoliticians().filter((p) => ballotIds.has(p.id));
  const funding = await Promise.all(politicians.map((p) => getFundingSummary(p.id)));
  const fundingById = Object.fromEntries(politicians.map((p, i) => [p.id, funding[i]]));

  return (
    <AppShell>
      <FollowTheMoneyView politicians={politicians} fundingById={fundingById} />
    </AppShell>
  );
}
