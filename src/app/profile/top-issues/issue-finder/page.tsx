import type { Metadata } from "next";
import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import IssueFinderView from "@/components/views/IssueFinderView";
import { issueFinderBank, topicPool } from "@/lib/repo";

export const metadata: Metadata = { title: "Issue Finder" };

/**
 * Issue Finder's own route (formerly /profile/top-issues/quiz — see the
 * rename in IssueFinderView's doc comment). Reached from the two-path
 * onboarding chooser (`/profile/top-issues/start`, with `?depth=` to skip
 * straight into a sitting), the avatar menu's "My issues" page, and HUSH
 * Guide's "Your issues" section. Wrapped in Suspense because that view
 * reads `next`/`depth` via useSearchParams, same reason FeedView's page
 * does.
 */
export default function IssueFinderPage() {
  return (
    <AppShell kicker="My issues" title="Find your top issues">
      <Suspense fallback={null}>
        <IssueFinderView topicPool={topicPool()} finderBank={issueFinderBank()} />
      </Suspense>
    </AppShell>
  );
}
