"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { IssueFinderAnswer } from "./types";

/**
 * Per-user state: ranked issues, saved politicians, ZIP, compare picks.
 *
 * Backed by a module-level store rather than component state so that
 * `useSyncExternalStore` can serve a stable server snapshot (the defaults) and
 * a live client snapshot (what is in localStorage) without a hydration
 * mismatch or a setState-in-effect cascade.
 *
 * Persisted to localStorage today. When Supabase auth lands, `hydrate()` reads
 * from `public.user_preferences` first and `persist()` mirrors writes there —
 * the component API below does not change.
 */

export interface EmailPrefs {
  electionUpdates: boolean;
  issueUpdates: boolean;
  politicianUpdates: boolean;
  /**
   * Occasional product/feature news — the same thing the signup wizard's
   * "Send me HUSH updates" checkbox (step 4) sets. Mirrors
   * `profiles.marketing_email_opt_in`; the other three categories here are
   * functional notifications the schema has no column for yet, so they stay
   * Prefs-only until that's added.
   */
  hushAnnouncements: boolean;
}

/**
 * Where the reader votes, as looked up from their address (see
 * actions/polling.ts). Everything beyond name/detail is optional so an older
 * stored value, or a lookup that found nothing, still reads as valid.
 *
 *   name       venue name; empty until a lookup finds an assigned place
 *   detail     that venue's street address
 *   hours      Election Day hours as published
 *   early      early voting sites as published
 *   lookupUrl  the state's own polling-place finder, for when none is published
 *   checkedAt  when the lookup ran (ms). Set once a lookup has run, so "not
 *              published yet" can be told apart from "never looked up", and so
 *              the Guide can look it up again: Google's terms don't allow
 *              keeping voting-location data for more than 24 hours.
 */
export interface PollingPlace {
  name: string;
  detail: string;
  hours?: string;
  early?: { name: string; address: string; hours: string }[];
  lookupUrl?: string;
  /** Span of early voting, e.g. "Oct 19 - Nov 1", from the lookup. */
  earlyWindow?: string;
  /** Counts from the last lookup, for telling "none published" from "dropped". */
  diag?: { electionId: string; polling: number; early: number; dropOff: number; retried: boolean };
  checkedAt?: number;
}

export interface Prefs {
  /**
   * Ranked issues, most important first. The single shared issue list: it
   * drives Value Match, the "Your Top Issues" panel, the ranked-issue sync to
   * `user_issue_weights`, and also which issues HUSH Guide researches
   * positions on and which statements Stance Check tests. Capped at 10
   * by `toggleTopic` below. HUSH Guide and Stance Check toggle entries here
   * same as everywhere else; they just don't expose the ranking UI, so an
   * issue picked from either one appends to the end of the order rather than
   * asking where it should rank.
   */
  topics: string[];
  saved: string[];
  zip: string;
  /**
   * City/state shown alongside `zip` (e.g. the header location pill).
   * Set directly from what the user types into that form — not derived from
   * `zip` by a real ZIP-to-city/state lookup, which would need a geocoding
   * data source or API. Empty until the user sets it.
   */
  city: string;
  state: string;
  /**
   * Street address collected on the signup wizard's "Where do you live?"
   * step. Optional (the step is skippable) and, like `city`/`state`, not
   * derived from anything — the district/ballot lookups elsewhere in the
   * app still key off `zip`. Kept here so it round-trips through the same
   * localStorage-backed store as the rest of onboarding, with a best-effort
   * sync to `profiles.street_address` when a Supabase session exists.
   */
  streetAddress: string;
  /**
   * The districts this user's address actually votes in, as resolved by
   * `resolveAddress`. Ids into `public.districts`.
   *
   * This is what makes a personal ballot possible, and it is kept here rather
   * than derived on the fly for two reasons: resolving costs a geocode plus a
   * point-in-polygon query, and a signed-out visitor has nowhere else to put
   * it. A signed-in user also gets it mirrored to `user_districts`, but this
   * copy is the one the UI reads, so the two never race each other.
   *
   * Empty means "we have not looked it up", not "this address votes in
   * nothing" -- every consumer must treat empty as unfiltered and show all
   * races, never an empty ballot.
   */
  districtIds: string[];
  /**
   * The address exactly as the Census matched it, which is not necessarily
   * what the user typed. Shown back to them so a wrong match is visible
   * instead of silently producing someone else's ballot.
   */
  matchedAddress: string;
  /** When the districts above were resolved, so staleness can be surfaced. */
  districtsResolvedAt: number | null;
  /**
   * Whether the user has been through (or explicitly skipped past) the
   * signup wizard's personalization steps. Drives whether `PersonalizeBanner`
   * nags a signed-in user to finish — not whether an account exists at all.
   */
  onboarded: boolean;
  /**
   * Whether this user has been through HUSH. Guide's own setup: Step 1
   * (confirm address), then Step 2 (issues). Deliberately separate from
   * `topics`: the signup wizard already ranks issues, so `topics` alone can't
   * tell a new account that has never opened the Guide from a returning user.
   * Reset to false every time an account is created (see SignupWizard).
   */
  guideSetupDone: boolean;
  /**
   * Name/email collected on the signup wizard's "Create account" step
   * (`SignupWizard`'s `firstName`/`lastName`/`email` state), mirrored here so
   * Profile Settings has something real to show and edit instead of a
   * hardcoded placeholder. Empty until the user signs up (or signs in on a
   * device that has no stored name yet, see AppShell's hydration effect).
   */
  firstName: string;
  lastName: string;
  /**
   * Display/edit convenience only — the account's real email of record lives
   * on `auth.users`, not `profiles`. Profile Settings writes changes here via
   * `supabase.auth.updateUser({ email })`, best-effort, same pattern as
   * password changes.
   */
  email: string;
  /**
   * Granular email notification categories, managed from Profile Settings.
   * Only `hushAnnouncements` has a Supabase column today (see EmailPrefs) —
   * the rest are local-only until the schema grows dedicated columns.
   */
  emailPrefs: EmailPrefs;
  picks: string[];
  polling: PollingPlace;
  /**
   * Every answer ever given on Issue Finder, keyed by a stable question id
   * (`lib/issue-finder.ts`'s `questionId(issue, index)` — an index into
   * that issue's entry in `ISSUE_FINDER_BANK`, so it stays stable across
   * retakes and question-pool reshuffles). Answers accumulate across every
   * sitting rather than being replaced by the latest one:
   * `lib/issue-finder.ts`'s `selectFinderQuestions()` reads this to skip
   * already-answered questions first on a retake, and `scoreFinder()` reads
   * it to rank issues from every answer on file, not just the most recent
   * sitting — more retakes means more signal, never less. This is raw
   * Issue Finder input, not `topics` itself: answering questions here never
   * touches `topics` on its own — only an explicit save from Issue Finder's
   * results step (the same `TopIssuesCard` editor, in its draft mode) does
   * that. Never trimmed or capped.
   */
  finderAnswers: Record<string, { value: IssueFinderAnswer; answeredAt: number }>;
  /**
   * Feed event ids the reader has opened -- drives Worth Knowing's and Recent
   * Updates' unread dot. Same "grows over time, never trimmed" convention as
   * `saved`; an id with no matching event today (feed content changed) simply
   * never matches anything, same as a stale `saved` id would.
   */
  readEventIds: string[];
}

const DEFAULTS: Prefs = {
  // Empty rather than pre-populated: `topics` now gates HUSH Guide's and
  // Stance Check's own setup steps (see hasGuide/picking in GuideView.tsx and
  // StanceCheckView.tsx), so a fresh session needs to start with nothing
  // picked or those setup flows would never show. Every consumer already
  // treats an empty list as a normal state, not an edge case —
  // TopIssuesCard/SignupWizard both render their own "nothing picked yet"
  // empty state.
  topics: [],
  // Empty, not pre-followed. These were five seed-data politician ids, so a
  // brand-new account opened with five representatives already saved and no
  // way to tell they were fictional. Nothing is saved until the user saves it.
  saved: [],
  // Empty, not Jacksonville. These three defaulted to DEFAULT_DISTRICT
  // (ZIP 32202 / Duval County), so every signed-in user saw Duval County
  // local data regardless of the ZIP they entered -- a stored value only
  // overwrote them once onboarding wrote to them. An empty location reads as
  // "not set yet", which is the truth.
  zip: "",
  city: "",
  state: "",
  streetAddress: "",
  // Empty, meaning "not looked up yet". Consumers read an empty list as
  // unfiltered, so a user who has not given an address sees every race
  // rather than an empty ballot.
  districtIds: [],
  matchedAddress: "",
  districtsResolvedAt: null,
  onboarded: false,
  guideSetupDone: false,
  firstName: "",
  lastName: "",
  email: "",
  emailPrefs: {
    electionUpdates: true,
    issueUpdates: true,
    politicianUpdates: true,
    hushAnnouncements: false,
  },
  // Empty, not three seed-data ids: Compare opened pre-loaded with fictional
  // politicians the user never picked.
  picks: [],
  // Empty, not the seeded Jacksonville "Main Library" address. Every render
  // site falls back to a "not looked up yet" string when these are blank, so
  // the polling card prompts for a lookup instead of asserting a polling
  // place the user was never assigned.
  polling: { name: "", detail: "" },
  finderAnswers: {},
  readEventIds: [],
};

// v3: v1 payloads carried the old seeded defaults (saved reps, ZIP 32202, the
// Jacksonville polling place), which the store had written itself and which
// are indistinguishable from real user choices on read -- the only way to drop
// them was to stop reading v1. v2 then predates districtIds, and a stored
// value without it would shallow-merge to the default empty list anyway; the
// bump is to avoid carrying a ZIP that was never resolved to a real district
// into a UI that now treats location as authoritative.
const STORAGE_KEY = "hush.prefs.v3";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let snapshot: Prefs = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

// Old issue name -> new issue name, for anything already saved in a browser
// from before the issue list was consolidated. Water is folded into
// Climate / Environmental Laws.
const ISSUE_RENAMES: Record<string, string> = {
  "Voting rights": "Election Laws / Voting Rights",
  Climate: "Climate / Environmental Laws",
  Labor: "Jobs / Labor",
  "Criminal justice": "Crime / Public Safety",
  Guns: "Gun Laws",
  "Reproductive rights": "Abortion / Reproductive Rights",
  Transit: "Infrastructure / Transportation",
  Economy: "Cost of Living / Economy",
  Water: "Climate / Environmental Laws",
};

// Issues whose Issue Finder questions were rewritten or retired: a saved
// answer is keyed to a question's position in the bank, which no longer
// means the same question, so these are cleared instead of carried over.
const ISSUES_WITH_RESET_ANSWERS = new Set(["Economy", "Water"]);

function migrateTopics(topics: string[] | undefined): string[] | undefined {
  if (!topics) return topics;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of topics) {
    const next = ISSUE_RENAMES[t] ?? t;
    if (!seen.has(next)) {
      seen.add(next);
      out.push(next);
    }
  }
  return out;
}

function migrateFinderAnswers(answers: Prefs["finderAnswers"] | undefined): Prefs["finderAnswers"] | undefined {
  if (!answers) return answers;
  const out: Prefs["finderAnswers"] = {};
  for (const [id, value] of Object.entries(answers)) {
    const sep = id.lastIndexOf("::");
    if (sep < 0) continue;
    const issue = id.slice(0, sep);
    if (ISSUES_WITH_RESET_ANSWERS.has(issue)) continue;
    out[(ISSUE_RENAMES[issue] ?? issue) + id.slice(sep)] = value;
  }
  return out;
}

function readStorage(): Prefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const stored = JSON.parse(raw) as Partial<Prefs>;
    return {
      ...DEFAULTS,
      ...stored,
      topics: migrateTopics(stored.topics) ?? DEFAULTS.topics,
      finderAnswers: migrateFinderAnswers(stored.finderAnswers) ?? DEFAULTS.finderAnswers,
      // Shallow-merged above like every other field, but emailPrefs is
      // itself an object — a partial stored value (e.g. from before a new
      // category was added) needs its own merge or the missing keys would
      // be `undefined` instead of falling back to DEFAULTS.
      emailPrefs: { ...DEFAULTS.emailPrefs, ...(stored.emailPrefs ?? {}) },
      // Browsers that stored prefs before this flag existed: anyone who already
      // has issues ranked has already used the Guide, so don't send them back
      // through setup. A stored explicit `false` (a new signup) is kept as is.
      guideSetupDone: stored.guideSetupDone ?? (stored.topics?.length ?? 0) > 0,
    };
  } catch {
    // Private browsing or blocked storage: defaults are a fine starting point.
    return DEFAULTS;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  // The first subscriber pulls the stored value in. Doing it here rather than
  // in an effect keeps the very first render identical to the server's.
  if (!loaded) {
    loaded = true;
    const stored = readStorage();
    if (stored !== DEFAULTS) {
      snapshot = stored;
      queueMicrotask(emit);
    }
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => DEFAULTS;

function update(next: Prefs) {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable: preferences stay in memory for this session.
  }
  emit();
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface PrefsContextValue extends Prefs {
  /** Toggles `name` in `topics` (the ranked list). Adding past 10 is a no-op. */
  toggleTopic: (name: string) => void;
  moveTopic: (index: number, delta: number) => void;
  reorderTopic: (from: number, to: number) => void;
  /**
   * Replaces `topics` wholesale, capped at 10. Everywhere else edits the
   * live list one change at a time (toggleTopic/moveTopic/reorderTopic) —
   * this is for the one place that needs to commit a whole draft array in a
   * single atomic write: Issue Finder's results step, which
   * builds its suggested order locally and only writes it here on an
   * explicit Save, never as the user answers questions.
   */
  setTopics: (topics: string[]) => void;
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  setZip: (zip: string) => void;
  setCity: (city: string) => void;
  setState: (state: string) => void;
  setStreetAddress: (streetAddress: string) => void;
  /**
   * Records a resolved address and the districts it votes in, together, as
   * one write. They must never be set separately: an address with somebody
   * else's districts attached is worse than no address at all.
   */
  setResolvedLocation: (loc: {
    matchedAddress: string;
    city: string;
    state: string;
    zip: string;
    districtIds: string[];
  }) => void;
  /** Clears the resolved location, returning the app to the full ballot. */
  clearResolvedLocation: () => void;
  setOnboarded: (onboarded: boolean) => void;
  setGuideSetupDone: (guideSetupDone: boolean) => void;
  setFirstName: (firstName: string) => void;
  setLastName: (lastName: string) => void;
  setEmail: (email: string) => void;
  setEmailPref: (key: keyof EmailPrefs, value: boolean) => void;
  setPicks: (picks: string[]) => void;
  setPolling: (p: PollingPlace) => void;
  /**
   * Records one Issue Finder answer, stamped with the time it was
   * answered. Overwrites any prior answer to the same question id (e.g. from
   * an earlier sitting) rather than keeping a history of changes-of-mind —
   * only the latest answer to a given question counts toward its score.
   */
  recordFinderAnswer: (questionId: string, value: IssueFinderAnswer) => void;
  markEventRead: (id: string) => void;
  isEventRead: (id: string) => boolean;
}

const Ctx = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const patch = useCallback((p: Partial<Prefs>) => update({ ...snapshot, ...p }), []);

  const value = useMemo<PrefsContextValue>(
    () => ({
      ...prefs,
      toggleTopic: (name) => {
        const has = snapshot.topics.includes(name);
        if (!has && snapshot.topics.length >= 10) return;
        patch({ topics: has ? snapshot.topics.filter((t) => t !== name) : snapshot.topics.concat(name) });
      },
      moveTopic: (index, delta) => {
        const next = snapshot.topics.slice();
        const j = index + delta;
        if (j < 0 || j >= next.length) return;
        [next[index], next[j]] = [next[j], next[index]];
        patch({ topics: next });
      },
      // Arbitrary-distance reorder (drag-and-drop), as opposed to moveTopic's
      // adjacent swap (↑/↓ buttons). Same underlying `topics` array either
      // way, so the "Your Top Issues" card's drag reordering and any arrow
      // reordering elsewhere stay in sync.
      reorderTopic: (from, to) => {
        const next = snapshot.topics.slice();
        if (from < 0 || from >= next.length || to < 0 || to >= next.length) return;
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        patch({ topics: next });
      },
      setTopics: (topics) => patch({ topics: topics.slice(0, 10) }),
      toggleSaved: (id) =>
        patch({
          saved: snapshot.saved.includes(id)
            ? snapshot.saved.filter((x) => x !== id)
            : snapshot.saved.concat(id),
        }),
      isSaved: (id) => prefs.saved.includes(id),
      setZip: (zip) => patch({ zip }),
      setCity: (city) => patch({ city }),
      setState: (state) => patch({ state }),
      setStreetAddress: (streetAddress) => patch({ streetAddress }),
      setResolvedLocation: (loc) =>
        patch({
          matchedAddress: loc.matchedAddress,
          city: loc.city,
          state: loc.state,
          zip: loc.zip,
          districtIds: loc.districtIds,
          districtsResolvedAt: Date.now(),
        }),
      clearResolvedLocation: () =>
        patch({ matchedAddress: "", districtIds: [], districtsResolvedAt: null }),
      setOnboarded: (onboarded) => patch({ onboarded }),
      setGuideSetupDone: (guideSetupDone) => patch({ guideSetupDone }),
      setFirstName: (firstName) => patch({ firstName }),
      setLastName: (lastName) => patch({ lastName }),
      setEmail: (email) => patch({ email }),
      setEmailPref: (key, value) => patch({ emailPrefs: { ...snapshot.emailPrefs, [key]: value } }),
      setPicks: (picks) => patch({ picks }),
      setPolling: (polling) => patch({ polling }),
      recordFinderAnswer: (questionId, value) =>
        patch({
          finderAnswers: {
            ...snapshot.finderAnswers,
            [questionId]: { value, answeredAt: Date.now() },
          },
        }),
      markEventRead: (id) => {
        if (snapshot.readEventIds.includes(id)) return;
        patch({ readEventIds: snapshot.readEventIds.concat(id) });
      },
      isEventRead: (id) => prefs.readEventIds.includes(id),
    }),
    [prefs, patch],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs(): PrefsContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePrefs must be used inside <PrefsProvider>");
  return v;
}
