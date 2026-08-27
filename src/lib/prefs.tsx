"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_DISTRICT, DEFAULT_POLLING_PLACE } from "./seed-data";

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

export interface Prefs {
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
   * Placeholder fields for the Profile hero — nothing collects these yet.
   * `party` will eventually come from account setup (see the "Profile
   * Settings" placeholder page); `invited` will eventually come from a real
   * referral/invite system. Both are seeded with plausible values so the
   * hero has something to show rather than inventing UI for data that isn't
   * tracked anywhere.
   */
  party: string;
  invited: number;
  picks: string[];
  polling: { name: string; detail: string };
  /**
   * Up to 10 issues HUSH Guide researches positions for, chosen on its
   * "What matters most to you?" step. Deliberately separate from `topics`:
   * `topics` (ranked, unbounded) drives Value Match and the ranked-issues
   * panels elsewhere in the app; `guideIssues` (unranked, capped at 10) only
   * decides which issue sections HUSH Guide's comparison pages render. An
   * empty array means the user hasn't been through HUSH Guide's setup steps
   * yet — that's what gates whether visiting /guide shows the setup wizard
   * or jumps straight to the tile grid.
   */
  guideIssues: string[];
}

// DEFAULT_DISTRICT.city is a combined "City, ST" string; split it once here
// so city/state can be stored (and edited) as separate fields.
const [DEFAULT_CITY, DEFAULT_STATE] = DEFAULT_DISTRICT.city.split(", ");

const DEFAULTS: Prefs = {
  topics: ["Healthcare", "Housing", "Voting rights", "Climate", "Labor"],
  saved: ["marchetti", "bellweather", "vance", "ainsley", "oseihart"],
  zip: DEFAULT_DISTRICT.zip,
  city: DEFAULT_CITY,
  state: DEFAULT_STATE,
  streetAddress: "",
  onboarded: false,
  party: "Independent",
  invited: 12,
  picks: ["marchetti", "vance", "pike"],
  polling: DEFAULT_POLLING_PLACE,
  guideIssues: [],
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
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) };
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
  toggleTopic: (name: string) => void;
  moveTopic: (index: number, delta: number) => void;
  reorderTopic: (from: number, to: number) => void;
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  setZip: (zip: string) => void;
  setCity: (city: string) => void;
  setState: (state: string) => void;
  setStreetAddress: (streetAddress: string) => void;
  setOnboarded: (onboarded: boolean) => void;
  setPicks: (picks: string[]) => void;
  setPolling: (p: { name: string; detail: string }) => void;
  /**
   * Toggles `name` in `guideIssues`. Selecting past 10 is a no-op rather than
   * an error — the "0/10"-style counter in the UI already disables the
   * unselected chips at the cap, so this is a backstop, not the only guard.
   */
  toggleGuideIssue: (name: string) => void;
}

const Ctx = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const patch = useCallback((p: Partial<Prefs>) => update({ ...snapshot, ...p }), []);

  const value = useMemo<PrefsContextValue>(
    () => ({
      ...prefs,
      toggleTopic: (name) =>
        patch({
          topics: snapshot.topics.includes(name)
            ? snapshot.topics.filter((t) => t !== name)
            : snapshot.topics.concat(name),
        }),
      moveTopic: (index, delta) => {
        const next = snapshot.topics.slice();
        const j = index + delta;
        if (j < 0 || j >= next.length) return;
        [next[index], next[j]] = [next[j], next[index]];
        patch({ topics: next });
      },
      // Arbitrary-distance reorder (drag-and-drop), as opposed to moveTopic's
      // adjacent swap (↑/↓ buttons). Same underlying `topics` array either
      // way, so the hero panel's drag reordering and the lower Card's arrow
      // reordering stay in sync.
      reorderTopic: (from, to) => {
        const next = snapshot.topics.slice();
        if (from < 0 || from >= next.length || to < 0 || to >= next.length) return;
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        patch({ topics: next });
      },
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
      setPicks: (picks) => patch({ picks }),
      setPolling: (polling) => patch({ polling }),
      toggleGuideIssue: (name) => {
        const has = snapshot.guideIssues.includes(name);
        if (!has && snapshot.guideIssues.length >= 10) return;
        patch({
          guideIssues: has
            ? snapshot.guideIssues.filter((t) => t !== name)
            : snapshot.guideIssues.concat(name),
        });
      },
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
