"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_DISTRICT, DEFAULT_POLLING_PLACE } from "./seed-data";
import type { TopIssuesQuizAnswer } from "./types";

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

export interface Prefs {
  /**
   * Ranked issues, most important first. The single shared issue list: it
   * drives Value Match, the "Your Top Issues" panel, the ranked-issue sync to
   * `user_issue_weights`, and also which issues HUSH Guide researches
   * positions on and which statements Stance Check quizzes on. Capped at 10
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
   * data source or API. Seeded from `DEFAULT_DISTRICT.city`, which was itself
   * a single hardcoded "City, ST" string.
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
   * Whether the user has been through (or explicitly skipped past) the
   * signup wizard's personalization steps. Drives whether `PersonalizeBanner`
   * nags a signed-in user to finish — not whether an account exists at all.
   */
  onboarded: boolean;
  /**
   * Name/email collected on the signup wizard's "Create account" step
   * (`SignupWizard`'s `firstName`/`lastName`/`email` state), mirrored here so
   * Profile Settings has something real to show and edit instead of a
   * hardcoded placeholder. Seeded with plausible defaults for the prototype
   * — a real account always overwrites these at signup.
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
  polling: { name: string; detail: string };
  /**
   * Every answer ever given on the "My Top Issues" quiz, keyed by a stable
   * question id (`lib/quiz.ts`'s `questionId(issue, index)` — an index into
   * that issue's entry in `TOP_ISSUES_QUIZ`, so it stays stable across
   * retakes and question-pool reshuffles). Answers accumulate across every
   * sitting rather than being replaced by the latest one: `lib/quiz.ts`'s
   * `selectQuizQuestions()` reads this to skip already-answered questions
   * first on a retake, and `scoreQuiz()` reads it to rank issues from every
   * answer on file, not just the most recent sitting — more retakes means
   * more signal, never less. This is raw quiz input, not `topics` itself:
   * answering questions here never touches `topics` on its own — only an
   * explicit save from the quiz's results step (the same `TopIssuesCard`
   * editor, in its draft mode) does that. Never trimmed or capped.
   */
  quizAnswers: Record<string, { value: TopIssuesQuizAnswer; answeredAt: number }>;
}

// DEFAULT_DISTRICT.city is a combined "City, ST" string; split it once here
// so city/state can be stored (and edited) as separate fields.
const [DEFAULT_CITY, DEFAULT_STATE] = DEFAULT_DISTRICT.city.split(", ");

const DEFAULTS: Prefs = {
  // Empty rather than pre-populated: `topics` now gates HUSH Guide's and
  // Stance Check's own setup steps (see hasGuide/picking in GuideView.tsx and
  // StanceCheckView.tsx), so a fresh session needs to start with nothing
  // picked or those setup flows would never show. Every consumer already
  // treats an empty list as a normal state, not an edge case —
  // TopIssuesCard/SignupWizard both render their own "nothing picked yet"
  // empty state.
  topics: [],
  saved: ["marchetti", "bellweather", "vance", "ainsley", "oseihart"],
  zip: DEFAULT_DISTRICT.zip,
  city: DEFAULT_CITY,
  state: DEFAULT_STATE,
  streetAddress: "",
  onboarded: false,
  firstName: "Jordan",
  lastName: "Reyes",
  email: "",
  emailPrefs: {
    electionUpdates: true,
    issueUpdates: true,
    politicianUpdates: true,
    hushAnnouncements: false,
  },
  picks: ["marchetti", "vance", "pike"],
  polling: DEFAULT_POLLING_PLACE,
  quizAnswers: {},
};

const STORAGE_KEY = "hush.prefs.v1";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let snapshot: Prefs = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function readStorage(): Prefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const stored = JSON.parse(raw) as Partial<Prefs>;
    return {
      ...DEFAULTS,
      ...stored,
      // Shallow-merged above like every other field, but emailPrefs is
      // itself an object — a partial stored value (e.g. from before a new
      // category was added) needs its own merge or the missing keys would
      // be `undefined` instead of falling back to DEFAULTS.
      emailPrefs: { ...DEFAULTS.emailPrefs, ...(stored.emailPrefs ?? {}) },
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
   * single atomic write: the "My Top Issues" quiz's results step, which
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
  setOnboarded: (onboarded: boolean) => void;
  setFirstName: (firstName: string) => void;
  setLastName: (lastName: string) => void;
  setEmail: (email: string) => void;
  setEmailPref: (key: keyof EmailPrefs, value: boolean) => void;
  setPicks: (picks: string[]) => void;
  setPolling: (p: { name: string; detail: string }) => void;
  /**
   * Records one "My Top Issues" quiz answer, stamped with the time it was
   * answered. Overwrites any prior answer to the same question id (e.g. from
   * an earlier sitting) rather than keeping a history of changes-of-mind —
   * only the latest answer to a given question counts toward its score.
   */
  recordQuizAnswer: (questionId: string, value: TopIssuesQuizAnswer) => void;
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
      setOnboarded: (onboarded) => patch({ onboarded }),
      setFirstName: (firstName) => patch({ firstName }),
      setLastName: (lastName) => patch({ lastName }),
      setEmail: (email) => patch({ email }),
      setEmailPref: (key, value) => patch({ emailPrefs: { ...snapshot.emailPrefs, [key]: value } }),
      setPicks: (picks) => patch({ picks }),
      setPolling: (polling) => patch({ polling }),
      recordQuizAnswer: (questionId, value) =>
        patch({
          quizAnswers: {
            ...snapshot.quizAnswers,
            [questionId]: { value, answeredAt: Date.now() },
          },
        }),
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
