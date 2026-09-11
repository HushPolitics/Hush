"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { C, PARTY, PARTY_LABEL, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { useMounted } from "@/lib/hooks";
import { ELECTION_ISO, KEY_DATES } from "@/lib/seed-data";
import { ballotPoliticianIds } from "@/lib/feed";
import { issueCoverage, parseRaceTitle, stripPartySuffix, topRankedIssueForRace } from "@/lib/guide";
import { useRegisterRailFooter, useRegisterSectionNav } from "@/lib/sectionNav";
import type { Bill, IssuePosition, Politician, Race } from "@/lib/types";
import { Card, Chip, Display, EmptyState, ExpandableQuote, GhostButton, Kicker, RustButton } from "@/components/ui";
import RepresentativesCard from "@/components/RepresentativesCard";
import { BillsSection } from "./GuideBills";

/**
 * HUSH Guide's section-nav list, in the sidebar contextual-nav brief's
 * specified order — always this order regardless of whether `GUIDE_LEAD`
 * puts Bills before or after the races grid in the DOM below.
 *
 * "Your address" isn't in this list -- app-layout-v2 phase 2 moved it out
 * of the jump list entirely and into the rail's footer (see
 * `useRegisterRailFooter` below), since it's a short standing fact about
 * the reader rather than a section of the page to scroll to.
 */
const GUIDE_SECTIONS = [
  { id: "issues", label: "Your issues" },
  { id: "voting", label: "Voting information" },
  { id: "bills", label: "Bills being considered" },
  { id: "races", label: "Your races" },
];

const fieldStyle = {
  padding: "11px 14px",
  border: "1px solid rgba(21,21,21,0.2)",
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
 * they've ranked something. `IssuesStep` stays in place for the grid's
 * "Edit issues" action (topics already non-empty) and for Stance Check's own
 * gate, both unchanged.
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
          onEditIssues={() => setManualStep("issues")}
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
        <span style={{ fontFamily: cond, fontSize: 15, color: C.ink }}>
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
 * legislature. Nothing else about either section changes based on this.
 */
const GUIDE_LEAD: "bills" | "races" = "bills";

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
  const { streetAddress, city, state, zip, topics, polling } = usePrefs();
  const knownIds = new Set(politicians.map((p) => p.id));
  const ballotIds = useMemo(() => ballotPoliticianIds(races), [races]);
  const ballotPoliticians = useMemo(
    () => politicians.filter((p) => ballotIds.has(p.id)),
    [politicians, ballotIds],
  );

  // Only registered while the grid is actually showing -- address/issues
  // onboarding steps render a different `Step` entirely (see GuideView's
  // top-level switch), so there's nothing to jump to from the sidebar then.
  useRegisterSectionNav(GUIDE_SECTIONS);

  // Phase 2 moved the address out of the jump list and into the rail's own
  // footer -- a short standing fact about the reader, not a section to
  // scroll to. Memoized on the fields it actually depends on so the rail
  // doesn't re-register on every unrelated render.
  const addressFooter = useMemo(
    () => (
      <AddressRailFooter
        streetAddress={streetAddress}
        city={city}
        state={state}
        zip={zip}
        onEdit={onEditAddress}
      />
    ),
    [streetAddress, city, state, zip, onEditAddress],
  );
  useRegisterRailFooter(addressFooter);

  return (
    <>
      <GuideHero />

      <GuideAtAGlanceStrip races={races} polling={polling} />

      <div
        className="stack-row"
        style={{ display: "flex", gap: 20, alignItems: "stretch" }}
      >
        <Card id="issues" style={{ flex: 2, minWidth: 0, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <Kicker>Your priorities</Kicker>
              <span style={{ fontSize: 11, color: C.muted }}>
                {topics.length} issue{topics.length === 1 ? "" : "s"}, ranked
              </span>
              {/*
                Both edits happen in place -- this swaps `manualStep` rather
                than navigating, so the grid is still one page.
              */}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <Link
                  href="/profile/top-issues/issue-finder?next=/hush-guide"
                  className="link-quiet"
                  style={{ color: C.muted, fontSize: 12 }}
                >
                  Try Issue Finder →
                </Link>
                <button
                  type="button"
                  className="link-quiet"
                  onClick={onEditIssues}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: C.navy,
                    fontSize: 12,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    padding: 6,
                  }}
                >
                  Edit issues
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 8 }}>
              {topics.map((name, idx) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: idx === 0 ? C.shell : "transparent",
                    border: `1px solid ${idx === 0 ? C.rust : C.line}`,
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      flex: "0 0 22px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: cond,
                      fontSize: 11,
                      fontWeight: 600,
                      background: idx === 0 ? C.rust : C.slateFill,
                      color: idx === 0 ? C.white : C.slate,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: C.ink }}>{name}</span>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ flex: 1, minWidth: 240 }}>
            <RepresentativesCard politicians={ballotPoliticians} />
          </div>
        </div>

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
        <Display size={20} style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.01em" }}>
          Your Races
        </Display>
        <span style={{ fontSize: 13, color: C.body }}>
          See where the candidates on your ballot stand on the issues you care about.
        </span>
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
                    background: C.slateFill,
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
                    <span style={{ fontSize: 11, color: C.rust, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Your #{top.rank} issue: {top.issue}
                    </span>

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
                              <span
                                style={{ width: 7, height: 7, borderRadius: "50%", background: PARTY[c.party], flex: "0 0 7px" }}
                              />
                              {nameEl}
                              <span style={{ fontSize: 11, color: C.muted }}>{PARTY_LABEL[c.party]}</span>
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
                                  style={{ color: C.navy }}
                                >
                                  Source
                                </a>
                                {pos.date ? <span>· {pos.date}</span> : null}
                                {knownIds.has(c.politicianId) ? (
                                  <>
                                    <span>·</span>
                                    <Link href={`/politician/${c.politicianId}#positions`} style={{ color: C.navy }}>
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
// Phase 2 additions -- hero banner, rail-footer address, Voting Information
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
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <img
        src="/images/capitol-hero.jpg"
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
      <div
        style={{
          position: "relative",
          padding: "22px 26px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <Kicker color={C.tan}>HUSH Guide</Kicker>
        <Display size={28} color={C.sand}>
          Your ballot, by the issues you picked
        </Display>
      </div>
    </div>
  );
}

/**
 * The rail-footer address readout -- see GUIDE_SECTIONS' doc comment and
 * AppShell's `railFooter` slot. Deliberately plain: a standing fact plus one
 * edit action, not a card, since it's rendered inside the rail's own
 * `<aside>` padding rather than the main content column.
 */
function AddressRailFooter({
  streetAddress,
  city,
  state,
  zip,
  onEdit,
}: {
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  onEdit: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "10px 10px 4px",
        marginTop: 6,
        borderTop: `1px solid ${C.line}`,
      }}
    >
      <span style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Address
      </span>
      <span style={{ fontSize: 12, color: C.ink, lineHeight: 1.4 }}>
        {streetAddress ? `${streetAddress}, ` : ""}
        {city}, {state} {zip}
      </span>
      <button
        type="button"
        onClick={onEdit}
        style={{
          alignSelf: "flex-start",
          border: 0,
          background: "transparent",
          color: C.navy,
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          cursor: "pointer",
          padding: 0,
        }}
      >
        Edit address
      </button>
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
function GuideAtAGlanceStrip({ races, polling }: { races: Race[]; polling: { name: string; detail: string } }) {
  const days = useDaysToElection();
  const tiles: { value: string; label: string; href?: string }[] = [
    { value: days === null ? "—" : String(days), label: "days until Election Day" },
    ...KEY_DATES.map((k) => ({ value: k.value, label: k.label })),
    { value: polling.name, label: "your polling place", href: "#voting" },
    {
      value: String(races.length),
      label: `race${races.length === 1 ? "" : "s"} on your ballot`,
      href: "#races",
    },
  ];
  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          padding: "13px 20px",
          background: C.shell,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <Kicker>Your guide at a glance</Kicker>
        <span style={{ height: 1, flex: 1, background: C.line }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {tiles.map((t, idx) => (
          <GlanceTile key={t.label} value={t.value} label={t.label} href={t.href} lead={idx === 0} />
        ))}
      </div>
    </Card>
  );
}

function GlanceTile({
  value,
  label,
  href,
  lead,
}: {
  value: string;
  label: string;
  href?: string;
  lead?: boolean;
}) {
  const style: CSSProperties = {
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 3,
    textDecoration: "none",
    color: "inherit",
    borderLeft: lead ? "none" : `1px solid ${C.line}`,
  };
  const inner = (
    <>
      <span style={{ fontFamily: cond, fontSize: 25, lineHeight: 1.1, color: lead ? C.rust : C.slate }}>
        {value}
      </span>
      {/*
        `capitalize` (not hardcoded per-label strings) so every label reads
        as a title -- "Days Until Election Day", "Your Polling Place" -- for
        this strip's own seeded labels and for KEY_DATES' labels (owned by
        seed-data.ts, used elsewhere in their own lowercase form) alike.
      */}
      <span style={{ fontSize: 11.5, color: C.body, lineHeight: 1.3, textTransform: "capitalize" }}>{label}</span>
    </>
  );
  return href ? (
    <a href={href} className="link-quiet" style={style}>
      {inner}
    </a>
  ) : (
    <div style={style}>{inner}</div>
  );
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
        <Display size={22}>Key dates so you're ready</Display>
      </div>
      <Card className="stack-row" style={{ padding: 20, display: "flex", gap: 24, alignItems: "stretch" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: cond, fontSize: 28, lineHeight: 1, color: C.slate }}>
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
              Dots alternate rust/faded-blue purely by position -- a two-tone
              cadence along the line rather than one color singling out
              "today" the way this timeline used to (only Election Day was
              rust). Election Day still reads as the finish line: it's the
              last stop after the line ends.
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
                    background: idx % 2 === 0 ? C.rust : C.slate,
                    border: `2px solid ${C.white}`,
                  }}
                />
                <span style={{ fontFamily: cond, fontSize: 14 }}>{k.value}</span>
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
          <span style={{ fontFamily: cond, fontSize: 16, lineHeight: 1.2 }}>{polling.name}</span>
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
