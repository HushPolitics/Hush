"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { C, cond } from "@/lib/theme";
import { shortPhrase } from "@/lib/guide";
import type { Bill } from "@/lib/types";
import { Card, Display, EmptyState, Kicker } from "@/components/ui";

/**
 * "Bills Being Considered" — sits at the bottom of /hush-guide, below the
 * race tile grid. Bill data is seed/placeholder only (see BILLS in
 * seed-data.ts): no Congress.gov / state-legislature / municipal
 * integration exists yet, and neither does the address-to-district lookup
 * that would eventually filter this list to bills relevant to the user's
 * own district — every bill in the seed set is shown to every user.
 */
export function BillsSection({ bills }: { bills: Bill[] }) {
  return (
    <section id="bills" style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Kicker>Bills Being Considered</Kicker>
        <Display size={22}>Understand what your elected officials are voting on</Display>
      </div>

      <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ margin: 0, fontSize: 12.5, color: C.body, lineHeight: 1.6 }}>
          HUSH translates complex legislative language into plain English to help you understand
          what a bill would do. These explanations are paraphrased by HUSH and are not the
          official language of the bill. Always review the original bill and source before making
          a decision.
        </p>
        <p style={{ margin: 0, fontSize: 12.5, color: C.ink, lineHeight: 1.6, fontWeight: 600 }}>
          HUSH doesn&apos;t tell you how to vote. We explain what the legislation says so you can
          decide for yourself.
        </p>
      </Card>

      {bills.length === 0 ? (
        <EmptyState>No bills in Hush&apos;s seed dataset yet.</EmptyState>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
            gap: 16,
          }}
        >
          {bills.map((bill) => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Shortens a bill's full `chamber` string to what fits a small pill badge --
 * federal bills keep which body ("U.S. House", "U.S. Senate", since that
 * distinction matters for a federal bill's identity), while state and local
 * chambers collapse to just the jurisdiction name ("Florida", "Jacksonville")
 * since which body handles it is already visible in the bill number below.
 * Presentation-only -- `bill.chamber` itself is untouched.
 */
function chamberPillLabel(chamber: string): string {
  if (chamber === "U.S. House of Representatives") return "U.S. House";
  if (chamber === "U.S. Senate") return "U.S. Senate";
  return chamber.split(" ")[0];
}

/**
 * Jurisdiction tag is always this same faded-blue treatment now -- rust is
 * reserved for the CTA only, not for telling federal and state/local bills
 * apart. (Previously `chamberAccent()` gave federal bills the rust accent
 * and state/local bills slate; that split is gone.)
 */
const JURISDICTION_ACCENT = { fg: C.navy, bg: C.slateFill };

function ChamberPill({ children, accent }: { children: ReactNode; accent: { fg: string; bg: string } }) {
  return (
    <span
      style={{
        fontFamily: cond,
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        color: accent.fg,
        background: accent.bg,
        borderRadius: 4,
        padding: "3px 8px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function BillCard({ bill }: { bill: Bill }) {
  const [flipped, setFlipped] = useState(false);
  // HUSH's own plain-English paraphrase, trimmed for the card front.
  // bill.description is only "official-ish" per its own doc comment in
  // lib/types.ts -- the guaranteed plain-English text is `explanation`.
  // Falls back to `description` for the rare bill with no `explanation`
  // (e.g. one flagged `explainerTooComplex`), so nothing breaks either way.
  const shortDescription = bill.explanation ? shortPhrase(bill.explanation, 140) : bill.description;

  function flip() {
    setFlipped((f) => !f);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      flip();
    }
  }

  return (
    <div className="flip-card">
      <div className={`flip-card-inner${flipped ? " is-flipped" : ""}`}>
        <Card
          className="flip-card-face card-hover lift"
          role="button"
          tabIndex={0}
          aria-label={`${bill.number}: ${bill.title}. Tap to see HUSH's plain-English explanation.`}
          onClick={flip}
          onKeyDown={onKeyDown}
          style={{
            padding: 14,
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ChamberPill accent={JURISDICTION_ACCENT}>{chamberPillLabel(bill.chamber)}</ChamberPill>
            <span style={{ fontSize: 12, color: C.muted }}>{bill.number}</span>
          </div>
          <span style={{ fontFamily: cond, fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>{bill.title}</span>

          {shortDescription ? (
            <p style={{ margin: 0, fontSize: 12.5, color: C.body, lineHeight: 1.45 }}>{shortDescription}</p>
          ) : null}

          <div
            style={{
              marginTop: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              paddingTop: 8,
              borderTop: `1px solid ${C.lineSoft}`,
            }}
          >
            {bill.voteDate || bill.voteStage ? (
              <span style={{ fontSize: 12, color: C.muted }}>
                {bill.voteDate ? `Vote: ${bill.voteDate}` : "Status"}
                {bill.voteStage ? ` · ${bill.voteStage}` : ""}
              </span>
            ) : null}
            <span
              style={{
                fontFamily: cond,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: C.rust,
              }}
            >
              Understand this bill →
            </span>
          </div>
        </Card>

        <Card
          className="flip-card-face flip-card-back"
          role="button"
          tabIndex={0}
          aria-label={`Back to ${bill.number} summary`}
          onClick={flip}
          onKeyDown={onKeyDown}
          style={{
            padding: 18,
            borderRadius: 12,
            borderTop: `3px solid ${JURISDICTION_ACCENT.fg}`,
            boxShadow: "0 1px 4px rgba(20,17,12,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              fontFamily: cond,
              fontSize: 12,
              letterSpacing: "0.04em",
              color: C.navy,
            }}
          >
            ← Tap to flip back
          </span>

          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Kicker>HUSH&apos;s paraphrase</Kicker>
            <span style={{ fontFamily: cond, fontSize: 15, lineHeight: 1.2 }}>
              What does this bill do?
            </span>
            <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
              Not the bill&apos;s official language — see the source below.
            </span>
          </div>

          {bill.explainerTooComplex ? (
            <p style={{ margin: 0, fontSize: 13, color: C.body, lineHeight: 1.5, fontStyle: "italic" }}>
              This bill is dense and heavily amended enough that HUSH can&apos;t confidently
              simplify it without risking losing important detail. Read the original bill below
              rather than relying on a HUSH summary for this one.
            </p>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 13, color: C.body, lineHeight: 1.5 }}>
                {bill.explanation}
              </p>

              {bill.yesMeans ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontFamily: cond, fontSize: 13, color: C.navy }}>
                    A YES vote would:
                  </span>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 3 }}>
                    {bill.yesMeans.map((m, i) => (
                      <li key={i} style={{ fontSize: 12.5, color: C.body, lineHeight: 1.5 }}>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {bill.noMeans ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontFamily: cond, fontSize: 13, color: C.rust }}>
                    A NO vote would:
                  </span>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 3 }}>
                    {bill.noMeans.map((m, i) => (
                      <li key={i} style={{ fontSize: 12.5, color: C.body, lineHeight: 1.5 }}>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}

          <div
            style={{
              marginTop: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              paddingTop: 10,
              borderTop: `1px solid ${C.lineSoft}`,
            }}
          >
            <span style={{ fontSize: 12, color: C.ink }}>
              {bill.number} — {bill.title}
            </span>
            <span style={{ fontSize: 11, color: C.muted }}>
              {bill.sourceName} · accessed {bill.dateAccessed}
              {bill.dateUpdated ? ` · updated ${bill.dateUpdated}` : ""}
            </span>
            <a
              href={bill.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 12, color: C.navy, marginTop: 2 }}
            >
              View Original Bill →
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
