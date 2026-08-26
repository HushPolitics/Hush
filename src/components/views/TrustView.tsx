"use client";

import { useState } from "react";
import { C, STATUS_STYLE, cond, progressColor, trustBand } from "@/lib/theme";
import { TRUST_WEIGHTS } from "@/lib/scoring";
import type { Politician, PromiseStatus } from "@/lib/types";
import { Chip, Kicker, Pill } from "@/components/ui";

const FILTERS: (PromiseStatus | "All")[] = ["All", "Delivered", "In progress", "No movement"];
const LEDGER_GRID = "1fr 168px 96px 132px";

export default function TrustView({ politician: p }: { politician: Politician }) {
  const [status, setStatus] = useState<PromiseStatus | "All">("All");
  const rows = p.promises.filter((x) => status === "All" || x.status === status);
  const flagship = p.promises[0];
  const flagshipStyle = flagship ? STATUS_STYLE[flagship.status] : null;

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Score header */}
      <section
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "16px 22px",
          borderRadius: 12,
          background: C.ink,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: cond, fontSize: 40, lineHeight: 1, color: C.sand }}>
            {p.trust}
          </span>
          <span style={{ fontSize: 12, color: C.tan }}>Trust score · {p.name}</span>
        </div>
        <span style={{ height: 30, width: 1, background: "rgba(243,239,228,0.2)" }} />
        <span style={{ fontSize: 12, color: C.tan, maxWidth: 420, lineHeight: 1.5 }}>
          Weighted {Math.round(TRUST_WEIGHTS.kept * 100)}% promises delivered ·{" "}
          {Math.round(TRUST_WEIGHTS.recency * 100)}% recency ·{" "}
          {Math.round(TRUST_WEIGHTS.significance * 100)}% promise significance.
        </span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 7, flexWrap: "wrap" }}>
          <Pill bg="rgba(37,55,70,0.9)" fg={C.sand} style={{ padding: "6px 12px" }}>
            Delivered {p.kept}
          </Pill>
          <Pill bg={C.tan} fg={C.ink} style={{ padding: "6px 12px" }}>
            In progress {p.prog}
          </Pill>
          <Pill bg={C.rust} fg={C.sand} style={{ padding: "6px 12px" }}>
            No movement {p.broken}
          </Pill>
        </span>
      </section>

      {/* Flagship promise timeline */}
      {flagship && flagshipStyle ? (
        <section
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
            <span style={{ fontFamily: cond, fontSize: 19 }}>“{flagship.text}”</span>
            <Pill
              bg={flagshipStyle.bg}
              fg={flagshipStyle.fg}
              style={{ marginLeft: "auto" }}
            >
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
                  <span
                    style={{ width: 12, height: 12, borderRadius: "50%", background: t.dot, flex: "0 0 12px" }}
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
        </section>
      ) : null}

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Ledger */}
        <div
          style={{
            flex: 1,
            minWidth: 460,
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
            {FILTERS.map((f) => (
              <Chip key={f} on={status === f} onClick={() => setStatus(f)}>
                {f}
              </Chip>
            ))}
          </div>

          <div
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
            <span>Promise</span>
            <span>Progress</span>
            <span>Date</span>
            <span>Sources</span>
          </div>

          {rows.map((row) => {
            const s = STATUS_STYLE[row.status];
            const fill = progressColor(row.progress);
            return (
              <div
                key={row.id}
                className="row-hover"
                style={{
                  display: "grid",
                  gridTemplateColumns: LEDGER_GRID,
                  gap: 12,
                  padding: "12px 18px",
                  alignItems: "center",
                  borderBottom: `1px solid ${C.lineSoft}`,
                }}
              >
                <span style={{ fontSize: 13, lineHeight: 1.4 }}>{row.text}</span>

                {/* Bar plus percentage, with the status as its caption. The two
                    can never disagree: the seed data and the database check
                    constraint both pin Delivered to 100 and No movement to 0. */}
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

          {rows.length === 0 ? (
            <div style={{ padding: "22px 18px", fontSize: 13, color: C.muted }}>
              No promises with this status.
            </div>
          ) : null}
        </div>

        {/* Trust by term */}
        <div
          style={{
            width: 310,
            flex: "0 0 310px",
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
              const color = trustBand(t.score).color;
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
                  <span
                    style={{ fontSize: 11, color: C.muted, textAlign: "center", lineHeight: 1.3 }}
                  >
                    {t.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
