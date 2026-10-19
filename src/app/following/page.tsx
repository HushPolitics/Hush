import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import FollowingView from "@/components/views/FollowingView";
import { listPoliticians } from "@/lib/repo";

/**
 * Records change between deploys, so this page is rebuilt in the background
 * at most every five minutes rather than frozen at whatever the database
 * held when the deploy ran.
 */
export const revalidate = 300;


export const metadata: Metadata = { title: "Following" };

export default async function FollowingPage() {
  const politicians = await listPoliticians();

  return (
    <AppShell>
      <FollowingView politicians={politicians} />
    </AppShell>
  );
}
