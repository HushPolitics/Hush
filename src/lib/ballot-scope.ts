import type { Race } from "./types";

/**
 * Narrowing the full race list down to the races one address actually votes in.
 *
 * The default is deliberately the opposite of a filter: with no resolved
 * location every race is in scope. Someone who has not given an address should
 * see everything rather than an empty page, and an empty ballot must never be
 * the result of us not knowing where they live.
 */

export interface BallotScope {
  /** Districts the address resolved to, as ids into `public.districts`. */
  districtIds: string[];
  /** Two-letter state from the geocode, for statewide seats. */
  stateCode: string;
}

export type ScopeReason = "district" | "statewide" | "unscoped" | "unknown-district";

/**
 * Why a race is in scope, so the UI can explain itself rather than silently
 * including things.
 *
 *   district          -- the address falls inside this seat's boundary
 *   statewide         -- every voter in the state votes in it (US Senate,
 *                        Governor, and at-large seats whose electorate is the
 *                        whole jurisdiction)
 *   unknown-district  -- the race has no district attached, which is a data
 *                        gap on our side. Included rather than hidden: losing
 *                        a real race because of our own missing metadata is
 *                        the worse error, and it stays visible for triage.
 *   unscoped          -- no address given, so nothing is being narrowed
 */
export function scopeReasonFor(race: Race, scope: BallotScope | null): ScopeReason | null {
  if (!scope || scope.districtIds.length === 0) return "unscoped";

  if (race.districtId && scope.districtIds.includes(race.districtId)) return "district";

  // Statewide seats have no polygon and never will: the electorate is the
  // whole state, so point-in-polygon has nothing to test. Match on state
  // instead, or they vanish from their own voters' ballots.
  //
  // `isAtLarge` must NOT be treated as statewide, and an earlier version of
  // this function made exactly that mistake. At-large means every voter in
  // the seat's own jurisdiction votes in it -- everyone in Pinellas County,
  // everyone in Altamonte Springs -- not everyone in Florida. Because those
  // districts carry their jurisdiction's real boundary as geometry, the
  // point-in-polygon check above already resolves them correctly. Adding them
  // here put all 39 Florida mayoral races on one St. Petersburg ballot,
  // labelled as though the whole state voted in each one.
  const sameState =
    !race.districtStateCode ||
    !scope.stateCode ||
    race.districtStateCode.toUpperCase() === scope.stateCode.toUpperCase();

  if (sameState && race.districtKind === "state") return "statewide";

  if (!race.districtId) return "unknown-district";

  return null;
}

export function isInScope(race: Race, scope: BallotScope | null): boolean {
  return scopeReasonFor(race, scope) !== null;
}

export function filterRaces(races: Race[], scope: BallotScope | null): Race[] {
  if (!scope || scope.districtIds.length === 0) return races;
  return races.filter((r) => isInScope(r, scope));
}

/**
 * True when an address resolved to districts but none of the races matched to
 * them are local (county, city, school board). The app has no record of which
 * ballots are missing a race, so this is the proxy for where a gap is most
 * likely: statewide and federal races are always present, the local ones are
 * what may not be loaded yet.
 */
export function lacksLocalRaces(races: Race[], scope: BallotScope | null): boolean {
  if (!scope || scope.districtIds.length === 0) return false;
  return !races.some((r) => r.level === "Local" && scopeReasonFor(r, scope) === "district");
}

/** Short human label for why a race appears, or null when nothing is narrowed. */
export function scopeLabel(reason: ScopeReason | null): string | null {
  switch (reason) {
    case "statewide":
      return "Everyone in your state votes in this";
    case "unknown-district":
      return "District not mapped yet";
    default:
      return null;
  }
}
