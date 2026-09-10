"use client";

import { useRouter } from "next/navigation";
import { C, cond } from "@/lib/theme";
import { Card, Display, Kicker, RustButton } from "@/components/ui";

/**
 * The two-path chooser HUSH Guide's onboarding now routes a first-time
 * visitor to (instead of dropping straight into the drag-to-rank list) —
 * see the sidebar brief's Part 2.3. Two equal, unranked options on one
 * screen: rank issues by hand (the existing TopIssuesCard editor, reached
 * as a normal live page so nothing here needs to duplicate it), or answer
 * a few questions (Issue Finder — its own depth-pick screen, reached as a
 * normal live page so nothing here needs to duplicate that either). Neither
 * is presented as the recommended or default choice — same-size cards, same
 * visual weight, side by side, each just a title, a line of body copy, and
 * a rust button at the bottom.
 *
 * Also the general-purpose entry point Issue Finder is reachable from
 * afterward (Guide's "Your issues" section, the avatar menu's "My issues")
 * — the same screen serves both onboarding and a later re-run; Issue
 * Finder's own results step is what gates a re-run behind a confirmation,
 * not this screen.
 */
export default function IssueOnboardingView({ next }: { topicPool: string[]; next?: string }) {
  const router = useRouter();
  const rankHref = next ? `/profile/top-issues?next=${encodeURIComponent(next)}` : "/profile/top-issues";
  const findHref = next
    ? `/profile/top-issues/issue-finder?next=${encodeURIComponent(next)}`
    : "/profile/top-issues/issue-finder";

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
          <RustButton onClick={() => router.push(rankHref)} style={{ marginTop: "auto", alignSelf: "flex-start" }}>
            Start ranking →
          </RustButton>
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
          <RustButton onClick={() => router.push(findHref)} style={{ marginTop: "auto", alignSelf: "flex-start" }}>
            Take the quiz →
          </RustButton>
        </Card>
      </div>
    </div>
  );
}
