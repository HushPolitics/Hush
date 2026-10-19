import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import FollowTheMoneyView from "@/components/views/FollowTheMoneyView";
import { getFundingSummary, listPoliticians, listRaces } from "@/lib/repo";
import { ballotPoliticianIds } from "@/lib/feed";

/**
 * Records change between deploys, so this page is rebuilt in the background
 * at most every five minutes rather than frozen at whatever the database
 * held when the deploy ran.
 */
export const revalidate = 300;


export const metadata: Metadata = { title: "Follow the Money" };

export default async function FollowTheMoneyPage() {
  const [races, allPoliticians] = await Promise.all([listRaces(), listPoliticians()]);

  const ballotIds = ballotPoliticianIds(races);
  const politicians = allPoliticians.filter((p) => ballotIds.has(p.id));
  const funding = await Promise.all(politicians.map((p) => getFundingSummary(p.id)));
  const fundingById = Object.fromEntries(politicians.map((p, i) => [p.id, funding[i]]));

  return (
    <AppShell>
      <FollowTheMoneyView politicians={politicians} fundingById={fundingById} />
    </AppShell>
  );
}
