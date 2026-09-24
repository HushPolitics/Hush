"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { C, PARTY, PARTY_LABEL } from "@/lib/theme";
import { ballotPoliticianIds } from "@/lib/feed";
import { initials } from "@/lib/scoring";
import { usePrefs } from "@/lib/prefs";
import { isCustomCompareEligible, matchesPickLevel } from "@/lib/compare";
import { Avatar, Chip, Display, EmptyState, Kicker, SearchField } from "@/components/ui";
import type { Level, Party, Politician, Race, StanceCell } from "@/lib/types";

type BallotFilter = "all" | "onBallot";

const BALLOT_FILTERS: { key: BallotFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "onBallot", label: "On my ballot" },
];

const LEVEL_FILTERS: (Level | "All")[] = ["All", "Federal", "State", "Local"];
const PARTY_FILTERS: (Party | "All")[] = ["All", "D", "R", "I"];

// Avatar / Name / Party / Office / District / On your ballot / Compare. All
// four data columns are proportional (not a fixed width mixed in) so they
// grow at a consistent rate and read as evenly spaced instead of Name and
// Office ballooning past a cramped, fixed-width Party column. Office keeps
// the largest share and District close behind -- a few entries run long
// there ("Florida State College at Jacksonville" as a district), so they
// need room to wrap onto a second line rather than getting clipped. The
// trailing Compare column (entry point 3 for custom Compare, see
// lib/compare.ts) is a fixed width matching its chip's natural size.
const ROW_GRID = "40px 1fr 0.8fr 1.2fr 1fr 90px 118px";

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
      }}
    >
      <img
        src="/images/politicians-hero.jpg"
        alt=""
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
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
  stances,
}: {
  politicians: Politician[];
  races: Race[];
  /** The Compare stance grid, passed through only to gate the directory's Compare column -- see lib/compare.ts. */
  stances: Record<string, Record<string, StanceCell>>;
}) {
  const router = useRouter();
  const { picks, setPicks } = usePrefs();
  const [q, setQ] = useState("");
  const [ballotFilter, setBallotFilter] = useState<BallotFilter>("onBallot");
  const [levelFilter, setLevelFilter] = useState<Level | "All">("All");
  const [partyFilter, setPartyFilter] = useState<Party | "All">("All");
  const [officeFilter, setOfficeFilter] = useState<string>("All");

  const ballotIds = useMemo(() => ballotPoliticianIds(races), [races]);

  // The politicians currently picked for a custom comparison, resolved from
  // `picks` -- used to enforce the same-office-level constraint as a new row
  // is toggled on (see matchesPickLevel's own doc comment for why a mixed
  // pre-existing set doesn't block).
  const pickedPoliticians = useMemo(
    () => picks.map((id) => politicians.find((p) => p.id === id)).filter((p): p is Politician => Boolean(p)),
    [picks, politicians],
  );

  function togglePick(id: string) {
    setPicks(picks.includes(id) ? picks.filter((x) => x !== id) : picks.concat(id));
  }

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

      <Kicker>Politicians</Kicker>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Display size={25}>Every candidate and elected official</Display>
        <span style={{ fontSize: 13, color: C.body, maxWidth: 640, lineHeight: 1.5 }}>
          Not just your ballot — search or filter to find anyone in the system.
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <SearchField value={q} onChange={setQ} placeholder="Search name or office…" style={{ width: 240 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {BALLOT_FILTERS.map((f) => (
            <Chip
              key={f.key}
              on={ballotFilter === f.key}
              onClick={() => setBallotFilter(f.key)}
              activeBg={C.rust}
              activeFg={C.cream}
            >
              {f.label}
            </Chip>
          ))}
        </div>
        {/* Divider: separates the two primary actions (search, on my
            ballot) from the secondary refinement filters that follow */}
        <div aria-hidden style={{ width: 1, alignSelf: "stretch", background: C.line }} />
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
            border: `1px solid ${C.lineHard}`,
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
          fontWeight: 600,
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
        className="stack-grid-head"
        style={{
          display: "grid",
          gridTemplateColumns: ROW_GRID,
          gap: 12,
          padding: "0 16px",
          fontWeight: 600,
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
        <span>Compare</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: picks.length >= 2 ? 80 : 0 }}>
        {filtered.map((p) => {
          const onBallot = ballotIds.has(p.id);
          const isPicked = picks.includes(p.id);
          const eligible = isCustomCompareEligible(p, stances);
          const levelOk = matchesPickLevel(p, pickedPoliticians);
          const canAdd = eligible && levelOk && picks.length < 3;
          let compareTitle: string | undefined;
          if (!isPicked) {
            if (!eligible) {
              compareTitle = `HUSH needs a full stance record and at least one tracked promise for ${p.name} before offering a comparison.`;
            } else if (!levelOk) {
              compareTitle = "Your current comparison is all one office level -- pick someone at that same level.";
            } else if (picks.length >= 3) {
              compareTitle = "You can compare up to 3 politicians at once. Remove one to add another.";
            }
          }
          return (
            <div
              key={p.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/politician/${p.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(`/politician/${p.id}`);
              }}
              className="card-hover stack-grid"
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
                cursor: "pointer",
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
              {isPicked ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePick(p.id);
                  }}
                  style={{
                    padding: "7px 10px",
                    borderRadius: 16,
                    border: `1px solid ${C.rust}`,
                    background: C.rust,
                    color: C.cream,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    cursor: "pointer",
                  }}
                >
                  ✓ Added
                </button>
              ) : canAdd ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePick(p.id);
                  }}
                  style={{
                    padding: "7px 10px",
                    borderRadius: 16,
                    border: `1px solid ${C.lineHard}`,
                    background: "transparent",
                    color: C.ink,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    cursor: "pointer",
                  }}
                >
                  + Compare
                </button>
              ) : (
                <span
                  title={compareTitle}
                  style={{
                    padding: "7px 10px",
                    borderRadius: 16,
                    border: `1px solid ${C.line}`,
                    color: C.faint,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textAlign: "center",
                    width: "fit-content",
                  }}
                >
                  + Compare
                </span>
              )}
            </div>
          );
        })}
        {filtered.length === 0 ? <EmptyState>No one matches these filters.</EmptyState> : null}
      </div>

      {/* Entry point 3's floating action bar -- appears once 2+ are picked
          from this directory (Compare itself allows starting from as few as
          the seeded default, but this list-driven flow only makes sense once
          there's an actual comparison forming). Fixed within the page's
          scroll container, not the viewport, matching how AppShell scopes
          other overlays. On phone widths the party filter chips wrap onto
          an extra row, which can put them in the same bottom strip this
          bar hovers over -- `.compare-toolbar` (globals.css) turns it into
          a full-width bottom bar with a solid backing band there instead,
          so it reads as an intentional toolbar rather than a stray overlap. */}
      {picks.length >= 2 ? (
        <div className="compare-toolbar" style={{ position: "sticky", bottom: 16, display: "flex", justifyContent: "center", zIndex: 5 }}>
          <Link
            href="/compare"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 22px",
              borderRadius: 999,
              background: C.ink,
              color: C.sand,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.04em",
              boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
            }}
          >
            Compare {picks.length} →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
