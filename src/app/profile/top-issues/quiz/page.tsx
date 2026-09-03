import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import TopIssuesQuizView from "@/components/views/TopIssuesQuizView";
import { topicPool, topIssuesQuiz } from "@/lib/repo";

export const metadata: Metadata = { title: "My Top Issues Quiz" };

/**
 * The quiz's own route, nested under /profile/top-issues rather than a new
 * top-level nav tab — Profile's hero links here ("Take the Issues Quiz"),
 * same as it links to /profile/top-issues itself. See TopIssuesQuizView.
 */
export default function TopIssuesQuizPage() {
  return (
    <AppShell kicker="Profile" title="Find your top issues with a quiz">
      <TopIssuesQuizView topicPool={topicPool()} quizBank={topIssuesQuiz()} />
    </AppShell>
  );
}
