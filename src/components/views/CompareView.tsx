"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { C, PARTY, TAG_STYLE, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { DEFAULT_DISTRICT } from "@/lib/seed-data";
import { stripPartySuffix } from "@/lib/guide";
import { initials } from "@/lib/scoring";
import { eligibleCandidates, stanceCoverage } from "@/lib/compare";
import type { IssuePosition, Politician, Race, StanceCell } from "@/lib/types";
import { Avatar, Display, ExpandableQuote, Kicker, RustButton, SearchField } from "@/components/ui";

/**
 * Side-by-side stance grid -- app IA restructure phase 5. Two changes from
 * the original brief's "ranked-issue rows plus a score row": the amendment
 * overrides the score row entirely (no HUSH. Score anywhere in Compare, ever
 * -- it's a single politician's own number, and this view exists specifically
 * to put politicians next to each other; the header used to show every pick's
 * score in the same row, which is exactly the "two scores visible at once"
 * case the amendment rules out). What ships instead is the ranked-issue half:
 * rows are reordered so the issues the user ranked lead, in rank order, each
 * tagged "Your #N" -- same convention HUSH Guide's race cards already use for
 * "Your #N issue". `stances` only ever covers a handful of issues (whichever
 * ones have seeded StanceCell data); rows still come from those keys, same as
 * before this phase -- ranking only changes their order and adds the label,
 * it doesn't add or remove rows. Any of the user's ranked issues outside that
 * set simply have no row here, same as always.
 */
export default function CompareView({
  politicians,
  races,
  stances,
  guidePositions,
}: {
  politicians: Politician[];
  races: Race[];
  stances: Record<string, Record<string, StanceCell>>;
  /** Same sourced excerpts the politician page's "Positions" section reads
   * from -- when a stance row's candidate has one for this issue, the row
   * links to a real source + retrieval date instead of the inert
   * "coming soon" placeholder, and through to the full quote there. */
  guidePositions: Record<string, Record<string, IssuePosition>>;
}) {
  const router = useRouter();
  const { zip, setZip, picks, setPicks, topics } = usePrefs();
  const [zipDraft, setZipDraft] = useState(zip);
  // "add": picking a politician for the next open slot. A number: replacing
  // the pick at that index. null: closed. One shared panel handles both --
  // see the picker render block below the "Side by side" header.
  const [pickerMode, setPickerMode] = useState<"add" | number | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");

  const byId = useMemo(
    () => new Map(politicians.map((p) => [p.id, p])),
    [politicians],
  );

  const heads = picks.map((id) => byId.get(id) ?? politicians[0]);

  // Custom Compare's mechanical gate (see lib/compare.ts): full stance
  // coverage + at least one promise, same office level as whatever's already
  // picked. Replacing a slot excludes that slot's own current pick from the
  // "already picked" check, so its candidate re-appears in its own list.
  const candidatesFor = (mode: "add" | number): Politician[] =>
    eligibleCandidates(
      politicians,
      stances,
      mode === "add" ? heads : heads.filter((_, j) => j !== mode),
    );

  function choosePolitician(id: string) {
    if (pickerMode === "add") {
      setPicks(picks.concat(id));
    } else if (typeof pickerMode === "number") {
      const next = picks.slice();
      next[pickerMode] = id;
      setPicks(next);
    }
    setPickerMode(null);
    setPickerQuery("");
  }

  // Issues the user ranked, in rank order, promoted to the top of the grid;
  // everything else keeps its original order after them. `stances` only
  // covers a handful of issues (whichever have seeded StanceCell data), so
  // this reorders that fixed set rather than adding or removing rows.
  const rankOf = new Map(topics.map((t, i) => [t, i + 1]));
  const orderedIssues = Object.keys(stances)
    .map((issue) => ({ issue, rank: rankOf.get(issue) }))
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));

  const gridCols = `150px ${picks.map(() => "1fr").join(" ")}`;

  return (
    <div className="split" style={{ display: "flex", minHeight: "100%" }}>
      {/* Ballot lookup */}
      <div
        style={{
          width: 452,
          flex: "0 0 452px",
          borderRight: `1px solid ${C.line}`,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          background: C.sandDeep,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Kicker>Vote compare</Kicker>
          <Display size={25}>Pull up your ballot</Display>
          <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
            Enter a ZIP and we load every race you can vote in, scored against your ranked issues.
          </span>
        </div>

        <form
          style={{ display: "flex", gap: 8 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (zipDraft.length === 5) setZip(zipDraft);
          }}
        >
          <input
            value={zipDraft}
            onChange={(e) => setZipDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
            maxLength={5}
            inputMode="numeric"
            aria-label="ZIP code"
            style={{
              flex: 1,
              padding: "11px 14px",
              border: `1px solid ${C.lineHard}`,
              borderRadius: 8,
              background: C.white,
              fontSize: 19,
              letterSpacing: "0.1em",
              outline: "none",
            }}
          />
          <RustButton type="submit">Look up</RustButton>
        </form>

        <span style={{ fontSize: 12, color: C.muted }}>
          {DEFAULT_DISTRICT.raceCount} races found{zip !== DEFAULT_DISTRICT.zip ? ` for ${zip}` : ""} ·
          matched to {Math.min(topics.length, 5)} ranked issues
        </span>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {races.map((race) => (
            <div
              key={race.id}
              className="card-hover"
              style={{
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                background: C.white,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 9,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  style={{
                    fontFamily: cond,
                    fontSize: 16,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {race.title}
                </span>
                <span
                  style={{ marginLeft: "auto", fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}
                >
                  {race.meta}
                </span>
              </div>

              {race.candidates.map((c) => {
                const known = byId.has(c.politicianId);
                return (
                  <button
                    key={c.politicianId}
                    type="button"
                    className="fade"
                    onClick={() => known && router.push(`/politician/${c.politicianId}`)}
                    disabled={!known}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      border: 0,
                      background: "transparent",
                      padding: "2px 0",
                      cursor: known ? "pointer" : "default",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: PARTY[c.party],
                        flex: "0 0 8px",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {stripPartySuffix(c.name)}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Stance grid */}
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
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Kicker>Side by side</Kicker>
            <Display size={25}>Stance grid</Display>
            {/* One-time note, not a lock -- see lib/compare.ts's header comment. */}
            <span style={{ fontSize: 11, color: C.muted }}>Free while in beta.</span>
          </div>
          {picks.length < 3 ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setPickerMode("add");
                setPickerQuery("");
              }}
              style={{
                marginLeft: "auto",
                padding: "10px 15px",
                border: `1px dashed ${C.lineHard}`,
                borderRadius: 8,
                background: "transparent",
                fontSize: 13,
                color: C.muted,
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              + Add a politician to compare
            </button>
          ) : null}
        </div>

        {pickerMode !== null ? (
          <ComparePicker
            candidates={candidatesFor(pickerMode)}
            stances={stances}
            query={pickerQuery}
            onQueryChange={setPickerQuery}
            onPick={choosePolitician}
            onCancel={() => {
              setPickerMode(null);
              setPickerQuery("");
            }}
            replacing={typeof pickerMode === "number" ? heads[pickerMode]?.name : undefined}
          />
        ) : null}

        <div style={{ overflowX: "auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridCols,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              background: C.white,
              overflow: "hidden",
              minWidth: 560,
            }}
          >
            <span style={{ background: C.sand, borderBottom: `1px solid ${C.line}` }} />
            {heads.map((h, i) => (
              <div
                key={`${h.id}-${i}`}
                style={{
                  background: C.sand,
                  borderBottom: `1px solid ${C.line}`,
                  borderLeft: `1px solid ${C.lineSoft}`,
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar
                    text={initials(h.name)}
                    size={30}
                    radius={7}
                    bg={PARTY[h.party]}
                    fg={C.sand}
                    font={12}
                  />
                  <button
                    type="button"
                    onClick={() => setPicks(picks.filter((_, j) => j !== i))}
                    aria-label={`Remove ${h.name} from comparison`}
                    style={{
                      marginLeft: "auto",
                      border: 0,
                      background: "transparent",
                      color: C.muted,
                      fontSize: 14,
                      cursor: "pointer",
                      padding: 8,
                    }}
                  >
                    ✕
                  </button>
                </div>
                <span style={{ fontFamily: cond, fontSize: 15 }}>{h.name}</span>
                <span style={{ fontSize: 11, color: C.muted }}>
                  {h.office} · {h.district}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPickerMode(i);
                    setPickerQuery("");
                  }}
                  style={{
                    alignSelf: "flex-start",
                    border: 0,
                    background: "transparent",
                    padding: 0,
                    fontSize: 11,
                    color: C.rust,
                    cursor: "pointer",
                  }}
                >
                  Change
                </button>
              </div>
            ))}

            {orderedIssues.map(({ issue, rank }) => (
              <Row
                key={issue}
                issue={issue}
                rank={rank}
                picks={picks}
                stances={stances}
                guidePositions={guidePositions}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  issue,
  rank,
  picks,
  stances,
  guidePositions,
}: {
  issue: string;
  /** This issue's 1-based position in the user's ranked list, if it's on it. */
  rank?: number;
  picks: string[];
  stances: Record<string, Record<string, StanceCell>>;
  guidePositions: Record<string, Record<string, IssuePosition>>;
}) {
  return (
    <>
      <span
        style={{
          padding: "11px 12px",
          borderBottom: `1px solid ${C.lineSoft}`,
          background: C.hover,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {issue}
        </span>
        {rank ? (
          <span
            style={{
              padding: "2px 7px",
              borderRadius: 10,
              fontSize: 10,
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
              background: C.rustFill,
              color: C.rust,
            }}
          >
            Your #{rank}
          </span>
        ) : null}
      </span>
      {picks.map((id, i) => {
        const fallback: StanceCell = ["No record", "Not tracked for this office"];
        const cell = stances[issue]?.[id] ?? fallback;
        const [tag, blurb, cellSourceUrl] = cell;
        const style = TAG_STYLE[tag];
        // Prefer the sourced HUSH Guide position for this exact (candidate,
        // issue) pair when one exists -- it carries a real source URL and a
        // retrieval date, and is the same excerpt the politician page's
        // "Positions" section renders in full, so this row can link there
        // rather than promising a source that isn't populated on `StanceCell`
        // itself (see its own doc comment: no seed data sets `sourceUrl` yet).
        const position = guidePositions[id]?.[issue];
        // "No record" has nothing sourced to link to; the other three tags
        // are link bubbles that deep-link to the sourced passage when
        // `position` (or, later, `cellSourceUrl`) is populated — until then
        // they're link-styled but inert rather than pointing somewhere fake.
        const isLinkable = tag !== "No record";
        const sourceUrl = position?.sourceUrl ?? cellSourceUrl;
        const bubbleStyle = {
          alignSelf: "flex-start" as const,
          padding: "3px 8px",
          borderRadius: 12,
          fontSize: 11,
          whiteSpace: "nowrap" as const,
          background: style.bg,
          color: style.fg,
        };
        return (
          <div
            key={`${issue}-${id}-${i}`}
            style={{
              padding: "11px 12px",
              borderBottom: `1px solid ${C.lineSoft}`,
              borderLeft: `1px solid ${C.lineSoft}`,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {position ? (
              <ExpandableQuote
                text={position.excerpt}
                style={{ fontSize: 12, color: C.body, lineHeight: 1.45 }}
              />
            ) : (
              <span style={{ fontSize: 12, color: C.body, lineHeight: 1.45 }}>{blurb}</span>
            )}
            {isLinkable ? (
              sourceUrl ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="stance-tag-link"
                    style={{ ...bubbleStyle, textDecoration: "none", cursor: "pointer" }}
                  >
                    Source
                  </a>
                  {position?.date ? <span style={{ fontSize: 11, color: C.muted }}>{position.date}</span> : null}
                  {position ? (
                    <Link href={`/politician/${id}#positions`} style={{ fontSize: 11, color: C.rust }}>
                      Full quote →
                    </Link>
                  ) : null}
                </div>
              ) : (
                <span
                  className="stance-tag-link"
                  title="Source link coming soon"
                  style={{ ...bubbleStyle, cursor: "pointer" }}
                >
                  Source
                </span>
              )
            ) : (
              <span style={bubbleStyle}>{tag}</span>
            )}
          </div>
        );
      })}
    </>
  );
}

/**
 * The custom-compare picker: search + a list of already-gated candidates
 * (see lib/compare.ts's eligibleCandidates -- `candidates` here has already
 * been filtered to full stance coverage, a tracked promise, and the same
 * office level as the rest of the comparison, so every row shown is a valid
 * pick). Each row's "X/N stances" figure is the coverage-bar gate made
 * visible, not a separate check -- it will always read N/N here since a
 * partial-coverage candidate never reaches this list, which is deliberate:
 * seeing "6/6" next to a real name is what makes the gate legible rather
 * than a silent filter no one can see the logic of.
 */
function ComparePicker({
  candidates,
  stances,
  query,
  onQueryChange,
  onPick,
  onCancel,
  replacing,
}: {
  candidates: Politician[];
  stances: Record<string, Record<string, StanceCell>>;
  query: string;
  onQueryChange: (v: string) => void;
  onPick: (id: string) => void;
  onCancel: () => void;
  /** Name of the pick being replaced, when this panel opened from "Change" rather than "+ Add". */
  replacing?: string;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates
      .filter((p) => !q || `${p.name} ${p.office}`.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [candidates, query]);

  return (
    <div
      style={{
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        background: C.white,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {replacing ? `Replace ${replacing}` : "Add a politician to compare"}
        </span>
        <button
          type="button"
          onClick={onCancel}
          style={{ marginLeft: "auto", border: 0, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 12 }}
        >
          Cancel
        </button>
      </div>

      <SearchField value={query} onChange={onQueryChange} placeholder="Search by name or office…" />

      <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 240, overflowY: "auto" }}>
        {filtered.map((p) => {
          const { have, total } = stanceCoverage(p.id, stances);
          return (
            <button
              key={p.id}
              type="button"
              className="row-hover"
              onClick={() => onPick(p.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: 0,
                background: "transparent",
                padding: "8px 6px",
                borderRadius: 6,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Avatar text={initials(p.name)} size={26} radius={7} bg={PARTY[p.party]} fg={C.sand} font={11} />
              <span style={{ fontSize: 13 }}>{p.name}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{p.office}</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: C.muted, whiteSpace: "nowrap" }}>
                {have}/{total} stances
              </span>
            </button>
          );
        })}
        {filtered.length === 0 ? (
          <span style={{ fontSize: 12, color: C.muted, padding: "8px 6px", lineHeight: 1.5 }}>
            No one matches. Eligible candidates need full stance coverage and a tracked promise, at the same office
            level as your other picks.
          </span>
        ) : null}
      </div>
    </div>
  );
}
