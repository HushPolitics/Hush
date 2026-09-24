"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { useMounted } from "@/lib/hooks";
import { ELECTION_ISO, KEY_DATES } from "@/lib/seed-data";
import { ballotPoliticianIds } from "@/lib/feed";
import {
  issueCoverage,
  parseRaceTitle,
  raceLevelSummary,
  stripPartySuffix,
  topRankedIssueForRace,
} from "@/lib/guide";
import type { Bill, IssuePosition, Politician, Race } from "@/lib/types";
import { Card, Chip, Display, EmptyState, ExpandableQuote, GhostButton, Kicker, RustButton } from "@/components/ui";
import RepresentativesCard from "@/components/RepresentativesCard";
import { BillsSection } from "./GuideBills";

const fieldStyle = {
  padding: "11px 14px",
  border: `1px solid ${C.lineHard}`,
  borderRadius: 8,
  background: C.sandDeep,
  fontSize: 14,
  outline: "none",
} as const;

const labelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 12,
  color: C.muted,
};

type Step = "address" | "issues" | "grid";

/**
 * HUSH Guide's own flow, gated on `topics` — the same ranked issue list "My
 * Top Issues" in the account menu edits — rather than a separate "setup
 * done" flag: an empty list means the user hasn't been through setup, so
 * /hush-guide opens on the address step; once populated, it opens straight
 * on the tile grid. `manualStep` overrides that default once the user
 * navigates on purpose (Edit address / Edit issues from the grid, or
 * Continue/Back between steps) — see the render below for how each step's
 * actions clear or set it.
 *
 * First-time setup (empty `topics`) no longer uses this file's own inline
 * `IssuesStep` for ranking — AddressStep's onContinue instead routes out to
 * the shared "My Top Issues" editor (same drag-to-rank component
 * everywhere else), which sends the visitor back here via `?next=` once
 * they've ranked something. The grid's "Edit issues" action now routes to
 * that same shared editor. `IssuesStep` stays in place only for Stance
 * Check's own gate.
 */
export default function GuideView({
  politicians,
  races,
  topicPool,
  positions,
  // Defaulted rather than required: during the /guide -> /hush-guide route
  // migration, the old route's page.tsx doesn't pass this prop, and letting
  // it fall back to an empty list keeps that page building and rendering
  // (just without the Bills section) instead of breaking the deploy.
  bills = [],
}: {
  politicians: Politician[];
  races: Race[];
  topicPool: string[];
  positions: Record<string, Record<string, IssuePosition>>;
  bills?: Bill[];
}) {
  const router = useRouter();
  const { topics } = usePrefs();
  const [manualStep, setManualStep] = useState<Step | null>(null);
  const hasGuide = topics.length > 0;
  const step: Step = manualStep ?? (hasGuide ? "grid" : "address");

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      {step === "address" ? (
        <AddressStep
          hasGuide={hasGuide}
          onCancel={hasGuide ? () => setManualStep("grid") : undefined}
          onContinue={() => {
            // Already have topics ranked (this is a manual "Edit address"
            // visit, not first-time setup): stay in-page and go straight to
            // the grid, same as before. A visitor with no ranked issues at
            // all is routed out to the two-path chooser (rank yourself vs.
            // Issue Finder) instead of an inline, unranked issue-toggle step
            // — same shared `topics` list either path lands on, and it
            // sends the visitor back to the Guide via `next` once done.
            if (hasGuide) setManualStep("grid");
            else router.push("/profile/top-issues/start?next=/hush-guide");
          }}
        />
      ) : step === "issues" ? (
        <IssuesStep
          topicPool={topicPool}
          hasGuide={hasGuide}
          onBack={() => setManualStep("address")}
          onContinue={() => setManualStep("grid")}
        />
      ) : (
        <TileGrid
          races={races}
          politicians={politicians}
          positions={positions}
          bills={bills}
          onEditAddress={() => setManualStep("address")}
          onEditIssues={() => router.push("/profile/top-issues?next=/hush-guide")}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Address
// ---------------------------------------------------------------------------

function AddressStep({
  hasGuide,
  onCancel,
  onContinue,
}: {
  hasGuide: boolean;
  onCancel?: () => void;
  onContinue: () => void;
}) {
  const { streetAddress, city, state, zip, setStreetAddress, setCity, setState, setZip } = usePrefs();
  const [draftStreet, setDraftStreet] = useState(streetAddress);
  const [draftCity, setDraftCity] = useState(city);
  const [draftState, setDraftState] = useState(state);
  const [draftZip, setDraftZip] = useState(zip);

  function submit(e: FormEvent) {
    e.preventDefault();
    setStreetAddress(draftStreet.trim());
    if (draftCity.trim()) setCity(draftCity.trim());
    if (draftState.trim()) setState(draftState.trim().toUpperCase().slice(0, 2));
    if (draftZip.length === 5) setZip(draftZip);
    onContinue();
  }

  return (
    <Card
      style={{
        maxWidth: 620,
        margin: "0 auto",
        width: "100%",
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <Kicker>{hasGuide ? "Edit address" : "Step 1 of 2 · HUSH Guide"}</Kicker>
        <span style={{ height: 1, flex: 1, background: C.line }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontFamily: cond, fontSize: 24 }}>Confirm your address</span>
        <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
          HUSH Guide uses this to pull up every race on your ballot. It&apos;s the same address
          shown in the location pill at the top of the app, so anything you change here changes
          it everywhere else too.
        </span>
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={labelStyle}>
          Street address (optional)
          <input
            value={draftStreet}
            onChange={(e) => setDraftStreet(e.target.value)}
            placeholder="123 Main St"
            aria-label="Street address"
            style={fieldStyle}
          />
        </label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <label style={{ ...labelStyle, flex: 1, minWidth: 160 }}>
            City
            <input
              value={draftCity}
              onChange={(e) => setDraftCity(e.target.value)}
              placeholder="Jacksonville"
              aria-label="City"
              style={fieldStyle}
            />
          </label>
          <label style={{ ...labelStyle, width: 70 }}>
            State
            <input
              value={draftState}
              onChange={(e) => setDraftState(e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
              placeholder="FL"
              aria-label="State"
              style={{ ...fieldStyle, textTransform: "uppercase" }}
            />
          </label>
          <label style={{ ...labelStyle, width: 100 }}>
            ZIP
            <input
              value={draftZip}
              onChange={(e) => setDraftZip(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
              maxLength={5}
              inputMode="numeric"
              placeholder="32202"
              aria-label="ZIP code"
              style={fieldStyle}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <RustButton type="submit" style={{ flex: 1 }}>
            Continue
          </RustButton>
          {onCancel ? <GhostButton onClick={onCancel}>Cancel</GhostButton> : null}
        </div>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Issues
// ---------------------------------------------------------------------------

const MAX_GUIDE_ISSUES = 10;

/**
 * The "What matters most to you?" issue picker. Shared between HUSH Guide's
 * own setup flow and Stance Check's empty-`topics` gate — both features read
 * and write the same `topics` list that also drives "My Top Issues" and
 * Value Match on Profile/Compare, so there is deliberately one picker rather
 * than two or three. This picker is an unranked toggle, unlike the
 * drag-to-reorder list on Profile — an issue picked here just appends to the
 * end of the ranking. `kicker`/`title`/`description`/`continueLabel` default
 * to HUSH Guide's own copy (and `onBack` defaults to hidden), so HUSH
 * Guide's call site below needs no changes; a caller that wants different
 * wording (Stance Check) passes its own strings instead of branching on
 * `hasGuide` here.
 */
export function IssuesStep({
  topicPool,
  hasGuide,
  onBack,
  onContinue,
  kicker,
  title = "What matters most to you?",
  description,
  continueLabel,
}: {
  topicPool: string[];
  hasGuide: boolean;
  onBack?: () => void;
  onContinue: () => void;
  kicker?: string;
  title?: string;
  description?: ReactNode;
  continueLabel?: string;
}) {
  const { topics, toggleTopic } = usePrefs();
  const [capNote, setCapNote] = useState(false);

  function handleToggle(name: string) {
    if (!topics.includes(name) && topics.length >= MAX_GUIDE_ISSUES) {
      setCapNote(true);
      return;
    }
    setCapNote(false);
    toggleTopic(name);
  }

  return (
    <Card
      style={{
        maxWidth: 620,
        margin: "0 auto",
        width: "100%",
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <Kicker>{kicker ?? (hasGuide ? "Edit issues" : "Step 2 of 2 · HUSH Guide")}</Kicker>
        <span style={{ height: 1, flex: 1, background: C.line }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontFamily: cond, fontSize: 24 }}>{title}</span>
        <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
          {description ?? (
            <>
              Pick up to {MAX_GUIDE_ISSUES} issues. HUSH Guide researches sourced candidate
              positions on each one you choose — this is the same list as &quot;My Top
              Issues&quot; in your account menu, so picking issues here updates that
              ranking too.
            </>
          )}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 15, color: C.ink }}>
          {topics.length}/{MAX_GUIDE_ISSUES} selected
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {topicPool.map((name) => (
          <Chip key={name} on={topics.includes(name)} onClick={() => handleToggle(name)}>
            {name}
          </Chip>
        ))}
      </div>
      {capNote ? (
        <span style={{ fontSize: 12, color: C.rust }}>
          That&apos;s {MAX_GUIDE_ISSUES} — remove one to add another.
        </span>
      ) : null}

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        {onBack ? <GhostButton onClick={onBack}>Back</GhostButton> : null}
        <RustButton
          onClick={() => topics.length > 0 && onContinue()}
          style={{ flex: 1, opacity: topics.length === 0 ? 0.5 : 1, cursor: topics.length === 0 ? "not-allowed" : "pointer" }}
        >
          {continueLabel ?? (hasGuide ? "Save & view guide" : "Generate my guide")}
        </RustButton>
      </div>
      {topics.length === 0 ? (
        <span style={{ fontSize: 12, color: C.muted }}>Select at least one issue to continue.</span>
      ) : null}
      {hasGuide ? (
        <Link
          href="/profile/top-issues/issue-finder?next=/hush-guide"
          style={{ fontSize: 12, color: C.muted, textDecoration: "underline" }}
        >
          Prefer to answer a few questions instead? Try Issue Finder →
        </Link>
      ) : null}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Tile grid
// ---------------------------------------------------------------------------

/**
 * Which section leads the page: the legislation section (the only part of
 * HUSH Guide that changes between visits, and the strongest differentiator
 * the page has) or the race grid (the ballot itself). Legislation leads by
 * default; flip this to "races" for the final weeks before an election,
 * when the ballot should take priority over what's moving in the
 * legislature.
 */
const GUIDE_LEAD: "bills" | "races" = "races";

function TileGrid({
  races,
  politicians,
  positions,
  bills,
  onEditAddress,
  onEditIssues,
}: {
  races: Race[];
  politicians: Politician[];
  positions: Record<string, Record<string, IssuePosition>>;
  bills: Bill[];
  onEditAddress: () => void;
  onEditIssues: () => void;
}) {
  const router = useRouter();
  const { topics, polling } = usePrefs();
  const knownIds = new Set(politicians.map((p) => p.id));
  const ballotIds = useMemo(() => ballotPoliticianIds(races), [races]);
  const ballotPoliticians = useMemo(
    () => politicians.filter((p) => ballotIds.has(p.id)),
    [politicians, ballotIds],
  );

  return (
    <>
      <GuideHero />

      <Kicker>HUSH. Guide</Kicker>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Display size={25}>Straight from the candidates, not from us</Display>
        <span style={{ fontSize: 13, color: C.body, maxWidth: 640, lineHeight: 1.5 }}>
          Each candidate&apos;s own words on your issues, unfiltered — so you can decide who earns your
          vote.
        </span>
      </div>

      <GuideAtAGlanceStrip
        races={races}
        polling={polling}
        onEditAddress={onEditAddress}
        topics={topics}
        representatives={ballotPoliticians}
        onEditIssues={onEditIssues}
      />

      <VotingInformationSection polling={polling} />

        {GUIDE_LEAD === "bills" ? <BillsSection bills={bills} /> : null}

          {/*
        RACES has 6 entries seeded (U.S. House, U.S. Senate, Mayor, State
        Senate, County Judge, School Board), all for the same Jacksonville/Duval
        County sample ballot BallotView and CompareView already use — there's
        no real address-to-ballot lookup behind it yet, so every address
        shows the same six races. The seed dataset still has no Governor,
        State House, or County Commission race with a full candidate roster
        — those tile types are left out rather than invented. The footer
        disclaimer already covers this prototype limitation; it doesn't need
        repeating here too. See seed-data.ts.
      */}

      <div id="races" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Kicker>Your Races</Kicker>
        <Display size={22}>See where candidates stand on your issues</Display>
      </div>
      {races.length === 0 ? (
        <EmptyState>No races found in the seed dataset.</EmptyState>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
            gap: 14,
          }}
        >
          {races.map((race) => {
            const { office, district } = parseRaceTitle(race.title);
            const { covered, total } = issueCoverage(race, topics, positions);
            const top = topRankedIssueForRace(race, topics, positions);

            return (
              <Card
                key={race.id}
                style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
              >
                <div
                  style={{
                    minHeight: 62,
                    boxSizing: "border-box",
                    padding: "10px 16px",
                    background: C.shell,
                    borderBottom: `1px solid ${C.line}`,
                  }}
                >
                  <span style={{ fontFamily: cond, fontSize: 19, lineHeight: 1.15 }}>{office}</span>
                  {district ? (
                    <span style={{ fontSize: 12, color: C.muted, display: "block" }}>{district}</span>
                  ) : null}
                </div>
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {top ? (
                  <>
                    <Kicker size={11}>Your #{top.rank} issue: {top.issue}</Kicker>

                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {race.candidates.map((c) => {
                        const pos = positions[c.politicianId]?.[top.issue];
                        const nameEl = knownIds.has(c.politicianId) ? (
                          <Link
                            href={`/politician/${c.politicianId}`}
                            style={{ fontSize: 13, color: C.ink, fontWeight: 600 }}
                          >
                            {stripPartySuffix(c.name)}
                          </Link>
                        ) : (
                          <span style={{ fontSize: 13, color: C.body, fontWeight: 600 }}>
                            {stripPartySuffix(c.name)}
                          </span>
                        );
                        return (
                          <div key={c.politicianId} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {nameEl}
                            </div>
                            {pos ? (
                              <ExpandableQuote
                                text={pos.excerpt}
                                style={{ fontSize: 12, color: C.body, lineHeight: 1.4 }}
                              />
                            ) : (
                              <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic", lineHeight: 1.4 }}>
                                No official position found
                              </span>
                            )}
                            {pos ? (
                              <span style={{ fontSize: 11, color: C.muted, display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <a
                                  href={pos.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: C.rust }}
                                >
                                  Source
                                </a>
                                {pos.date ? <span>· {pos.date}</span> : null}
                                {knownIds.has(c.politicianId) ? (
                                  <>
                                    <span>·</span>
                                    <Link href={`/politician/${c.politicianId}#positions`} style={{ color: C.rust }}>
                                      Full quote →
                                    </Link>
                                  </>
                                ) : null}
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>
                    No positions found yet on your top issues for this race.
                  </span>
                )}

                <span style={{ fontSize: 11, color: C.muted, marginTop: "auto" }}>
                  {total === 0
                    ? "Pick issues to see coverage for this race."
                    : `Info found for ${covered} of ${total} of your issues`}
                </span>

                <RustButton
                  onClick={() => router.push(`/hush-guide/${race.id}`)}
                  style={{ padding: "10px 16px", fontSize: 13 }}
                >
                  View Comparison
                </RustButton>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      </div>

      {GUIDE_LEAD === "races" ? <BillsSection bills={bills} /> : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Phase 2 additions -- hero banner, Voting Information
// ---------------------------------------------------------------------------

/**
 * HUSH Guide's hero banner -- a full-bleed U.S. Capitol photograph (dusk,
 * lit dome, one warm accent low in the sky) with a dark scrim behind the
 * title text for legibility. The photo is already monochrome with that one
 * warm accent, so no grayscale/desaturation filter is applied on top of it --
 * a filter would flatten the accent out rather than improve anything.
 * Replaces the flat single-stroke capitol glyph this banner used as a
 * placeholder before a real photograph was licensed for the site.
 */
function GuideHero() {
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
        src="/images/capitol-hero.jpg"
        alt=""
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

function useDaysToElection(): number | null {
  const mounted = useMounted();
  return mounted ? Math.max(0, Math.floor((new Date(ELECTION_ISO).getTime() - Date.now()) / 86400000)) : null;
}

/**
 * The Voting Information section -- registration deadline, early voting
 * window, and mail-ballot request date, plus the countdown. Reuses the same
 * `KEY_DATES`/`ELECTION_ISO` data `ElectionCountdownBanner` draws from
 * (that banner itself is no longer used on this page -- see GuideHero --
 * so the countdown lives in exactly one place here, not two).
 */
/**
 * A scannable summary strip directly under the hero -- the same countdown,
 * key dates, and polling place already detailed further down in Your Voting
 * Plan, plus a race count, condensed into one row so a returning visitor
 * gets the shape of their ballot before scrolling.
 * Replaces the old right-rail VotingInfoSummaryCard, which did a narrower
 * version of this same job tucked into a 280px column.
 *
 * Rendered as one continuous ribbon -- a header rule, then a divider-ruled
 * row of stat columns on `auto-fit` so the columns always stretch to fill
 * the card's full width (never a ragged, partially-empty last row the way
 * wrapped chip tiles could) -- rather than a loose wrap of individually
 * boxed chips.
 */
function GuideAtAGlanceStrip({
  races,
  polling,
  onEditAddress,
  topics,
  representatives,
  onEditIssues,
}: {
  races: Race[];
  polling: { name: string; detail: string };
  onEditAddress: () => void;
  topics: string[];
  representatives: Politician[];
  onEditIssues: () => void;
}) {
  const days = useDaysToElection();
  const { city, state, zip } = usePrefs();
  const cityStateZip = [city, state, zip].filter(Boolean).join(", ").replace(/, ([A-Z]{2}), /, ", $1 ");
  const electionDate = new Date(ELECTION_ISO).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  // "303 N Laura St - 0.6 mi - Open 7am-7pm on election day" -> address +
  // distance. Same "split a seeded delimiter-joined string" pattern as
  // parseRaceTitle in guide.ts; hours (the third segment) isn't used here.
  const [pollingAddress, pollingDistance] = polling.detail.split(" - ");

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          padding: "16px 20px",
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Display size={22}>Your Guide at a Glance</Display>
          <span style={{ fontSize: 12.5, color: C.muted }}>
            Key dates, your polling place, and what&apos;s on your ballot.
          </span>
        </div>
        {cityStateZip ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
            <span style={{ color: C.body }}>{cityStateZip}</span>
            <button
              type="button"
              onClick={onEditAddress}
              className="link-quiet"
              style={{ border: 0, background: "transparent", color: C.rust, cursor: "pointer", padding: 0, fontSize: 12.5 }}
            >
              Change →
            </button>
          </div>
        ) : null}
      </div>

      {/* Body: election-day panel · key dates · action cards */}
      <div className="stack-row" style={{ display: "flex", alignItems: "stretch" }}>
        {/* Election Day panel */}
        <div
          style={{
            flex: "0 0 220px",
            background: C.rustFill,
            color: C.ink,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: C.ink }}>
            Election Day
          </span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: cond, fontSize: 52, lineHeight: 1, color: C.ink }}>
              {days === null ? "—" : days}
            </span>
            <span style={{ fontSize: 13, color: C.ink }}>Days to go</span>
          </div>
          <span style={{ height: 1, background: "rgba(28,25,23,0.16)" }} />
          <span style={{ fontSize: 12, color: C.ink, lineHeight: 1.4 }}>{electionDate}</span>
        </div>

        {/* Your Most Important Issues + Your Representatives -- replaces the
            Register/Early voting/Mail ballot rows. Those three dates still show
            in full in the Voting Plan section further down this page; this
            column now covers the strip's other half -- who's on the ballot and
            what you told HUSH matters to you -- instead of repeating the dates
            a second time. */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", borderLeft: `1px solid ${C.line}` }} className="stack-row">
          {/* Your Most Important Issues */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 7,
              padding: "14px 20px",
              borderBottom: `1px solid ${C.lineSoft}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Kicker>Your Most Important Issues</Kicker>
              <button
                type="button"
                onClick={onEditIssues}
                className="link-quiet"
                style={{ marginLeft: "auto", border: 0, background: "transparent", color: C.rust, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer", padding: 0 }}
              >
                Edit
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {topics.slice(0, 4).map((name, idx) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    minWidth: 0,
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: `${idx === 0 ? 2 : 1.5}px solid ${idx === 0 ? C.rust : C.line}`,
                    background: idx === 0 ? C.rustFill : C.white,
                  }}
                >
                  <span
                    style={{
                      flex: "0 0 auto",
                      fontFamily: cond,
                      fontSize: 12,
                      fontWeight: 700,
                      color: idx === 0 ? C.rust : C.muted,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 12.5,
                      color: C.ink,
                      fontWeight: idx === 0 ? 600 : 400,
                    }}
                  >
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Your Representatives -- the same shared card the Feed's
              orientation strip already uses (RepresentativesCard.tsx), just
              stripped of its own border/radius/background here so it reads as
              this column's second half rather than a card nested inside a
              card. Nothing about the component itself changes, so the Feed's
              version is unaffected. */}
          <RepresentativesCard
            politicians={representatives}
            limit={4}
            style={{ flex: 1, border: "none", borderRadius: 0, background: "transparent", padding: "14px 20px" }}
          />
        </div>

        {/* Polling place + ballot cards */}
        <div style={{ flex: "0 0 260px", display: "flex", flexDirection: "column", borderLeft: `1px solid ${C.line}` }}>
          <a
            href="#voting"
            className="link-quiet"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 18px",
              background: C.shell,
              borderBottom: `1px solid ${C.line}`,
              textDecoration: "none",
            }}
          >
            <GlanceIcon kind="Polling place" size={20} color={C.ink} />
            <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
              <span style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: C.ink }}>
                Your polling place
              </span>
              <span style={{ fontSize: 15, color: C.ink }}>{polling.name}</span>
              <span style={{ fontSize: 11.5, color: C.muted }}>{pollingAddress}</span>
              {pollingDistance ? (
                <span style={{ fontSize: 11.5, color: C.muted }}>{pollingDistance} away</span>
              ) : null}
            </div>
            <span style={{ marginLeft: "auto", color: C.ink }} aria-hidden>→</span>
          </a>
          <a
            href="#races"
            className="link-quiet"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 18px",
              background: C.rustFill,
              textDecoration: "none",
            }}
          >
            <GlanceIcon kind="Ballot" size={20} color={C.rust} />
            <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
              <span style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: C.rust }}>
                Your ballot
              </span>
              <span style={{ fontSize: 15, color: C.ink }}>
                {races.length} Race{races.length === 1 ? "" : "s"} on Your Ballot
              </span>
              <span style={{ fontSize: 11.5, color: C.muted }}>{raceLevelSummary(races)}</span>
            </div>
            <span style={{ marginLeft: "auto", color: C.rust }} aria-hidden>→</span>
          </a>
        </div>
      </div>

    </Card>
  );
}

/**
 * Small hand-drawn line icons for this strip only -- same stroke language
 * as ui.tsx's IssueIcon (16-unit viewBox, 1.4 stroke, round caps) but keyed
 * to concepts this strip needs (registration, early voting, mail ballot,
 * polling place, ballot) rather than the 14 issue topics IssueIcon covers,
 * so it's kept local instead of growing that switch with unrelated cases.
 */
function GlanceIcon({ kind, size = 16, color = C.ink }: { kind: string; size?: number; color?: string }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: color,
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "Register by":
      return (
        <svg {...common} aria-hidden>
          <path d="M4 2.5h6l2 2.2V13.5H4V2.5Z" />
          <path d="M6 7h4M6 9.5h4M6 12h2.5" />
        </svg>
      );
    case "Early voting":
      return (
        <svg {...common} aria-hidden>
          <rect x="2.5" y="3.5" width="11" height="10" rx="1.2" />
          <path d="M2.5 6.5h11M5.2 2v3M10.8 2v3" />
        </svg>
      );
    case "Mail ballot request":
      return (
        <svg {...common} aria-hidden>
          <rect x="2" y="4" width="12" height="8.5" rx="1" />
          <path d="M2.4 4.5 8 9l5.6-4.5" />
        </svg>
      );
    case "Polling place":
      return (
        <svg {...common} aria-hidden>
          <path d="M8 2c-2.2 0-4 1.7-4 4 0 3 4 8 4 8s4-5 4-8c0-2.3-1.8-4-4-4Z" />
          <circle cx="8" cy="6" r="1.4" />
        </svg>
      );
    case "Ballot":
      return (
        <svg {...common} aria-hidden>
          <rect x="3" y="2.5" width="10" height="11" rx="1" />
          <path d="M5.5 6h5M5.5 8.5h5M5.5 11h3" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * A Google Calendar "quick add" link for Election Day -- an all-day event
 * (no timezone math needed) titled with the polling place, location set to
 * its name plus the reader's city/state/zip so the event is still useful
 * without a precise street address. Opened in a new tab the same way
 * "Check my registration" already is -- no ICS file, no backend, consistent
 * with every other external hand-off on this page.
 */
function calendarHref(polling: { name: string }, cityStateZip: string): string {
  const start = "20261103";
  const end = "20261104"; // Google's all-day `dates` end date is exclusive.
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Election Day - Vote",
    dates: `${start}/${end}`,
    details: `Polling place: ${polling.name}`,
    location: `${polling.name}, ${cityStateZip}`.trim(),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function directionsHref(polling: { name: string }, cityStateZip: string): string {
  const destination = `${polling.name}, ${cityStateZip}`.trim();
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function VotingInformationSection({ polling }: { polling: { name: string; detail: string } }) {
  const days = useDaysToElection();
  const { city, state, zip } = usePrefs();
  const cityStateZip = [city, state, zip].filter(Boolean).join(" ");
  // Real chronological order for the timeline below -- KEY_DATES itself
  // stays in its existing "Register / Early voting / Mail ballot" order
  // (used elsewhere in the app), this just walks through it plus Election
  // Day at the end, where it actually falls.
  const timelinePoints: { label: string; value: string }[] = [...KEY_DATES, { label: "Election Day", value: "Nov 3" }];
  return (
    <section id="voting" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Kicker>Your Voting Plan</Kicker>
        <Display size={22}>Key dates</Display>
      </div>
      <Card className="stack-row" style={{ padding: 20, display: "flex", gap: 24, alignItems: "stretch" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: cond, fontSize: 28, lineHeight: 1, color: C.ink }}>
              {days === null ? "—" : days}
            </span>
            <span style={{ fontSize: 13, color: C.body }}>days until Election Day</span>
          </div>

          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span
              aria-hidden
              style={{ position: "absolute", top: 5, left: 6, right: 6, height: 2, background: C.line }}
            />
            {/*
              Dots alternate rust/ink purely by position -- a two-tone
              cadence along the line rather than one color singling out
              "today" the way this timeline used to (only Election Day was
              rust). Election Day still reads as the finish line: it's the
              last stop after the line ends. (Was rust/faded-blue before
              brand-tokens-v2 Phase 2 retired blue from general UI.)
            */}
            {timelinePoints.map((k, idx) => (
              <div
                key={k.label}
                style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6, flex: 1, maxWidth: 150 }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: idx % 2 === 0 ? C.rust : C.ink,
                    border: `2px solid ${C.white}`,
                  }}
                />
                <span style={{ fontSize: 14 }}>{k.value}</span>
                <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.3 }}>{k.label}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <RustButton
              style={{ padding: "10px 16px", fontSize: 13 }}
              onClick={() => window.open("https://www.vote.org/am-i-registered-to-vote/", "_blank", "noopener")}
            >
              Check my registration
            </RustButton>
            <GhostButton
              style={{ padding: "10px 16px", fontSize: 13 }}
              onClick={() => window.open(calendarHref(polling, cityStateZip), "_blank", "noopener")}
            >
              + Add to calendar
            </GhostButton>
          </div>
        </div>

        {/*
          A compact "where you vote" companion at the timeline's far end,
          stretched to the full height of the card (the parent Card's
          `alignItems: "stretch"` does that automatically) now that it's the
          column's only element -- this used to sit under a full "Polling
          Place" section with a map and address-lookup form, but that was
          showing the same address a third time on one page; this box plus
          Get directions is enough to act on Election Day without it.
        */}
        <div
          style={{
            flex: "0 0 220px",
            minWidth: 200,
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            background: C.shell,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <Kicker size={10}>Where you vote</Kicker>
          <span style={{ fontSize: 16, lineHeight: 1.2 }}>{polling.name}</span>
          <span style={{ fontSize: 11.5, color: C.body, lineHeight: 1.4 }}>{polling.detail}</span>
          <button
            type="button"
            className="link-quiet"
            onClick={() => window.open(directionsHref(polling, cityStateZip), "_blank", "noopener")}
            style={{
              marginTop: "auto",
              alignSelf: "flex-start",
              border: 0,
              background: "transparent",
              color: C.rust,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Get directions →
          </button>
        </div>
      </Card>
    </section>
  );
}
