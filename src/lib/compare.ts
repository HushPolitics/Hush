import type { Politician, StanceCell } from "./types";

/**
 * Custom Compare's mechanical eligibility gate.
 *
 * A politician qualifies for a free-form (non-ballot) comparison only when
 * they have a real, sourced stance on every issue `STANCES` tracks (not the
 * "No record" fallback) plus at least one recorded promise. Below that, most
 * of a side-by-side grid would read "No record" / "Not tracked for this
 * office" -- a comparison that's mostly gaps isn't useful, so the picker
 * simply never offers that pairing rather than let a misleading one exist.
 *
 * This is a data-completeness gate, not an access gate: there is no tier or
 * subscription check anywhere in this file or its callers, per the brief --
 * see CompareView's "Free while in beta" note, which is copy, not a lock.
 */

/** How many of `stances`'s issues this politician has a real (non-"No record") cell for, out of the total. */
export function stanceCoverage(
  politicianId: string,
  stances: Record<string, Record<string, StanceCell>>,
): { have: number; total: number } {
  const issues = Object.keys(stances);
  const have = issues.filter((issue) => {
    const cell = stances[issue]?.[politicianId];
    return cell && cell[0] !== "No record";
  }).length;
  return { have, total: issues.length };
}

/** Full stance coverage (see stanceCoverage) plus at least one tracked promise. */
export function isCustomCompareEligible(
  politician: Politician,
  stances: Record<string, Record<string, StanceCell>>,
): boolean {
  const { have, total } = stanceCoverage(politician.id, stances);
  return total > 0 && have === total && politician.promises.length > 0;
}

/**
 * Same office level as every politician already picked. A federal
 * representative next to a city council member is not a meaningful
 * comparison the way two people actually contesting comparable offices are
 * -- the first pick sets the level for the rest; an empty `picks` has
 * nothing to match yet, so anything eligible is offered.
 *
 * If `picks` itself already spans more than one level -- the seeded default
 * comparison predates this gate and mixes Federal and State -- there is no
 * single consistent level left to enforce, so this returns true rather than
 * rejecting every candidate. That only ever applies to a pre-existing,
 * already-inconsistent set: once every pick shares one level (the first
 * time someone replaces a mismatched slot), the constraint takes hold
 * normally for anything picked after that.
 */
export function matchesPickLevel(candidate: Politician, picks: Politician[]): boolean {
  if (picks.length === 0) return true;
  const levels = new Set(picks.map((p) => p.level));
  if (levels.size > 1) return true;
  return candidate.level === picks[0].level;
}

/** Politicians eligible to be added to this specific in-progress comparison: gate-eligible, same level as the current picks, and not already picked. */
export function eligibleCandidates(
  politicians: Politician[],
  stances: Record<string, Record<string, StanceCell>>,
  currentPicks: Politician[],
): Politician[] {
  return politicians.filter(
    (p) =>
      !currentPicks.some((picked) => picked.id === p.id) &&
      isCustomCompareEligible(p, stances) &&
      matchesPickLevel(p, currentPicks),
  );
}
