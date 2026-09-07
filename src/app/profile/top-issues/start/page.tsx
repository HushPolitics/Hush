import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import IssueOnboardingView from "@/components/views/IssueOnboardingView";
import { topicPool } from "@/lib/repo";

export const metadata: Metadata = { title: "Find your top issues" };

/**
 * The two-path chooser: HUSH Guide's onboarding routes a first-time visitor
 * with no ranked issues here (`?next=/hush-guide`) instead of straight into
 * the drag-to-rank list. Also reachable afterward from the avatar menu and
 * Guide's "Your issues" section for anyone who wants to redo their ranking
 * a different way. See IssueOnboardingView.
 */
export default async function IssueFinderStartPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AppShell>
      <IssueOnboardingView topicPool={topicPool()} next={next} />
    </AppShell>
  );
}
