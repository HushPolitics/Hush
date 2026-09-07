import type { Metadata } from "next";
import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import TopIssuesQuizView from "@/components/views/TopIssuesQuizView";
import { topicPool, topIssuesQuiz } from "@/lib/repo";

export const metadata: Metadata = { title: "My Top Issues Quiz" };

/**
 * The quiz's own route, nested under /profile/top-issues rather than a new
 * top-level nav tab. Reached from the avatar menu's "My issues" item, and
 * also from HUSH Guide's onboarding gate (see GuideView) when a visitor with
 * no ranked issues tries to open the Guide — that visit carries `?next=` so
 * TopIssuesQuizView can send them back to where they started once they're
 * done. See TopIssuesQuizView. Wrapped in Suspense because that view reads
 * `next` via useSearchParams, same reason FeedView's page does.
 */
export default function TopIssuesQuizPage() {
  return (
    <AppShell kicker="My issues" title="Find your top issues with a quiz">
      <Suspense fallback={null}>
        <TopIssuesQuizView topicPool={topicPool()} quizBank={topIssuesQuiz()} />
      </Suspense>
    </AppShell>
  );
}
