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
  // Only candidates with an FEC id can have a funding picture. Skipping the rest
  // avoids one database lookup per local candidate, which made this page take
  // longer than the 60s build limit.
  const funding = await Promise.all(
    politicians.map((p) => (p.fecCandidateId ? getFundingSummary(p.id) : Promise.resolve(null))),
  );
  const fundingById = Object.fromEntries(politicians.map((p, i) => [p.id, funding[i]]));

  return (
    <AppShell>
      <FollowTheMoneyView politicians={politicians} fundingById={fundingById} />
    </AppShell>
  );
}
