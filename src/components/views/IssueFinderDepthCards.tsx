"use client";

import { C, cond } from "@/lib/theme";
import { FINDER_DEPTHS, sittingTotal } from "@/lib/issue-finder";
import type { IssueFinderDepth } from "@/lib/types";
import { Card } from "@/components/ui";

const DEPTH_ORDER: IssueFinderDepth[] = ["quick", "standard", "thorough"];

/**
 * Quick/Standard/Thorough as a row of pickable cards, each showing its
 * question count so someone can pick the two-minute version. Shared between
 * Issue Finder's own depth-pick step (IssueFinderView, `step === "depth"`)
 * and the two-path onboarding chooser (IssueOnboardingView) — same choice,
 * same copy, two different call sites reached at two different points in
 * the flow.
 */
export function IssueFinderDepthCards({
  topicPool,
  onPick,
}: {
  topicPool: string[];
  onPick: (depth: IssueFinderDepth) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      {DEPTH_ORDER.map((depth) => {
        const cfg = FINDER_DEPTHS[depth];
        return (
          <Card
            key={depth}
            onClick={() => onPick(depth)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onPick(depth);
            }}
            aria-label={`${cfg.label} — ${sittingTotal(depth, topicPool)} questions`}
            style={{
              flex: "1 1 220px",
              minWidth: 200,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <span style={{ fontFamily: cond, fontSize: 21 }}>{cfg.label}</span>
            <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{cfg.blurb}</span>
            <span style={{ fontSize: 12, color: C.muted, marginTop: "auto" }}>
              {sittingTotal(depth, topicPool)} questions
            </span>
          </Card>
        );
      })}
    </div>
  );
}
