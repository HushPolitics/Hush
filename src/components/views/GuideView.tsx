"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { issueCoverage, parseRaceTitle } from "@/lib/guide";
import type { Bill, IssuePosition, Politician, Race } from "@/lib/types";
import { Card, Chip, Display, EmptyState, GhostButton, Kicker, RustButton } from "@/components/ui";
import { BillsSection } from "./GuideBills";

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
 * HUSH Guide's own three-step flow (address -> issues -> tile grid), gated
 * on `guideIssues` rather than a separate "setup done" flag: an empty array
 * means the user hasn't been through setup, so /hush-guide opens on step
 * one; once populated, it opens straight on the tile grid. `manualStep` overrides
 * that default once the user navigates on purpose (Edit address / Edit
 * issues from the grid, or Continue/Back between steps) — see the render
 * below for how each step's actions clear or set it.
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
  const { guideIssues } = usePrefs();
  const [manualStep, setManualStep] = useState<Step | null>(null);
  const hasGuide = guideIssues.length > 0;
  const step: Step = manualStep ?? (hasGuide ? "grid" : "address");

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      {step === "address" ? (
        <AddressStep
          hasGuide={hasGuide}
          onCancel={hasGuide ? () => setManualStep("grid") : undefined}
          onContinue={() => setManualStep(hasGuide ? "grid" : "issues")}
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
              placeholder="Austin"
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
              placeholder="TX"
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
              placeholder="78701"
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
 * own setup flow and Stance Check's empty-`guideIssues` gate — both features
 * read and write the same `guideIssues` list, so there is deliberately one
 * picker rather than two. `kicker`/`title`/`description`/`continueLabel`
 * default to HUSH Guide's own copy (and `onBack` defaults to hidden), so
 * HUSH Guide's call site below needs no changes; a caller that wants
 * different wording (Stance Check) passes its own strings instead of
 * branching on `hasGuide` here.
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
  const { guideIssues, toggleGuideIssue } = usePrefs();
  const [capNote, setCapNote] = useState(false);

  function handleToggle(name: string) {
    if (!guideIssues.includes(name) && guideIssues.length >= MAX_GUIDE_ISSUES) {
      setCapNote(true);
      return;
    }
    setCapNote(false);
    toggleGuideIssue(name);
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
              positions on each one you choose — this is separate from the ranked issues that
              drive Value Match elsewhere in the app, so picking issues here doesn&apos;t change
              your match scores.
            </>
          )}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: cond, fontSize: 15, color: C.ink }}>
          {guideIssues.length}/{MAX_GUIDE_ISSUES} selected
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {topicPool.map((name) => (
          <Chip key={name} on={guideIssues.includes(name)} onClick={() => handleToggle(name)}>
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
          onClick={() => guideIssues.length > 0 && onContinue()}
          style={{ flex: 1, opacity: guideIssues.length === 0 ? 0.5 : 1, cursor: guideIssues.length === 0 ? "not-allowed" : "pointer" }}
        >
          {continueLabel ?? (hasGuide ? "Save & view guide" : "Generate my guide")}
        </RustButton>
      </div>
      {guideIssues.length === 0 ? (
        <span style={{ fontSize: 12, color: C.muted }}>Select at least one issue to continue.</span>
      ) : null}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Tile grid
// ---------------------------------------------------------------------------

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
  const { streetAddress, city, state, zip, guideIssues } = usePrefs();
  const knownIds = new Set(politicians.map((p) => p.id));

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Kicker>HUSH Guide</Kicker>
        <Display size={25}>Your ballot, by the issues you picked</Display>
      </div>

      <div
        className="stack-row"
        style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}
      >
        <Card
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
              Your {guideIssues.length} issue{guideIssues.length === 1 ? "" : "s"}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {guideIssues.map((i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 12,
                    background: C.shell,
                    color: C.body,
                    whiteSpace: "nowrap",
                  }}
                >
                  {i}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="link-quiet"
            onClick={onEditIssues}
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
            Edit issues
          </button>
        </Card>
      </div>

      {/*
        RACES has 6 entries seeded (U.S. House, U.S. Senate, Mayor, State
        Senate, County Judge, School Board), all for the same Austin/Travis
        County sample ballot BallotView and CompareView already use — there's
        no real address-to-ballot lookup behind it yet, so every address
        shows the same six races. The seed dataset still has no Governor,
        State House, or County Commission race with a full candidate roster
        — those tile types are left out rather than invented. See
        seed-data.ts.
      */}
      <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
        Showing the {races.length} races in Hush&apos;s seed dataset for this sample ballot —
        this prototype doesn&apos;t have real address-based ballot lookup yet, and the seed data
        still doesn&apos;t include every race type (no Governor, State House, or County
        Commission race with a full candidate list yet).
      </span>

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
            const { covered, total } = issueCoverage(race, guideIssues, positions);
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

                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {race.candidates.map((c) =>
                    knownIds.has(c.politicianId) ? (
                      <Link
                        key={c.politicianId}
                        href={`/politician/${c.politicianId}`}
                        style={{ fontSize: 13, color: C.navy }}
                      >
                        {c.name}
                      </Link>
                    ) : (
                      <span key={c.politicianId} style={{ fontSize: 13, color: C.body }}>
                        {c.name}
                      </span>
                    ),
                  )}
                </div>

                <span style={{ fontSize: 12, color: total > 0 && covered === 0 ? C.rust : C.muted }}>
                  {total === 0
                    ? "Pick issues to see coverage for this race."
                    : covered === 0
                      ? "No sourced positions found yet for your selected issues."
                      : `Info found for ${covered} of ${total} of your issues`}
                </span>

                <RustButton
                  onClick={() => router.push(`/hush-guide/${race.id}`)}
                  style={{ marginTop: 4, padding: "10px 16px", fontSize: 13 }}
                >
                  View Comparison
                </RustButton>
              </Card>
            );
          })}
        </div>
      )}

      <BillsSection bills={bills} />
    </>
  );
}
