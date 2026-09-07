import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { TopIssuesCard } from "@/components/views/TopIssuesCard";
import { topicPool } from "@/lib/repo";
import { C } from "@/lib/theme";

export const metadata: Metadata = { title: "My Top Issues" };

/**
 * The full-page destination for the avatar menu's "My issues" item, the
 * quiz's results-step Save (see TopIssuesQuizView), and the quiz's "Skip
 * the quiz — rank your own issues" link for anyone who'd rather not answer
 * questions. Same editor everywhere — see TopIssuesCard — just given the
 * whole page to itself here.
 *
 * `?next=` carries through from HUSH Guide's onboarding gate (an empty
 * `topics` list redirects here, via the quiz, with `?next=/hush-guide`) so
 * the bottom link can send a first-time visitor straight on to the Guide
 * instead of a generic "done" link back to a Profile page that no longer
 * exists.
 */
export default async function TopIssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AppShell kicker="My issues" title="Rank what matters most to you">
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
        <TopIssuesCard topicPool={topicPool()} showEditLink={false} />
        <Link href={next ?? "/feed"} style={{ fontSize: 13, color: C.navy, textDecoration: "underline" }}>
          {next ? "Continue →" : "Back to Feed"}
        </Link>
      </div>
    </AppShell>
  );
}
