"use client";

import { useState, type KeyboardEvent } from "react";
import { C, cond } from "@/lib/theme";
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
    <section style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Kicker>Legislation</Kicker>
        <Display size={25}>Bills Being Considered</Display>
        <span style={{ fontSize: 13, color: C.body }}>
          Understand what your elected officials are being asked to vote on.
        </span>
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

function BillCard({ bill }: { bill: Bill }) {
  const [flipped, setFlipped] = useState(false);

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
          className="flip-card-face card-hover"
          role="button"
          tabIndex={0}
          aria-label={`${bill.number}: ${bill.title}. Tap to see HUSH's plain-English explanation.`}
          onClick={flip}
          onKeyDown={onKeyDown}
          style={{
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontFamily: cond, fontSize: 13, color: C.rust, letterSpacing: "0.04em" }}>
              {bill.number}
            </span>
            <span style={{ fontFamily: cond, fontSize: 19, lineHeight: 1.2 }}>{bill.title}</span>
            <span style={{ fontSize: 12, color: C.muted }}>{bill.chamber}</span>
          </div>

          {bill.description ? (
            <p style={{ margin: 0, fontSize: 13, color: C.body, lineHeight: 1.5 }}>
              {bill.description}
            </p>
          ) : null}

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {bill.voteDate ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Upcoming vote
                </span>
                <span style={{ fontSize: 13, color: C.ink }}>
                  {bill.voteDate}
                  {bill.voteStage ? ` · ${bill.voteStage}` : ""}
                </span>
              </div>
            ) : null}
            <span
              style={{
                fontFamily: cond,
                fontSize: 13,
                letterSpacing: "0.04em",
                color: C.navy,
              }}
            >
              Tap to understand →
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
