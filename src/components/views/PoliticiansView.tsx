"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { C, PARTY, PARTY_LABEL, cond } from "@/lib/theme";
import { ballotPoliticianIds } from "@/lib/feed";
import { initials } from "@/lib/scoring";
import { Avatar, Chip, Display, EmptyState, Kicker, SearchField } from "@/components/ui";
import type { Level, Party, Politician, Race } from "@/lib/types";

type BallotFilter = "all" | "onBallot" | "notOnBallot";

const BALLOT_FILTERS: { key: BallotFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "onBallot", label: "On my ballot" },
  { key: "notOnBallot", label: "Not on my ballot" },
];

const LEVEL_FILTERS: (Level | "All")[] = ["All", "Federal", "State", "Local"];
const PARTY_FILTERS: (Party | "All")[] = ["All", "D", "R", "I"];

/**
 * Everyone in the system, not just who's on your ballot -- the broader
 * companion to the Feed/Guide "Your Representatives" card, which now links
 * here instead of the retired /representatives page. Defaults to "On my
 * ballot" so it opens looking like /representatives did; switching that
 * filter is what makes this a real directory instead of a ballot-only
 * index. No HUSH. Score anywhere on this page, same convention the old
 * /representatives used -- a score belongs on a politician's own page, one
 * click away.
 */
export default function PoliticiansView({
  politicians,
  races,
}: {
  politicians: Politician[];
  races: Race[];
}) {
  const [q, setQ] = useState("");
  const [ballotFilter, setBallotFilter] = useState<BallotFilter>("onBallot");
  const [levelFilter, setLevelFilter] = useState<Level | "All">("All");
  const [partyFilter, setPartyFilter] = useState<Party | "All">("All");
  const [officeFilter, setOfficeFilter] = useState<string>("All");

  const ballotIds = useMemo(() => ballotPoliticianIds(races), [races]);

  const offices = useMemo(() => {
    const set = new Set(
      politicians.filter((p) => levelFilter === "All" || p.level === levelFilter).map((p) => p.office),
    );
    return Array.from(set).sort();
  }, [politicians, levelFilter]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return politicians
      .filter((p) => levelFilter === "All" || p.level === levelFilter)
      .filter((p) => partyFilter === "All" || p.party === partyFilter)
      .filter((p) => officeFilter === "All" || p.office === officeFilter)
      .filter((p) => ballotFilter === "all" || (ballotFilter === "onBallot") === ballotIds.has(p.id))
      .filter((p) => !query || `${p.name} ${p.office}`.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [politicians, levelFilter, partyFilter, officeFilter, ballotFilter, q, ballotIds]);

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Kicker>Politicians</Kicker>
        <Display size={25}>Every candidate and elected official</Display>
        <span style={{ fontSize: 13, color: C.body, maxWidth: 640, lineHeight: 1.5 }}>
          Not just your ballot — search or filter to find anyone in the system.
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <SearchField value={q} onChange={setQ} placeholder="Search name or office…" style={{ width: 240 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {BALLOT_FILTERS.map((f) => (
            <Chip key={f.key} on={ballotFilter === f.key} onClick={() => setBallotFilter(f.key)}>
              {f.label}
            </Chip>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {LEVEL_FILTERS.map((lvl) => (
            <Chip
              key={lvl}
              on={levelFilter === lvl}
              onClick={() => {
                setLevelFilter(lvl);
                setOfficeFilter("All");
              }}
            >
              {lvl}
            </Chip>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PARTY_FILTERS.map((party) => (
            <Chip
              key={party}
              on={partyFilter === party}
              onClick={() => setPartyFilter(party)}
              dot={party === "All" ? undefined : PARTY[party]}
            >
              {party === "All" ? "All parties" : PARTY_LABEL[party]}
            </Chip>
          ))}
        </div>
        <select
          value={officeFilter}
          onChange={(e) => setOfficeFilter(e.target.value)}
          aria-label="Filter by office"
          style={{
            padding: "9px 12px",
            border: "1px solid rgba(21,21,21,0.16)",
            borderRadius: 7,
            background: C.sandDeep,
            fontSize: 13,
            color: C.ink,
            fontFamily: "inherit",
          }}
        >
          <option value="All">All offices</option>
          {offices.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <span
        style={{
          fontFamily: cond,
          fontSize: 12,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: C.muted,
        }}
      >
        {filtered.length} {filtered.length === 1 ? "result" : "results"}
      </span>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((p) => (
          <Link
            key={p.id}
            href={`/politician/${p.id}`}
            className="card-hover"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              background: C.white,
              padding: "13px 16px",
              color: C.ink,
            }}
          >
            <Avatar text={initials(p.name)} size={36} radius={9} font={14} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
              <span style={{ fontSize: 12, color: C.muted }}>
                {p.office} · {p.district} · {PARTY_LABEL[p.party]}
              </span>
            </div>
            <span style={{ fontSize: 11, color: ballotIds.has(p.id) ? C.rust : C.faint, whiteSpace: "nowrap" }}>
              {ballotIds.has(p.id) ? "On your ballot" : "Not on your ballot"}
            </span>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: PARTY[p.party], flex: "0 0 8px" }} />
          </Link>
        ))}
        {filtered.length === 0 ? <EmptyState>No one matches these filters.</EmptyState> : null}
      </div>
    </div>
  );
}
