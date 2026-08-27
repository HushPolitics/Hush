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
