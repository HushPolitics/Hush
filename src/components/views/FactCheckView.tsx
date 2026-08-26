"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { C, VERDICT_STYLE, cond } from "@/lib/theme";
import { VERDICT_COUNTS } from "@/lib/seed-data";
import type { FactCheck, Politician, TrendingClaim, Verdict } from "@/lib/types";
import { Chip, Display, EmptyState, Kicker, SearchField } from "@/components/ui";

const FILTERS: (Verdict | "All")[] = ["All", "True", "Misleading", "False"];

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

export default function FactCheckView({
  checks,
  politicians,
  trending,
}: {
  checks: FactCheck[];
  politicians: Politician[];
  trending: TrendingClaim[];
}) {
  const [verdict, setVerdict] = useState<Verdict | "All">("All");
  const [q, setQ] = useState("");

  const nameById = useMemo(
    () => new Map(politicians.map((p) => [p.id, p.name])),
    [politicians],
  );

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return checks
      .filter((c) => verdict === "All" || c.verdict === verdict)
      .filter(
        (c) =>
          !needle ||
          `${nameById.get(c.politicianId) ?? ""} ${c.topic} ${c.claim}`
            .toLowerCase()
            .includes(needle),
      );
  }, [checks, verdict, q, nameById]);

  return (
    <div className="split" style={{ display: "flex", minHeight: "100%" }}>
      <div
        style={{
          flex: 1,
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <Chip
              key={f}
              on={verdict === f}
              onClick={() => setVerdict(f)}
              dot={f === "All" ? C.ink : VERDICT_STYLE[f].dot}
            >
              {(f === "All" ? "All verdicts" : f) + " · " + VERDICT_COUNTS[f]}
            </Chip>
          ))}
          <SearchField
            value={q}
            onChange={setQ}
            placeholder="Filter by politician or topic"
            style={{ marginLeft: "auto", width: 270 }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {visible.map((c) => (
            <FactCheckCard
              key={c.id}
              check={c}
              who={nameById.get(c.politicianId)}
              href={`/politician/${c.politicianId}`}
            />
          ))}
          {visible.length === 0 ? <EmptyState>No claims match this filter.</EmptyState> : null}
        </div>
      </div>

      <aside
        style={{
          width: 300,
          flex: "0 0 300px",
          borderLeft: `1px solid ${C.line}`,
          background: C.sandDeep,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Kicker>This week</Kicker>
          <Display size={21}>Most-checked claims</Display>
        </div>
        {trending.map((t) => (
          <div
            key={t.text}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              paddingBottom: 12,
              borderBottom: "1px solid rgba(21,21,21,0.09)",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: t.dot,
                marginTop: 6,
                flex: "0 0 7px",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 13, lineHeight: 1.4 }}>{t.text}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{t.meta}</span>
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}
