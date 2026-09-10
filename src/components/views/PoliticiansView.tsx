"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { C, PARTY, PARTY_LABEL, cond } from "@/lib/theme";
import { ballotPoliticianIds } from "@/lib/feed";
import { initials } from "@/lib/scoring";
import { Avatar, Chip, Display, EmptyState, Kicker, SearchField } from "@/components/ui";
import type { Level, Party, Politician, Race } from "@/lib/types";

type BallotFilter = "all" | "onBallot";

const BALLOT_FILTERS: { key: BallotFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "onBallot", label: "On my ballot" },
];

const LEVEL_FILTERS: (Level | "All")[] = ["All", "Federal", "State", "Local"];
const PARTY_FILTERS: (Party | "All")[] = ["All", "D", "R", "I"];

// Avatar / Name / Party / Office / District / On your ballot. All four data
// columns are proportional (not a fixed width mixed in) so they grow at a
// consistent rate and read as evenly spaced instead of Name and Office
// ballooning past a cramped, fixed-width Party column. Office keeps the
// largest share and District close behind -- a few entries run long there
// ("Florida State College at Jacksonville" as a district), so they need
// room to wrap onto a second line rather than getting clipped.
const ROW_GRID = "40px 1fr 0.8fr 1.2fr 1fr 90px";

/**
 * Politicians' hero banner -- same shell and scrim device as Feed's
 * FeedHero, GuideView.tsx's GuideHero, and StanceCheckView.tsx's
 * StanceCheckHero, so it reads as the same banner across all four tabs.
 * Purely additive above the existing Kicker/Display title block below,
 * which stays exactly where it is -- that block's explainer line ("Not
 * just your ballot...") is functional context the hero's own headline
 * doesn't carry, so unlike Guide/Stance Check this hero doesn't replace
 * the page's title, it sits above it, the same call FeedHero already made
 * for the same reason.
 */
function PoliticiansHero() {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        background: C.ink,
        minHeight: 260,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <img
        src="/images/politicians-hero.jpg"
        alt=""
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(11,10,8,0.85), rgba(11,10,8,0.35))",
        }}
      />
      <div style={{ position: "relative", padding: "22px 26px", display: "flex", flexDirection: "column", gap: 6 }}>
        <Kicker color={C.tan}>Politicians</Kicker>
        <Display size={28} color={C.sand}>
          Look up anyone. See where they stand.
        </Display>
      </div>
    </div>
  );
}

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
      <PoliticiansHero />

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
              activeBg={C.ink}
              activeFg={C.sand}
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

      {/* Column header -- same treatment as the promise ledger's grid head on a politician's own page */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: ROW_GRID,
          gap: 12,
          padding: "0 16px",
          fontFamily: cond,
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: C.muted,
        }}
      >
        <span />
        <span>Name</span>
        <span>Party</span>
        <span>Office</span>
        <span>District</span>
        <span>On your ballot</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((p) => {
          const onBallot = ballotIds.has(p.id);
          return (
            <Link
              key={p.id}
              href={`/politician/${p.id}`}
              className="card-hover"
              style={{
                display: "grid",
                gridTemplateColumns: ROW_GRID,
                gap: 12,
                alignItems: "center",
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                background: C.white,
                padding: "13px 16px",
                color: C.ink,
              }}
            >
              <Avatar text={initials(p.name)} size={36} radius={9} font={14} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.body }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: PARTY[p.party], flex: "0 0 7px" }} />
                {PARTY_LABEL[p.party]}
              </span>
              <span style={{ fontSize: 13, color: C.body }}>{p.office}</span>
              <span style={{ fontSize: 13, color: C.body }}>{p.district}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: onBallot ? C.rust : C.faint }}>
                {onBallot ? "Yes" : "No"}
              </span>
            </Link>
          );
        })}
        {filtered.length === 0 ? <EmptyState>No one matches these filters.</EmptyState> : null}
      </div>
    </div>
  );
}
