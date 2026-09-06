import type { IssuePosition, Race } from "./types";

/**
 * Splits a `Race.title` like "U.S. House · TX-35" into office + district.
 * Some races carry no district ("Mayor of Austin", "County Judge") — those
 * titles have no " · " separator, so `district` comes back undefined rather
 * than an empty string.
 */
export function parseRaceTitle(title: string): { office: string; district?: string } {
  const [office, district] = title.split(" · ");
  return district ? { office, district } : { office };
}

/**
 * "Delia Marchetti (D)" -> "Delia Marchetti". `RaceCandidate.name` in the
 * seed data bakes the party letter into the display name as a trailing
 * "(D)"/"(R)"/"(I)" suffix, but `RaceCandidate.party` already carries the
 * same information as its own field — this strips the suffix so a view can
 * render the name and party separately (e.g. delayed, or as its own
 * party-colored dot) instead of showing party twice. A name with no
 * parenthetical suffix passes through unchanged.
 */
export function stripPartySuffix(name: string): string {
  return name.replace(/\s*\([DRI]\)\s*$/, "");
}

/**
 * Shortens a sourced excerpt to a single-line phrase for tight spaces (e.g.
 * a HUSH Guide race card) that can't fit a full quote. Cuts at the last
 * whole word inside `maxLen` rather than mid-word, and only appends an
 * ellipsis when something was actually cut off.
 */
export function shortPhrase(text: string, maxLen = 88): string {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * The user's own top-ranked issue that has at least one sourced position
 * in this specific race, in `topics` rank order -- HUSH Guide's race cards
 * lead with this rather than a generic issue the user didn't rank. Returns
 * the issue and its 1-based rank in the user's list (so a card can say
 * "Your #2 issue" when the #1 issue has no data for this race), or
 * `undefined` when none of the user's ranked issues have any data here.
 */
export function topRankedIssueForRace(
  race: Race,
  topics: string[],
  positions: Record<string, Record<string, IssuePosition>>,
): { issue: string; rank: number } | undefined {
  for (let i = 0; i < topics.length; i++) {
    const issue = topics[i];
    if (race.candidates.some((c) => positions[c.politicianId]?.[issue])) {
      return { issue, rank: i + 1 };
    }
  }
  return undefined;
}

/**
 * How many of the user's selected HUSH Guide issues have at least one
 * candidate in `race` with a sourced position. This is a coverage count, not
 * a score — it says nothing about which candidate said what, only whether
 * there is anything sourced to show for that issue at all.
 */
export function issueCoverage(
  race: Race,
  issues: string[],
  positions: Record<string, Record<string, IssuePosition>>,
): { covered: number; total: number } {
  const covered = issues.filter((issue) =>
    race.candidates.some((c) => positions[c.politicianId]?.[issue]),
  ).length;
  return { covered, total: issues.length };
}
