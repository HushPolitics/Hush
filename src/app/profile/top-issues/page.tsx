import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { TopIssuesCard } from "@/components/views/TopIssuesCard";
import { topicPool } from "@/lib/repo";
import { C } from "@/lib/theme";

export const metadata: Metadata = { title: "My Top Issues" };

/**
 * The full-page destination for the "Your Top Issues" card's "Edit Issues
 * →" link, the quiz's results-step Save (see TopIssuesQuizView), and the
 * quiz's "Skip the quiz — rank your own issues" link for anyone who'd
 * rather not answer questions. Same editor everywhere — see TopIssuesCard —
 * just given the whole page to itself here.
 */
export default function TopIssuesPage() {
  return (
    <AppShell kicker="Profile" title="Rank what matters most to you">
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
        <TopIssuesCard topicPool={topicPool()} showEditLink={false} />
        <Link href="/profile" style={{ fontSize: 13, color: C.navy, textDecoration: "underline" }}>
          Back to Profile
        </Link>
      </div>
    </AppShell>
  );
}
