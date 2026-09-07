"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { C, PARTY, PARTY_LABEL, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { issueCoverage, parseRaceTitle, stripPartySuffix, topRankedIssueForRace } from "@/lib/guide";
import { useRegisterSectionNav } from "@/lib/sectionNav";
import type { Bill, IssuePosition, Politician, Race } from "@/lib/types";
import { Card, Chip, Display, EmptyState, ExpandableQuote, GhostButton, Kicker, RustButton } from "@/components/ui";
import ElectionCountdownBanner from "@/components/ElectionCountdownBanner";
import PollingPlaceCard from "@/components/PollingPlaceCard";
import { BillsSection } from "./GuideBills";

/**
 * HUSH Guide's section-nav list, in the sidebar contextual-nav brief's
 * specified order — always this order regardless of whether `GUIDE_LEAD`
 * puts Bills before or after the races grid in the DOM below.
 */
const GUIDE_SECTIONS = [
  { id: "address", label: "Your address" },
  { id: "issues", label: "Your issues" },
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
          href="/profile/top-issues/start"
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
  const { streetAddress, city, state, zip, topics } = usePrefs();
  const knownIds = new Set(politicians.map((p) => p.id));

  // Only registered while the grid is actually showing -- address/issues
  // onboarding steps render a different `Step` entirely (see GuideView's
  // top-level switch), so there's nothing to jump to from the sidebar then.
  useRegisterSectionNav(GUIDE_SECTIONS);

  return (
    <>
      <ElectionCountdownBanner />

      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Kicker>HUSH Guide</Kicker>
        <Display size={25}>Your ballot, by the issues you picked</Display>
      </div>

      <div
        className="stack-row"
        style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}
      >
        <Card
          id="address"
          style={{
            flex: 1,
            minWidth: 260,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Address
            </span>
            <span style={{ fontSize: 13, color: C.ink }}>
              {streetAddress ? `${streetAddress}, ` : ""}
              {city}, {state} {zip}
            </span>
          </div>
          <button
            type="button"
            className="link-quiet"
            onClick={onEditAddress}
            style={{
              marginLeft: "auto",
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
            Edit address
          </button>
        </Card>

        <Card
          id="issues"
          style={{
            flex: 1,
            minWidth: 260,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Your {topics.length} issue{topics.length === 1 ? "" : "s"}, ranked
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {topics.map((i, idx) => (
                <span
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 12,
                    background: C.shell,
                    color: C.body,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontFamily: cond, color: C.faint }}>{idx + 1}</span>
                  {i}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            {/*
              Both edits happen in place -- this swaps `manualStep` rather
              than navigating, so the grid is still one page. "Try Issue
              Finder" is new: it used to be reachable only after clicking
              Edit issues into IssuesStep below; per the top-bar brief it
              needs to be visible here directly, not one click deeper.
            */}
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
        </Card>
      </div>

      <PollingPlaceCard />

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
                style={{
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontFamily: cond, fontSize: 19, lineHeight: 1.15 }}>{office}</span>
                  {district ? (
                    <span style={{ fontSize: 12, color: C.muted }}>{district}</span>
                  ) : null}
                </div>

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
                            style={{ fontSize: 13, color: C.navy, fontWeight: 600 }}
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
