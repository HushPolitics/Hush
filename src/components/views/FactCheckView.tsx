"use client";

import Link from "next/link";
import { C, VERDICT_STYLE } from "@/lib/theme";
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
            fontWeight: 600,
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

      {/*
        Signature device (brand-tokens-v2 Phase 4, guideline Section 06):
        "Redact & Highlight" -- the claim reads as struck-down, the finding
        underneath as the sourced record. Only for Misleading/False: a True
        verdict has nothing to redact, striking it through would visually
        claim it was debunked when it wasn't. The guideline's own demo sets
        the claim's text color equal to its background for a true redaction
        (on-brand for a static marketing graphic) -- this card exists to
        show people exactly what was claimed, so the in-app version keeps
        the claim legible with a strikethrough instead. Not using
        IBM Plex Mono here despite the guideline's demo: that font is scoped
        to sourcing/citations only, and a claim or finding is substantive
        content, not a citation string.
      */}
      {check.verdict === "Misleading" || check.verdict === "False" ? (
        <>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, textWrap: "pretty" }}>
            <span
              style={{
                textDecoration: "line-through",
                textDecorationThickness: 2,
                textDecorationColor: C.ink,
                color: C.muted,
              }}
            >
              “{check.claim}”
            </span>
          </p>
          <span
            style={{
              display: "inline-block",
              width: "fit-content",
              background: C.rust,
              color: C.ink,
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: 2,
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {check.finding}
          </span>
        </>
      ) : (
        <>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, textWrap: "pretty" }}>
            “{check.claim}”
          </p>
          <span style={{ fontSize: 12, color: C.body, lineHeight: 1.5 }}>{check.finding}</span>
        </>
      )}

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
