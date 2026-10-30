"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { C, cond } from "@/lib/theme";
import { versionedAsset } from "@/lib/assetVersion";
import { usePrefs, type PollingPlace } from "@/lib/prefs";
import { createClient } from "@/lib/supabase/client";
import { syncOnboardingToSupabase } from "@/lib/supabase/profile";
import { useMounted } from "@/lib/hooks";
import { ELECTION_ISO, KEY_DATES } from "@/lib/app-content";
import { ballotPoliticianIds } from "@/lib/feed";
import {
  issueCoverage,
  parseRaceTitle,
  raceLevelSummary,
  stripPartySuffix,
} from "@/lib/guide";
import type { Bill, IssuePosition, Politician, Race } from "@/lib/types";
import { Card, Chip, Display, EmptyState, GhostButton, Kicker, RustButton } from "@/components/ui";
import RepresentativesCard from "@/components/RepresentativesCard";
import AddressLookup from "@/components/AddressLookup";
import { resolveAddress } from "@/app/actions/location";
import { lookupPollingPlace, type PollingLookupResult } from "@/app/actions/polling";
import { filterRaces, lacksLocalRaces, scopeReasonFor } from "@/lib/ballot-scope";
import BallotGapNote from "@/components/BallotGapNote";
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

type Step = "welcome" | "address" | "issues" | "grid";

/**
 * HUSH Guide's own flow. Gated on `topics` plus `guideSetupDone` (see
 * prefs.tsx): ranked issues alone no longer mean setup is done, because the
 * signup wizard ranks issues before the Guide is ever opened. Until setup is
 * done, /hush-guide opens on the address step; once done, it opens straight
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
  const {
    topics,
    guideSetupDone,
    setGuideSetupDone,
    onboarded,
    setOnboarded,
    firstName,
    lastName,
    streetAddress,
    city,
    state,
  } = usePrefs();
  const [manualStep, setManualStep] = useState<Step | null>(null);
  // Brand-new accounts arrive on `?welcome=1` (from signup, or from the
  // email-confirmation link) and see a one-time welcome card before the
  // address step. Read from the URL after mount rather than with
  // useSearchParams, which would force this statically generated page to
  // opt out of caching. `null` = not read yet.
  const [welcome, setWelcome] = useState<boolean | null>(null);
  useEffect(() => {
    setWelcome(new URLSearchParams(window.location.search).get("welcome") === "1");
  }, []);
  const hasGuide = topics.length > 0;
  // Setup counts as finished only when issues are ranked AND the person has
  // been through the Guide's own address step.
  const setupDone = hasGuide && guideSetupDone;
  const step: Step = manualStep ?? (setupDone ? "grid" : welcome ? "welcome" : "address");

  // The first time the grid shows for an account that hasn't been marked
  // onboarded, setup is finished from the person's side. Mark that locally
  // right away (it must not depend on the account sync below succeeding), then
  // make a best-effort save of what Guide setup collected. Signup no longer
  // does this: it only creates the account.
  useEffect(() => {
    if (step !== "grid" || onboarded) return;
    setOnboarded(true);
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      void syncOnboardingToSupabase({
        firstName,
        lastName,
        streetAddress,
        city,
        state,
        rankedTopics: topics,
        markOnboarded: true,
      });
    });
    // Only when the grid first appears or onboarding flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, onboarded]);

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      {welcome === null && !setupDone ? null : step === "welcome" ? (
        <WelcomeStep
          onStart={() => {
            // Drop `?welcome=1` so a refresh doesn't replay the welcome.
            window.history.replaceState(null, "", window.location.pathname);
            setWelcome(false);
          }}
        />
      ) : step === "address" ? (
        <AddressStep
          hasGuide={setupDone}
          onCancel={setupDone ? () => setManualStep("grid") : undefined}
          onContinue={() => {
            // Marked done here, before any hand-off, because Step 2 lives on
            // another route (the shared My Top Issues editor) and the person
            // lands back on this page via `?next=` — by then the flag has to
            // already be set or they'd loop back to Step 1.
            setGuideSetupDone(true);
            if (setupDone) {
              // Manual "Edit address" visit, not first-time setup: stay
              // in-page and go straight to the grid, same as before.
              setManualStep("grid");
            } else {
              // First-time setup: straight to the shared ranking editor, which
              // sends the person back here via `?next=` once they've ranked
              // something. (Its bottom link still offers Issue Finder.)
              router.push("/profile/top-issues?next=/hush-guide");
            }
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
// Welcome — shown once to a brand-new account, before the address step
// ---------------------------------------------------------------------------

function WelcomeStep({ onStart }: { onStart: () => void }) {
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
        <Kicker>Welcome</Kicker>
        <span style={{ height: 1, flex: 1, background: C.line }} />
      </div>
      <span style={{ fontFamily: cond, fontSize: 28 }}>Welcome to your HUSH. Guide</span>
      <span style={{ fontSize: 14, color: C.body, lineHeight: 1.6 }}>
        Here&apos;s where you&apos;ll get unbiased, transparent voting information about your ballot.
        Start by entering your address and the political issues you care about. We&apos;ll sort
        through every race for your district and show you where your candidates line up on the
        issues that matter most to you.
      </span>
      <span style={{ fontSize: 14, color: C.body, lineHeight: 1.6 }}>
        Each position comes directly from the candidate&apos;s own website or words. If anything
        comes from another source, we&apos;ll say so. Every position links to where it came from, so
        you can check it yourself. And where we couldn&apos;t find a candidate&apos;s own words, we tell
        you that instead of guessing.
      </span>
      <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
        HUSH. is an early release through the election. If something looks wrong or missing, use
        the Beta tab in the corner and tell us. We read every note.
      </span>
      <RustButton onClick={onStart} style={{ alignSelf: "flex-start" }}>
        Get started →
      </RustButton>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Address
// ---------------------------------------------------------------------------

/**
 * A polling lookup result in the shape the prefs store keeps. A failed lookup
 * is stored as "not checked" (no `checkedAt`) so the Guide asks again
 * rather than claiming the county has nothing published.
 */
function toPollingPlace(r: PollingLookupResult): PollingPlace {
  if (!r.ok) return { name: "", detail: "" };
  const site = r.electionDay;
  return {
    name: site ? site.name || "Your polling place" : "",
    detail: site?.address ?? "",
    hours: site?.hours || undefined,
    early: r.early.length > 0 ? r.early : undefined,
    lookupUrl: r.lookupUrl ?? undefined,
    earlyWindow: r.earlyWindow ?? undefined,
    precinct: r.precinct ?? undefined,
    diag: r.diag,
    // When Google was down the answer is "unknown", so look again soon (next
    // visit after 15 minutes) rather than waiting out the full 24 hours.
    checkedAt: r.unavailable ? Date.now() - POLLING_MAX_AGE_MS + 15 * 60 * 1000 : Date.now(),
    unavailable: r.unavailable ? true : undefined,
  };
}

function AddressStep({
  hasGuide,
  onCancel,
  onContinue,
}: {
  hasGuide: boolean;
  onCancel?: () => void;
  onContinue: () => void;
}) {
  const {
    streetAddress,
    city,
    state,
    zip,
    setStreetAddress,
    setCity,
    setState,
    setZip,
    setResolvedLocation,
    clearResolvedLocation,
    setPolling,
  } = usePrefs();
  // Held while an address can't be matched to districts, so "Continue without
  // my ballot" still keeps the polling place if that part did work.
  const [heldPolling, setHeldPolling] = useState<PollingPlace | null>(null);
  const [draftStreet, setDraftStreet] = useState(streetAddress);
  const [draftCity, setDraftCity] = useState(city);
  const [draftState, setDraftState] = useState(state);
  const [draftZip, setDraftZip] = useState(zip);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function saveTypedFields() {
    setStreetAddress(draftStreet.trim());
    if (draftCity.trim()) setCity(draftCity.trim());
    if (draftState.trim()) setState(draftState.trim().toUpperCase().slice(0, 2));
    if (draftZip.length === 5) setZip(draftZip);
  }

  // Looks the typed address up and keeps what it resolves to: the districts,
  // which scope "Your Races" and the ballot measures to this voter, and the
  // polling place and early voting sites. A street address is required
  // because a ZIP crosses district lines, so there is nothing reliable to
  // look up without one. The two lookups run side by side; a polling failure
  // never blocks the districts.
  function submit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    const street = draftStreet.trim();
    if (!street) {
      setError("Enter your street address to continue. A ZIP code alone can't tell us which races are yours.");
      return;
    }

    const query = [
      street,
      draftCity.trim(),
      [draftState.trim().toUpperCase(), draftZip.length === 5 ? draftZip : ""].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(", ");

    start(async () => {
      const [res, pollingRes] = await Promise.all([
        resolveAddress(query),
        lookupPollingPlace(query).catch((): PollingLookupResult => ({ ok: false, reason: "error" })),
      ]);
      const polling = toPollingPlace(pollingRes);
      if (res.ok) {
        setStreetAddress(street);
        setResolvedLocation({
          matchedAddress: res.matchedAddress,
          city: res.city ?? "",
          state: res.state ?? "",
          zip: res.zip ?? "",
          districtIds: res.districts.map((d) => d.id),
        });
        setPolling(polling);
        onContinue();
        return;
      }
      setHeldPolling(polling);
      // Different failures call for different sentences; see resolveAddress.
      setError(
        res.reason === "not_found"
          ? "We couldn't find that address. Check the street number and spelling, and include the city or ZIP."
          : res.reason === "no_districts"
            ? "We found that address, but we haven't loaded district boundaries for it yet. Right now that means Florida only."
            : "Address lookup isn't available right now.",
      );
    });
  }

  // Lets someone move on even when the lookup can't place them. Your Races
  // then shows the address prompt rather than a guess.
  function continueWithoutLookup() {
    clearResolvedLocation();
    saveTypedFields();
    setPolling(heldPolling ?? { name: "", detail: "" });
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
        <Kicker>{hasGuide ? "Edit address" : "Step 1 of 2 · HUSH. Guide"}</Kicker>
        <span style={{ height: 1, flex: 1, background: C.line }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontFamily: cond, fontSize: 24 }}>Confirm your address</span>
        <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
          HUSH. Guide uses your street address to find the districts you live in, so it can show
          only the races on your ballot. A ZIP code alone isn&apos;t enough, because ZIP codes and
          voting districts don&apos;t share boundaries. It&apos;s the same address shown in the
          location pill at the top of the app, so anything you change here changes it everywhere
          else too.
        </span>
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={labelStyle}>
          Street address
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

        {error ? (
          <span role="alert" style={{ fontSize: 12.5, color: C.rust, lineHeight: 1.5 }}>
            {error}
          </span>
        ) : null}

        <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
          <RustButton type="submit" style={{ flex: 1, opacity: pending ? 0.6 : 1 }}>
            {pending ? "Finding your ballot…" : "Continue"}
          </RustButton>
          {error && heldPolling ? <GhostButton onClick={continueWithoutLookup}>Continue without my ballot</GhostButton> : null}
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
        <Kicker>{kicker ?? (hasGuide ? "Edit issues" : "Step 2 of 2 · HUSH. Guide")}</Kicker>
        <span style={{ height: 1, flex: 1, background: C.line }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontFamily: cond, fontSize: 24 }}>{title}</span>
        <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
          {description ?? (
            <>
              Pick up to {MAX_GUIDE_ISSUES} issues. HUSH. Guide researches sourced candidate
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
  races: allRaces,
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
  const { topics, polling, districtIds, state, matchedAddress, setPolling } = usePrefs();

  // Look the polling place up again when what's stored is over 24 hours old (or
  // was never looked up, e.g. an address saved before this existed). A failed
  // refresh clears the old value rather than keeping data past its limit.
  // Once per page load, so a failing lookup can't loop.
  const refreshedPolling = useRef(false);
  const pollingCheckedAt = polling.checkedAt;
  useEffect(() => {
    const age = pollingCheckedAt ? Date.now() - pollingCheckedAt : Infinity;
    if (refreshedPolling.current || !matchedAddress || age < POLLING_MAX_AGE_MS) return;
    if (Date.now() > new Date(ELECTION_ISO).getTime() + 86400000) return;
    refreshedPolling.current = true;
    lookupPollingPlace(matchedAddress)
      .then((r) => setPolling(toPollingPlace(r)))
      .catch(() => setPolling({ name: "", detail: "" }));
  }, [matchedAddress, pollingCheckedAt, setPolling]);
  const knownIds = new Set(politicians.map((p) => p.id));

  // Only the races this address votes in. Unlike the Ballot and Feed pages,
  // which show everything until an address is given, the Guide shows nothing
  // until it has one: "Your Races" should never list races that aren't yours.
  // Races with no district attached are dropped too. Elsewhere they are kept
  // so a gap in our data can't hide a real race, but here they would put
  // races on a ballot that may not be this voter's.
  const located = districtIds.length > 0;
  const races = useMemo(() => {
    if (!located) return [];
    const scope = { districtIds, stateCode: state };
    return filterRaces(allRaces, scope).filter((r) => scopeReasonFor(r, scope) !== "unknown-district");
  }, [allRaces, located, districtIds, state]);
  const ballotIds = useMemo(() => ballotPoliticianIds(races), [races]);

  // The ballot measures are Florida's constitutional amendments, so they show
  // only for an address that resolved in Florida. Everyone else sees why the
  // section is empty rather than another state's amendments.
  const measures = located && state.toUpperCase() === "FL" ? bills : [];
  const measuresEmpty = located
    ? "We haven't loaded the ballot measures for your state yet."
    : "Add your address and the measures you'll vote on will show up here.";
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
        located={located}
        polling={polling}
        onEditAddress={onEditAddress}
        topics={topics}
        representatives={ballotPoliticians}
        onEditIssues={onEditIssues}
      />

      <VotingInformationSection polling={polling} />

        {GUIDE_LEAD === "bills" ? <BillsSection bills={measures} emptyMessage={measuresEmpty} /> : null}

          {/*
        Your Races is scoped to the saved address. The address step resolves
        it to districts (resolveAddress) and `races` above keeps only the races
        in those districts plus the statewide seats for the address's state.
        With no resolved address the section asks for one instead of listing
        everything.
      */}

      <div id="races" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Kicker>Your Races</Kicker>
        <Display size={22}>See where candidates stand on your issues</Display>
      </div>
      <AddressLookup changeLabel="Change address" />
      {located && races.length > 0 && lacksLocalRaces(allRaces, { districtIds, stateCode: state }) ? <BallotGapNote /> : null}
      {!located ? (
        <EmptyState>
          Enter your street address above and your races will show up here. Until then we
          don&apos;t know which ones are yours.
        </EmptyState>
      ) : races.length === 0 ? (
        <EmptyState>
          We found your districts, but don&apos;t have any races loaded for them yet.
        </EmptyState>
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
                    background: C.ink,
                  }}
                >
                  <span style={{ fontFamily: cond, fontSize: 19, lineHeight: 1.15, color: C.onDark }}>{office}</span>
                  {district ? (
                    <span style={{ fontSize: 12, color: C.rust, display: "block" }}>{district}</span>
                  ) : null}
                </div>
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1, background: C.white }}>
                {/* The candidate list renders whether or not anyone has a
                    sourced position.

                    It used to sit inside `{top ? ... }`, and `top` is undefined
                    until some candidate has a position on one of the reader's
                    ranked issues. No position research exists yet, so `top` was
                    undefined for every race and every user, and the tile showed
                    a race with no candidates in it at all. Who is running is
                    the baseline fact of a race; what they said about an issue
                    is the enhancement on top. Losing the former because we lack
                    the latter is backwards. */}
                {race.candidates.length === 0 ? (
                  <span style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>
                    No candidates on file for this race yet.
                  </span>
                ) : (
                  <>
                    <Kicker size={11}>On the ballot</Kicker>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {race.candidates.map((c) => {
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
                          <div key={c.politicianId} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {nameEl}
                          </div>
                        );
                      })}
                    </div>
                  </>
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

      {GUIDE_LEAD === "races" ? <BillsSection bills={measures} emptyMessage={measuresEmpty} /> : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Phase 2 additions -- hero banner, Voting Information
// ---------------------------------------------------------------------------

/**
 * HUSH Guide's hero banner -- a full-bleed U.S. Capitol photograph (storm
 * clouds overhead, low wide-angle framing, wet plaza reflecting the dome)
 * with a dark scrim behind the title text for legibility. The photo is a
 * true black-and-white shot (zero color saturation throughout), so no
 * grayscale/desaturation filter is applied on top of it -- there's no color
 * left to strip out.
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
        src={versionedAsset("/images/capitol-hero.jpg")}
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
  located,
  polling,
  onEditAddress,
  topics,
  representatives,
  onEditIssues,
}: {
  races: Race[];
  /** True once the saved address has resolved to districts; `races` is only meaningful then. */
  located: boolean;
  polling: PollingPlace;
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
  // `polling` is empty until the address step looks it up (see prefs.tsx
  // DEFAULTS), so the first two lines carry the prompt rather than blanks. A
  // lookup that ran but found nothing says so instead of looking un-run.
  const { name: pollingName, line: pollingLine } = pollingLabels(polling);

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
            what you told HUSH. matters to you -- instead of repeating the dates
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
              <span style={{ fontSize: 15, color: C.ink }}>{pollingName}</span>
              <span style={{ fontSize: 11.5, color: C.muted }}>{pollingLine}</span>
              {polling.hours ? (
                <span style={{ fontSize: 11.5, color: C.muted }}>Open {polling.hours}</span>
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
                {located
                  ? `${races.length} Race${races.length === 1 ? "" : "s"} on Your Ballot`
                  : "Add your address"}
              </span>
              <span style={{ fontSize: 11.5, color: C.muted }}>
                {located ? raceLevelSummary(races) : "to see the races you vote in"}
              </span>
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
    case "Mail ballots due":
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
/** Google's terms: voting-location data may be kept for at most 24 hours. */
const POLLING_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** What to show for the polling place before, and after, a lookup has run. */
function pollingLabels(polling: PollingPlace): { name: string; line: string; found: boolean } {
  // Google stops returning polling data once Election Day passes, so after it
  // "not published" would be wrong. Say the election is over instead.
  if (Date.now() > new Date(ELECTION_ISO).getTime() + 86400000) {
    return { name: "Election Day has passed", line: "Polling places are no longer listed", found: false };
  }
  if (polling.name) return { name: polling.name, line: polling.detail, found: true };
  // A lookup that ran but found no place (or couldn't run) sends the voter to a
  // lookup site where they enter their address, so the wording stays general.
  if (polling.checkedAt) {
    return { name: "Find your polling place", line: "Use the link below and enter your address", found: false };
  }
  return { name: "Not looked up yet", line: "Add your address to find where you vote", found: false };
}

/** The polling place's address for maps and calendar links, falling back to the reader's city. */
function pollingWhere(polling: PollingPlace, cityStateZip: string): string {
  return [polling.name, polling.detail || cityStateZip].filter(Boolean).join(", ");
}

function calendarHref(polling: PollingPlace, cityStateZip: string): string {
  const start = "20261103";
  const end = "20261104"; // Google's all-day `dates` end date is exclusive.
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Election Day - Vote",
    dates: `${start}/${end}`,
    details: polling.name ? `Polling place: ${polling.name}` : "Election Day. Find your polling place before you go.",
    location: polling.name ? pollingWhere(polling, cityStateZip) : cityStateZip,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function directionsHref(polling: PollingPlace, cityStateZip: string): string {
  const destination = pollingWhere(polling, cityStateZip);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function VotingInformationSection({ polling }: { polling: PollingPlace }) {
  // See pollingLabels: the prompt, or "not published yet" after a lookup that
  // found nothing, rather than blank lines.
  const { name: pollingName, line: pollingLine, found } = pollingLabels(polling);
  // Where "Find your polling place" goes when no place was published: the
  // county's own finder pre-filled with the street (only for counties we have
  // checked), else the state's lookup, else vote.org's locator. The note under
  // the box says which, since the first one sends the street to the county's site.
  const finderUrl =
    polling.precinct?.url || polling.lookupUrl || "https://www.vote.org/polling-place-locator/";
  const lead = polling.unavailable
    ? "We can't load polling place details right now. "
    : "We don't have your polling place listed yet. ";
  const prefilled = !!polling.precinct && polling.precinct.prefilled !== false;
  const finderNote = !polling.checkedAt
    ? null
    : prefilled
      ? `${lead}The link below opens a site that looks up your polling place, with your house number and street already filled in, so they go to that site when you click.`
      : `${lead}The link below opens a site where you enter your address to find your polling place. We don't send it.`;
  const finderLabel = "Find your polling place →";
  const days = useDaysToElection();
  const { city, state, zip } = usePrefs();
  const cityStateZip = [city, state, zip].filter(Boolean).join(" ");
  // Real chronological order for the timeline below -- KEY_DATES itself
  // stays in its existing "Register / Early voting / Mail ballot" order
  // (used elsewhere in the app), this just walks through it plus Election
  // Day at the end, where it actually falls.
  // The early voting dates come from the county data when the lookup found
  // them (they differ by county); the fixed date is only the fallback.
  const timelinePoints: { label: string; value: string }[] = [
    ...KEY_DATES.map((k) => (k.label === "Early voting" && polling.earlyWindow ? { ...k, value: polling.earlyWindow } : k)),
    { label: "Election Day", value: "Nov 3" },
  ];
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
          <span style={{ fontSize: 16, lineHeight: 1.2 }}>{pollingName}</span>
          <span style={{ fontSize: 11.5, color: C.body, lineHeight: 1.4 }}>{pollingLine}</span>
          {!found && finderNote ? (
            <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{finderNote}</span>
          ) : null}
          {polling.hours ? (
            <span style={{ fontSize: 11.5, color: C.body, lineHeight: 1.4 }}>Open {polling.hours}</span>
          ) : null}
          {polling.early && polling.early.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
              <Kicker size={10}>Early voting</Kicker>
              {polling.early.slice(0, 3).map((site, i) => (
                <span key={`${site.name}-${i}`} style={{ fontSize: 11.5, color: C.body, lineHeight: 1.35 }}>
                  {[site.name, site.address].filter(Boolean).join(", ")}
                  {site.hours ? ` · ${site.hours}` : ""}
                </span>
              ))}
            </div>
          ) : null}
          {found ? (
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
          ) : (
            <a
              href={finderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-quiet"
              style={{
                marginTop: "auto",
                alignSelf: "flex-start",
                color: C.rust,
                fontSize: 11.5,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {finderLabel}
            </a>
          )}
        </div>
      </Card>
    </section>
  );
}
