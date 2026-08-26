"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { C, PARTY, PARTY_LABEL, cond, trustBand } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { computeMatch, initials } from "@/lib/scoring";
import type { Level, Politician } from "@/lib/types";
import { Avatar, Bar, Chip, Kicker, RustButton } from "@/components/ui";

type SortKey = "name" | "office" | "level" | "party" | "trust" | "match";

const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "name", label: "Name", align: "left" },
  { key: "office", label: "Office", align: "left" },
  { key: "level", label: "Level", align: "left" },
  { key: "party", label: "Party", align: "left" },
  { key: "trust", label: "Trust score", align: "left" },
  { key: "match", label: "Match", align: "right" },
];

const SORT_LABEL: Record<SortKey, string> = {
  name: "Name",
  office: "Office",
  level: "Level",
  party: "Party",
  trust: "Trust score",
  match: "Value match",
};

const GRID = "2.1fr 1.7fr 0.8fr 0.9fr 1.6fr 0.9fr";
const LEVELS: (Level | "All")[] = ["All", "Local", "State", "Federal"];

export default function FeedView({ politicians }: { politicians: Politician[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const { topics, saved, toggleSaved } = usePrefs();

  const [level, setLevel] = useState<Level | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("match");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const scored = useMemo(
    () => politicians.map((p) => ({ ...p, match: computeMatch(p, topics) })),
    [politicians, topics],
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const dir = sortDir === "asc" ? 1 : -1;
    return scored
      .filter((p) => level === "All" || p.level === level)
      .filter(
        (p) =>
          !needle ||
          `${p.name} ${p.office} ${p.tags.join(" ")}`.toLowerCase().includes(needle),
      )
      .sort((a, b) => {
        const va = a[sortKey];
        const vb = b[sortKey];
        const cmp =
          typeof va === "number" && typeof vb === "number"
            ? va - vb
            : String(va).localeCompare(String(vb));
        return cmp * dir;
      });
  }, [scored, level, q, sortKey, sortDir]);

  const counts = useMemo(
    () => ({
      All: scored.length,
      Local: scored.filter((p) => p.level === "Local").length,
      State: scored.filter((p) => p.level === "State").length,
      Federal: scored.filter((p) => p.level === "Federal").length,
    }),
    [scored],
  );

  const hero = useMemo(
    () => scored.slice().sort((a, b) => b.match - a.match)[0],
    [scored],
  );

  function sortBy(key: SortKey) {
    if (key === sortKey) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const heroSaved = saved.includes(hero.id);
  const heroTotal = hero.kept + hero.prog + hero.broken;

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Top match */}
      <section
        className="split"
        style={{ display: "flex", background: C.ink, borderRadius: 12, overflow: "hidden" }}
      >
        <div
          style={{
            flex: 1,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Kicker color={C.tan} style={{ letterSpacing: "0.16em" }}>
              Top match on your ballot
            </Kicker>
            <span style={{ height: 1, flex: 1, background: "rgba(243,239,228,0.2)" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Avatar text={initials(hero.name)} size={66} bg={C.tan} fg={C.ink} radius={12} font={23} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontFamily: cond, fontSize: 32, color: C.sand, lineHeight: 1.05 }}>
                {hero.name}
              </span>
              <span style={{ fontSize: 13, color: C.tan }}>
                {hero.office} · {hero.district} · {PARTY_LABEL[hero.party]} · in office since {hero.since}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {hero.policies.slice(0, 3).map((p) => (
              <div key={p.issue} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, color: C.tan }}>{p.issue}</span>
                <Bar
                  pct={p.align}
                  height={5}
                  track="rgba(243,239,228,0.16)"
                  color={p.align >= 85 ? C.sand : p.align >= 60 ? C.tan : C.rust}
                />
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            width: 310,
            flex: "0 0 310px",
            borderLeft: "1px solid rgba(243,239,228,0.18)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            background: C.inkSoft,
          }}
        >
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Kicker color={C.tan} style={{ letterSpacing: "0.16em" }}>
                Value match
              </Kicker>
              <span style={{ fontFamily: cond, fontSize: 46, lineHeight: 1, color: C.sand }}>
                {hero.match}%
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Kicker color={C.tan} style={{ letterSpacing: "0.16em" }}>
                Trust score
              </Kicker>
              <span style={{ fontFamily: cond, fontSize: 46, lineHeight: 1, color: C.sand }}>
                {hero.trust}
              </span>
            </div>
          </div>

          <div style={{ fontSize: 12, color: C.tan, lineHeight: 1.5 }}>
            {hero.kept} of {heroTotal} tracked promises delivered · {hero.prog} in progress ·{" "}
            {hero.broken} with no movement
          </div>

          <div style={{ display: "flex", gap: 9, marginTop: "auto" }}>
            <RustButton
              onClick={() => router.push(`/politician/${hero.id}`)}
              style={{ flex: 1, padding: 11, borderRadius: 7, fontSize: 14 }}
            >
              View profile
            </RustButton>
            <button
              type="button"
              onClick={() => toggleSaved(hero.id)}
              style={{
                padding: "11px 14px",
                borderRadius: 7,
                border: "1px solid rgba(243,239,228,0.32)",
                background: "transparent",
                color: C.sand,
                fontFamily: cond,
                fontSize: 14,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {heroSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {LEVELS.map((l) => (
          <Chip key={l} on={level === l} onClick={() => setLevel(l)}>
            {(l === "All" ? "All levels" : l) + " · " + counts[l]}
          </Chip>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>Sorted by</span>
        <span
          style={{ fontFamily: cond, fontSize: 15, letterSpacing: "0.04em", textTransform: "uppercase" }}
        >
          {SORT_LABEL[sortKey]}
        </span>
      </div>

      {/* Table */}
      <div
        style={{
          border: `1px solid ${C.line}`,
          borderRadius: 10,
          overflow: "hidden",
          background: C.white,
        }}
      >
        <div
          className="stack-grid-head"
          style={{
            display: "grid",
            gridTemplateColumns: GRID,
            gap: 12,
            padding: "0 18px",
            background: C.sand,
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          {COLUMNS.map((c) => (
            <button
              key={c.key}
              type="button"
              className="tab"
              onClick={() => sortBy(c.key)}
              style={{
                border: 0,
                background: "transparent",
                padding: "12px 0",
                textAlign: c.align,
                fontFamily: cond,
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: sortKey === c.key ? C.ink : C.muted,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {c.label}
              {sortKey === c.key ? (sortDir === "asc" ? " ⌃" : " ⌄") : ""}
            </button>
          ))}
        </div>

        {rows.map((r) => {
          const band = trustBand(r.trust);
          return (
            <Link
              key={r.id}
              href={`/politician/${r.id}`}
              className="row-hover stack-grid"
              style={{
                display: "grid",
                gridTemplateColumns: GRID,
                gap: 12,
                padding: "12px 18px",
                alignItems: "center",
                borderBottom: `1px solid ${C.lineSoft}`,
                color: C.ink,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <Avatar text={initials(r.name)} size={28} radius={7} font={11} />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {r.name}
                </span>
              </span>
              <span style={{ fontSize: 13, color: C.body }}>
                {r.office} · {r.district}
              </span>
              <span
                style={{
                  fontFamily: cond,
                  fontSize: 12,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: C.muted,
                }}
              >
                {r.level}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.body }}>
                <span
                  style={{ width: 8, height: 8, borderRadius: 2, background: PARTY[r.party] }}
                />
                {r.party}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Bar pct={r.trust} color={band.color} style={{ maxWidth: 92 }} />
                <span style={{ fontFamily: cond, fontSize: 16, color: band.color, width: 24 }}>
                  {r.trust}
                </span>
                <span style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>{band.label}</span>
              </span>
              <span style={{ textAlign: "right", fontFamily: cond, fontSize: 17 }}>{r.match}%</span>
            </Link>
          );
        })}

        {rows.length === 0 ? (
          <div style={{ padding: "26px 18px", fontSize: 13, color: C.muted }}>
            No politicians match “{q}” at this level.
          </div>
        ) : null}
      </div>
    </div>
  );
}
