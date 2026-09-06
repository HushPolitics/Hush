"use client";

import Link from "next/link";
import { C, VERDICT_STYLE, cond } from "@/lib/theme";
import type { FactCheck } from "@/lib/types";
import { Kicker } from "@/components/ui";

/**
 * The fact-check card — claim, verdict, correction, sources. The standalone
 * `/fact-check` page this used to anchor is retired (app IA restructure
 * phase 3): its verdict-count filter chips were reading from a hardcoded
 * `VERDICT_COUNTS` constant that never matched the actual data, and its
 * "Most-checked claims" rail was a leaderboard of who got caught lying most,
 * which the brief calls engagement framing rather than something that
 * belongs in a nonpartisan tool. Neither is missed; this card is the part
 * that was "well built," so it's the part that stayed. It now renders in
 * three places instead of on its own page:
 *   1. The politician page, filtered to that person (its main home) — see
 *      PoliticianView's "Claims checked" section.
 *   2. Stance Check's reveal, attached to a candidate's quote when that
 *      exact quote has a published verdict — see StanceCheckView's
 *      CandidateCard.
 *   3. The Feed, as one of its event types (phase 4).
 */
export function FactCheckCard({
  check,
  who,
  href,
  showSources = true,
}: {
  check: FactCheck;
  who?: string;
  href?: string;
  showSources?: boolean;
}) {
  const v = VERDICT_STYLE[check.verdict];
  return (
    <article
      className="lift"
      style={{
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${v.fg}`,
        borderRadius: 10,
        background: C.white,
        padding: "15px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span
          style={{
            padding: "4px 11px",
            borderRadius: 14,
            fontFamily: cond,
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            background: v.bg,
            color: v.fg,
          }}
        >
          {check.verdict}
        </span>
        {who && href ? (
          <Link href={href} style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>
            {who}
          </Link>
        ) : null}
        <span style={{ fontSize: 12, color: C.muted }}>{check.topic}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>{check.date}</span>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, textWrap: "pretty" }}>
        “{check.claim}”
      </p>
      <span style={{ fontSize: 12, color: C.body, lineHeight: 1.5 }}>{check.finding}</span>

      {showSources ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Kicker color={C.muted} style={{ letterSpacing: "0.1em" }}>
            Sources
          </Kicker>
          {check.sources.map((s) => (
            <span key={s} style={{ fontSize: 12, color: C.rust }}>
              {s}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
