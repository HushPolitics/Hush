"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { C, PARTY, PARTY_LABEL, cond, trustBand } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { computeMatch, initials, lastNameOf } from "@/lib/scoring";
import type { Level, Politician } from "@/lib/types";
import { Avatar, Bar, Chip, Kicker, RustButton } from "@/components/ui";

type SortKey = "name" | "office" | "level" | "party" | "trust" | "lastName";

const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "name", label: "Name", align: "left" },
  { key: "office", label: "Office", align: "left" },
  { key: "level", label: "Level", align: "left" },
  { key: "party", label: "Party", align: "left" },
  { key: "trust", label: "Trust score", align: "left" },
];

const SORT_LABEL: Record<SortKey, string> = {
  name: "Name",
  office: "Office",
  level: "Level",
  party: "Party",
  trust: "Trust Score",
  lastName: "Alphabetical (A-Z)",
};

const GRID = "2.1fr 1.7fr 0.8fr 0.9fr 1.6fr";
const LEVELS: (Level | "All")[] = ["All", "Local", "State", "Federal"];

// Federal > State > Local, so the default (desc) direction reads
// highest-office-first — matching sortBy()'s existing "new key = desc" default.
const LEVEL_RANK: Record<Level, number> = { Federal: 2, State: 1, Local: 0 };

const SORT_OPTIONS: { label: string; key: SortKey }[] = [
  { label: "Trust Score", key: "trust" },
  { label: "Alphabetical (A-Z)", key: "lastName" },
  { label: "Level", key: "level" },
];

export default function FeedView({ politicians }: { politicians: Politician[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const { topics, saved, toggleSaved } = usePrefs();

  const [level, setLevel] = useState<Level | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("trust");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sortOpen, setSortOpen] = useState(false);

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
        let cmp: number;
        if (sortKey === "level") {
          cmp = LEVEL_RANK[a.level] - LEVEL_RANK[b.level];
        } else if (sortKey === "lastName") {
          cmp = lastNameOf(a.name).localeCompare(lastNameOf(b.name));
        } else {
          const va = a[sortKey];
          const vb = b[sortKey];
          cmp =
            typeof va === "number" && typeof vb === "number"
              ? va - vb
              : String(va).localeCompare(String(vb));
        }
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

  function selectSort(key: SortKey) {
    // Same toggle pattern as sortBy() above: re-selecting the active key
    // flips direction. Newly selecting a key defaults to descending (the
    // Trust Score and Level rank orders both read correctly highest-first
    // that way) except Alphabetical, which reads correctly A→Z first.
    if (key === sortKey) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else {
      setSortKey(key);
      setSortDir(key === "lastName" ? "asc" : "desc");
    }
    setSortOpen(false);
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
          <div style={{ display: "flex", alignItems: "center", flexDirection: "column", textAlign: "center" }}>
            <Kicker color={C.tan} style={{ letterSpacing: "0.16em" }}>
              Trust score
            </Kicker>
            <span style={{ fontFamily: cond, fontSize: 46, lineHeight: 1, color: C.sand }}>
              {hero.trust}
            </span>
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
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setSortOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              border: 0,
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              fontFamily: cond,
              fontSize: 15,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: C.ink,
            }}
          >
            {SORT_LABEL[sortKey]}
            <span style={{ fontSize: 10, color: C.muted }}>{sortOpen ? "⌃" : "⌄"}</span>
          </button>

          {sortOpen ? (
            <>
              <div
                onClick={() => setSortOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 9 }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  zIndex: 10,
                  minWidth: 190,
                  border: `1px solid ${C.line}`,
                  borderRadius: 10,
                  background: C.white,
                  boxShadow: "0 8px 24px rgba(21,21,21,0.14)",
                  padding: 6,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    className="row-hover"
                    onClick={() => selectSort(opt.key)}
                    style={{
                      border: 0,
                      background: "transparent",
                      borderRadius: 6,
                      padding: "9px 10px",
                      textAlign: "left",
                      fontSize: 13,
                      cursor: "pointer",
                      color: opt.key === sortKey ? C.ink : C.body,
                      fontWeight: opt.key === sortKey ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
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
