"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { C, cond } from "@/lib/theme";
import type { IssueFinderDepth } from "@/lib/types";
import { Card, Display, Kicker } from "@/components/ui";
import { IssueFinderDepthCards } from "./IssueFinderDepthCards";

/**
 * The two-path chooser HUSH Guide's onboarding now routes a first-time
 * visitor to (instead of dropping straight into the drag-to-rank list) —
 * see the sidebar brief's Part 2.3. Two equal, unranked options on one
 * screen: rank issues by hand (the existing TopIssuesCard editor, reached
 * as a normal live page so nothing here needs to duplicate it), or answer
 * a few questions (Issue Finder, depth chosen right here). Neither is
 * presented as the recommended or default choice — same-size cards, same
 * visual weight, side by side.
 *
 * Also the general-purpose entry point Issue Finder is reachable from
 * afterward (Guide's "Your issues" section, the avatar menu's "My issues")
 * — the same screen serves both onboarding and a later re-run; Issue
 * Finder's own results step is what gates a re-run behind a confirmation,
 * not this screen.
 */
export default function IssueOnboardingView({ topicPool, next }: { topicPool: string[]; next?: string }) {
  const router = useRouter();
  const rankHref = next ? `/profile/top-issues?next=${encodeURIComponent(next)}` : "/profile/top-issues";
  const findHrefBase = next
    ? `/profile/top-issues/issue-finder?next=${encodeURIComponent(next)}`
    : "/profile/top-issues/issue-finder";

  function startFinder(depth: IssueFinderDepth) {
    router.push(`${findHrefBase}&depth=${depth}`);
  }

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <Kicker>{next ? "Step 2 of 2 · HUSH Guide" : "My issues"}</Kicker>
        <Display size={25}>How do you want to find your top issues?</Display>
        <span style={{ fontSize: 13, color: C.body, maxWidth: 620, lineHeight: 1.5 }}>
          Either way you end up with the same ranked list — this is the one shared list that
          drives HUSH Guide, Stance Check, and the Feed. Pick whichever sounds faster.
        </span>
      </div>

      <div
        className="stack-row"
        style={{ display: "flex", gap: 16, alignItems: "stretch", flexWrap: "wrap", maxWidth: 700, margin: "0 auto" }}
      >
        <Card
          style={{
            flex: "1 1 320px",
            minWidth: 280,
            padding: 22,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: cond, fontSize: 21 }}>Rank your own issues</span>
            <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
              Drag the full list into the order that matters to you. Fastest if you already know
              what you care about.
            </span>
          </div>
          <Link
            href={rankHref}
            style={{
              marginTop: "auto",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "11px 18px",
              borderRadius: 8,
              border: `1px solid ${C.ink}`,
              fontFamily: cond,
              fontSize: 14,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: C.ink,
              textDecoration: "none",
            }}
          >
            Start ranking →
          </Link>
        </Card>

        <Card
          style={{
            flex: "1 1 320px",
            minWidth: 280,
            padding: 22,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: cond, fontSize: 21 }}>Need help picking?</span>
            <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
              Take our quiz on the nuanced issues and we&apos;ll tell you what we think your top
              issues are — you can still reorder or edit it before saving.
            </span>
          </div>
          <IssueFinderDepthCards topicPool={topicPool} onPick={startFinder} />
        </Card>
      </div>
    </div>
  );
}
