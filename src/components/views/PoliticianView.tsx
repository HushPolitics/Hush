"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { C, PARTY_LABEL, STATUS_STYLE, cond, progressColor, trustBand } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { TRUST_WEIGHTS, promiseSplit } from "@/lib/scoring";
import { useRegisterSectionNav } from "@/lib/sectionNav";
import type { FactCheck, IssuePosition, Politician, PromiseStatus } from "@/lib/types";
import { Card, Chip, EmptyState, GhostButton, InkButton, Kicker, Pill } from "@/components/ui";
import { HushScoreInfoIcon } from "@/components/HushScoreInfo";
import { FactCheckCard } from "./FactCheckView";

const LEDGER_FILTERS: (PromiseStatus | "All")[] = ["All", "Delivered", "In progress", "No movement"];
const LEDGER_GRID = "1fr 168px 96px 132px";

/**
 * The canonical politician page — five sections in a fixed order (per the
 * app IA restructure brief, phase 2), plus two supplementary sections kept
 * from the old standalone `/politician/[id]/trust` page rather than dropped:
 *
 *   1. Header (identity rail, left)
 *   2. The score, with its breakdown
 *   3. Promise ledger (every tracked promise — this used to live on its own
 *      page at /politician/[id]/trust; that route now redirects here, see
 *      next.config.ts)
 *   4. Positions on the user's ranked issues (sourced from GUIDE_POSITIONS —
 *      the same store HUSH Guide uses, per the reuse decision for this phase)
 *   5. Claims checked (FactCheckCard, filtered to this person)
 *   6. Score history (flagship promise + trust-by-term) and 7. Career
 *      timeline — not named in the brief's 5-section spec, kept rather than
 *      cut, per the explicit call to keep everything from the old /trust and
 *      bio-tab content as extra sections rather than lose it.
 *
 * Linked from Feed rows, Guide race cards, Compare columns, and Stance
 * Check's reveal rows — all four already point here.
 */
export default function PoliticianView({
  politician: p,
  checks,
  positions,
}: {
  politician: Politician;
  checks: FactCheck[];
  /** This politician's sourced Guide positions, keyed by issue name. */
  positions: Record<string, IssuePosition>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { saved, toggleSaved, picks, setPicks, topics } = usePrefs();
  const [ledgerStatus, setLedgerStatus] = useState<PromiseStatus | "All">("All");

  // Fixed list, matching the brief's section order -- the two supplementary
  // sections below (Score history, Career) aren't part of it, same as they
  // aren't one of the 5 named sections in the original app IA restructure.
  useRegisterSectionNav([
    { id: "score", label: "The record" },
    { id: "ledger", label: "Promises" },
    { id: "positions", label: "Positions" },
    { id: "claims-checked", label: "Claims checked" },
  ]);

  const scoreColor = trustBand(p.trust);
  const split = promiseSplit(p);
  const isSaved = saved.includes(p.id);
  const ledgerRows = p.promises.filter((x) => ledgerStatus === "All" || x.status === ledgerStatus);
  const flagship = p.promises[0];
  const flagshipStyle = flagship ? STATUS_STYLE[flagship.status] : null;

  function compareWith() {
    setPicks([p.id, ...picks.filter((x) => x !== p.id)].slice(0, 3));
    router.push("/compare");
  }

  return (
    <div className="split" style={{ display: "flex", minHeight: "100%" }}>
      {/* 1. Header / identity rail */}
      <div
        style={{
          width: 348,
          flex: "0 0 348px",
          borderRight: `1px solid ${C.line}`,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          background: C.sandDeep,
        }}
      >
        <div
          style={{
            height: 200,
            borderRadius: 10,
            background: C.tan,
            display: "flex",
            alignItems: "flex-end",
            padding: 14,
          }}
        >
          <span
            style={{
              fontFamily: cond,
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              background: C.sand,
              padding: "4px 8px",
              borderRadius: 4,
            }}
          >
            Official portrait
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: cond, fontSize: 28, lineHeight: 1.05 }}>{p.name}</span>
          <span style={{ fontSize: 13, color: C.body }}>
            {p.office}, {p.district} · {PARTY_LABEL[p.party]}
          </span>
          <span style={{ fontSize: 13, color: C.muted }}>
            In office since {p.since} · next election Nov 3, 2026
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {p.tags.map((t) => (
            <span
              key={t}
              style={{
                padding: "5px 10px",
                borderRadius: 16,
                background: C.shell,
                fontSize: 12,
                color: C.body,
                whiteSpace: "nowrap",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.body, textWrap: "pretty" }}>
          {p.bio}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
          <InkButton type="button" onClick={() => toggleSaved(p.id)}>
            {isSaved ? "Remove from my list" : "Save to my list"}
          </InkButton>
          <GhostButton onClick={compareWith}>Compare with…</GhostButton>
        </div>
      </div>

      {/* Sections 2-7 */}
      <div
        style={{
          flex: 1,
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          minWidth: 0,
        }}
      >
        {/* 2. The score, with its breakdown */}
        <section id="score" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="stack-row" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Card
              style={{
                flex: "0 0 210px",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Kicker>HUSH. Score</Kicker>
                <HushScoreInfoIcon politicianId={p.id} />
              </span>
              <span style={{ fontFamily: cond, fontSize: 56, lineHeight: 1, color: scoreColor }}>
                {p.trust}
              </span>
              <span style={{ fontSize: 12, color: C.muted }}>{split.total} promises tracked</span>
            </Card>

            <Card
              style={{
                flex: 1,
                minWidth: 300,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontFamily: cond, fontSize: 18 }}>Promise breakdown</span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>
                  Weighted {Math.round(TRUST_WEIGHTS.kept * 100)}% delivered ·{" "}
                  {Math.round(TRUST_WEIGHTS.recency * 100)}% recency ·{" "}
                  {Math.round(TRUST_WEIGHTS.significance * 100)}% significance
                </span>
              </div>

              {/*
                Three distinguishable neutral shades, not one flat color --
                unlike STATUS_STYLE's per-row treatment, this is a stacked
                proportion bar, and a stacked bar with all-identical segments
                is illegible (no visible boundary between them). Dark-to-
                light (ink/body/faint) reads as three plain categories with
                no good/bad association, the same way a legend would.
              */}
              <div
                style={{
                  display: "flex",
                  height: 12,
                  borderRadius: 6,
                  overflow: "hidden",
                  background: C.shell,
                }}
              >
                <span style={{ width: `${split.keptPct}%`, background: C.ink }} />
                <span style={{ width: `${split.progPct}%`, background: C.body }} />
                <span style={{ width: `${split.brokenPct}%`, background: C.faint }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { label: "Delivered", value: p.kept, color: C.ink },
                  { label: "In progress", value: p.prog, color: C.body },
                  { label: "No movement", value: p.broken, color: C.faint },
                ].map((s) => (
                  <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: C.muted,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                      {s.label}
                    </span>
                    <span style={{ fontFamily: cond, fontSize: 26 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* 3. Promise ledger */}
        <section id="ledger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              background: C.white,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 18px",
                borderBottom: `1px solid ${C.line}`,
                background: C.sand,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontFamily: cond, fontSize: 17, marginRight: 6 }}>Promise ledger</span>
              {LEDGER_FILTERS.map((f) => (
                <Chip key={f} on={ledgerStatus === f} onClick={() => setLedgerStatus(f)}>
                  {f}
                </Chip>
              ))}
            </div>

            <div
              className="stack-grid-head"
              style={{
                display: "grid",
                gridTemplateColumns: LEDGER_GRID,
                gap: 12,
                padding: "10px 18px",
                borderBottom: "1px solid rgba(21,21,21,0.1)",
                fontFamily: cond,
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: C.muted,
              }}
            >
              <span>What they said</span>
              <span>Progress</span>
              <span>Checked</span>
              <span>Evidence</span>
            </div>

            {ledgerRows.map((row) => {
              const s = STATUS_STYLE[row.status];
              const fill = progressColor(row.progress);
              return (
                <div
                  key={row.id}
                  className="row-hover stack-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: LEDGER_GRID,
                    gap: 12,
                    padding: "12px 18px",
                    alignItems: "center",
                    borderBottom: `1px solid ${C.lineSoft}`,
                  }}
                >
                  <span style={{ fontSize: 13, lineHeight: 1.4 }}>&ldquo;{row.text}&rdquo;</span>

                  <span
                    style={{ display: "flex", flexDirection: "column", gap: 5 }}
                    role="img"
                    aria-label={`${row.progress}% complete — ${row.status}`}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          background: C.shell,
                          display: "block",
                          overflow: "hidden",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            height: 6,
                            borderRadius: 3,
                            width: `${row.progress}%`,
                            background: fill,
                          }}
                        />
                      </span>
                      <span
                        style={{
                          fontFamily: cond,
                          fontSize: 15,
                          color: fill,
                          width: 34,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {row.progress}%
                      </span>
                    </span>
                    <span style={{ fontSize: 11, color: s.fg }}>{row.status}</span>
                  </span>

                  <span style={{ fontSize: 12, color: C.muted }}>{row.date}</span>
                  <span style={{ display: "flex", gap: 8, fontSize: 12, flexWrap: "wrap" }}>
                    {row.sources.map((src) => (
                      <span key={src} style={{ color: C.rust }}>
                        {src}
                      </span>
                    ))}
                  </span>
                </div>
              );
            })}

            {ledgerRows.length === 0 ? (
              <div style={{ padding: "22px 18px", fontSize: 13, color: C.muted }}>
                No promises with this status.
              </div>
            ) : null}
          </div>
        </section>

        {/* 4. Positions on the user's ranked issues */}
        <section id="positions" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Kicker>Positions</Kicker>
            <span style={{ fontFamily: cond, fontSize: 18 }}>On the issues you ranked</span>
          </div>

          {topics.length === 0 ? (
            <EmptyState>
              You haven&apos;t ranked any issues yet.{" "}
              <Link href={`/profile/top-issues/start?next=${encodeURIComponent(pathname)}`} style={{ color: C.navy }}>
                Pick your top issues
              </Link>{" "}
              to see {p.name.split(" ").slice(-1)[0]}&apos;s positions on what matters to you.
            </EmptyState>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topics.map((issue) => {
                const pos = positions[issue];
                return (
                  <div
                    key={issue}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px 1fr",
                      gap: 16,
                      padding: "14px 16px",
                      border: `1px solid ${C.line}`,
                      borderRadius: 10,
                      background: C.white,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: cond,
                        fontSize: 15,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      {issue}
                    </span>
                    {pos ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <p style={{ margin: 0, fontSize: 13, color: C.body, lineHeight: 1.5, fontStyle: "italic" }}>
                          &ldquo;{pos.excerpt}&rdquo;
                        </p>
                        <span style={{ fontSize: 11, color: C.muted }}>
                          {pos.sourceTitle} · {pos.sourceType}
                          {pos.date ? ` · ${pos.date}` : ""}
                        </span>
                        <a
                          href={pos.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 12, color: C.navy, width: "fit-content" }}
                        >
                          View original source →
                        </a>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>
                        No position found
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 5. Claims checked */}
        <section id="claims-checked" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Kicker>Claims checked</Kicker>
            <span style={{ fontFamily: cond, fontSize: 18 }}>Fact-checks on {p.name}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {checks.map((c) => (
              <FactCheckCard key={c.id} check={c} showSources={false} />
            ))}
            {checks.length === 0 ? (
              <EmptyState>No fact-checks filed for this official yet.</EmptyState>
            ) : null}
          </div>
        </section>

        {/* 6. Score history — kept from the old standalone /trust page rather
            than dropped; not one of the brief's 5 named sections. */}
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Kicker>Score history</Kicker>
            <span style={{ fontFamily: cond, fontSize: 18 }}>How the record built up</span>
          </div>

          {flagship && flagshipStyle ? (
            <div
              style={{
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                background: C.white,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <Kicker>Flagship promise</Kicker>
                <span style={{ fontFamily: cond, fontSize: 19 }}>&ldquo;{flagship.text}&rdquo;</span>
                <Pill bg={flagshipStyle.bg} fg={flagshipStyle.fg} style={{ marginLeft: "auto" }}>
                  {flagship.status}
                </Pill>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", overflowX: "auto" }}>
                {p.timeline.map((t) => (
                  <div
                    key={t.date}
                    style={{ flex: 1, minWidth: 130, display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {/*
                        `t.dot` (see TimelineEvent in lib/types.ts) is seed
                        data documented as a verdict color -- navy for
                        progress, tan for slippage, rust for failure. Not
                        hand-editing seed-data.ts itself (generated fixture,
                        per the repo's own rule), but deliberately not
                        reading that field here anymore: the milestone label
                        text is what tells the reader what happened on this
                        date, not the color of its dot.
                      */}
                      <span
                        style={{ width: 12, height: 12, borderRadius: "50%", background: C.ink, flex: "0 0 12px" }}
                      />
                      <span style={{ flex: 1, height: 2, background: C.shell }} />
                    </div>
                    <Kicker size={13} color={C.muted} style={{ letterSpacing: "0.08em" }}>
                      {t.date}
                    </Kicker>
                    <span style={{ fontSize: 12, lineHeight: 1.45, paddingRight: 18, whiteSpace: "normal" }}>
                      {t.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div
            style={{
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              background: C.white,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <span style={{ fontFamily: cond, fontSize: 17 }}>Trust by term</span>
            <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>
              Score recalculated for each office held.
            </span>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 210 }}>
              {p.terms.map((t) => {
                const color = trustBand(t.score);
                return (
                  <div
                    key={t.label}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      justifyContent: "flex-end",
                      height: "100%",
                    }}
                  >
                    <span style={{ fontFamily: cond, fontSize: 17, color }}>{t.score}</span>
                    <span
                      style={{
                        width: "100%",
                        borderRadius: "5px 5px 0 0",
                        background: color,
                        height: Math.round(t.score * 1.4),
                      }}
                    />
                    <span style={{ fontSize: 11, color: C.muted, textAlign: "center", lineHeight: 1.3 }}>
                      {t.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7. Career timeline — kept from the old "Bio & timeline" tab. */}
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Kicker>Career</Kicker>
            <span style={{ fontFamily: cond, fontSize: 18 }}>Timeline</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", paddingLeft: 6 }}>
            {p.career.map((c, i) => (
              <div key={c.year} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    alignSelf: "stretch",
                    paddingTop: 4,
                  }}
                >
                  <span
                    style={{ width: 11, height: 11, borderRadius: "50%", background: C.navy, flex: "0 0 11px" }}
                  />
                  {i < p.career.length - 1 ? (
                    <span style={{ flex: 1, width: 2, background: C.shell }} />
                  ) : null}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingBottom: 20 }}>
                  <Kicker size={13} style={{ letterSpacing: "0.1em" }}>
                    {c.year}
                  </Kicker>
                  <span style={{ fontSize: 14 }}>{c.what}</span>
                  <span style={{ fontSize: 12, color: C.muted }}>{c.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
