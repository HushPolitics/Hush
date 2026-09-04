import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import TopIssuesQuizView from "@/components/views/TopIssuesQuizView";
import { topicPool, topIssuesQuiz } from "@/lib/repo";

export const metadata: Metadata = { title: "My Top Issues Quiz" };

/**
 * The quiz's own route, nested under /profile/top-issues rather than a new
 * top-level nav tab — Profile's hero "My Top Issues" button links here now
 * (the button used to link straight to /profile/top-issues; that page is
 * still reachable, via the quiz's own "Skip the quiz" link). See
 * TopIssuesQuizView.
 */
export default function TopIssuesQuizPage() {
  return (
    <AppShell kicker="Profile" title="Find your top issues with a quiz">
      <TopIssuesQuizView topicPool={topicPool()} quizBank={topIssuesQuiz()} />
    </AppShell>
  );
}
