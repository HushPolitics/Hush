import type { IssuePosition, Level, Race, RaceCandidate } from "./types";

/**
 * Splits a `Race.title` like "U.S. House · FL-04" into office + district.
 * Some races carry no district ("Mayor of Jacksonville", "County Judge") —
 * those titles have no " · " separator, so `district` comes back undefined
 * rather than an empty string.
 */
export function parseRaceTitle(title: string): { office: string; district?: string } {
  const [office, district] = title.split(" · ");
  return district ? { office, district } : { office };
}

/** "State of FL — United States Senator" -> "United States Senator". */
function officePart(title: string): string {
  return title.split(" — ").pop()?.trim() ?? title;
}

export type HeadToHeadKind = "governor" | "us-house" | "us-senate";

/**
 * The races that compare the Democrat and the Republican head to head, with
 * everyone else behind a button. Matched on the office name, because race
 * titles are "<jurisdiction> — <office>" ("State of FL — Governor",
 * "State of FL — United States Senator", "State of FL — U.S. Representative,
 * FL-13"). "Lieutenant Governor" does not match: the pattern is anchored.
 */
export function headToHeadKind(race: Race): HeadToHeadKind | null {
  const office = officePart(race.title);
  if (/^governor\b/i.test(office)) return "governor";
  if (/^(u\.s\.|united states) (representative|house)\b/i.test(office)) return "us-house";
  if (/^(u\.s\.|united states) senator\b/i.test(office)) return "us-senate";
  return null;
}

const STATUS_ORDER = ["elected", "unopposed", "qualified", "runoff"];

function standing(c: RaceCandidate): number {
  const i = STATUS_ORDER.indexOf(String(c.status ?? "").toLowerCase());
  return i === -1 ? STATUS_ORDER.length : i;
}

/** Strongest filing status among one party's candidates; ties keep ballot order (sort is stable). */
function leadingOf(party: "D" | "R", list: RaceCandidate[]): RaceCandidate | undefined {
  return list.filter((c) => c.party === party).sort((a, b) => standing(a) - standing(b))[0];
}

/**
 * Splits a race into the two candidates shown side by side (the Democrat and
 * the Republican) and everyone else. Anything that isn't a head-to-head race,
 * or that lacks either a Democrat or a Republican, returns everyone in `main`
 * and nobody in `others`, which is the page's behavior before this existed.
 * Original order is kept in both lists.
 */
export function splitHeadToHead(race: Race): { main: RaceCandidate[]; others: RaceCandidate[] } {
  const all = race.candidates;
  if (!headToHeadKind(race)) return { main: all, others: [] };
  const d = leadingOf("D", all);
  const r = leadingOf("R", all);
  if (!d || !r) return { main: all, others: [] };
  return {
    main: all.filter((c) => c === d || c === r),
    others: all.filter((c) => c !== d && c !== r),
  };
}

/** Races listed first on the Guide, in this order. Everything else follows alphabetically. */
const PINNED_FIRST: HeadToHeadKind[] = ["governor", "us-senate", "us-house"];

/**
 * Governor, U.S. Senator, U.S. Representative, then all other races
 * alphabetical by title. `numeric: true` sorts "District 2" before "District 10", which the
 * database's plain text order did not.
 */
export function sortRacesForGuide(races: Race[]): Race[] {
  const rank = (r: Race) => {
    const kind = headToHeadKind(r);
    const i = kind ? PINNED_FIRST.indexOf(kind) : -1;
    return i === -1 ? PINNED_FIRST.length : i;
  };
  return [...races].sort(
    (a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title, "en", { numeric: true }),
  );
}

/** True for the races pinned to the top of the Guide (Governor, U.S. Senator, U.S. Representative). */
export function isPinnedRace(race: Race): boolean {
  const kind = headToHeadKind(race);
  return kind !== null && PINNED_FIRST.includes(kind);
}

/**
 * Whether anyone in this race has a sourced position the voter can see: at
 * least one candidate with a position on at least one of the voter's picked
 * `issues`. With no issues picked yet, any position on any issue counts, so
 * the Guide's order doesn't change for someone who hasn't set up.
 */
export function hasRaceInfo(
  race: Race,
  issues: string[],
  positions: Record<string, Record<string, IssuePosition>>,
): boolean {
  return race.candidates.some((c) => {
    const byIssue = positions[c.politicianId];
    if (!byIssue) return false;
    return issues.length > 0 ? issues.some((issue) => byIssue[issue]) : Object.keys(byIssue).length > 0;
  });
}

/**
 * Splits an already-ordered race list into the races to lead with and the
 * races with no information to show, keeping the order within each. The
 * pinned races always stay in the first list. Remove `isPinnedRace(r) ||` to
 * let them drop like any other race.
 */
export function partitionRacesByInfo(
  races: Race[],
  issues: string[],
  positions: Record<string, Record<string, IssuePosition>>,
): { withInfo: Race[]; withoutInfo: Race[] } {
  const withInfo: Race[] = [];
  const withoutInfo: Race[] = [];
  for (const r of races) {
    (isPinnedRace(r) || hasRaceInfo(r, issues, positions) ? withInfo : withoutInfo).push(r);
  }
  return { withInfo, withoutInfo };
}

/**
 * Race.meta is a seeded string like "Nov 3 · federal" -- there's no
 * standalone Level field on Race itself (only BallotItem, a different type
 * used on the Ballot page, carries one). This reads the same level back out
 * of meta rather than duplicating it as a second field that could drift out
 * of sync with the string version everywhere else already reads.
 */
export function raceLevel(meta: string): Level | undefined {
  const part = meta.split("·")[1]?.trim().toLowerCase();
  if (part === "federal") return "Federal";
  if (part === "state") return "State";
  if (part === "local") return "Local";
  return undefined;
}

/**
 * "Federal • State • Local" -- but only the levels actually present among
 * `races`, in that canonical order, so a smaller or differently-composed
 * ballot doesn't claim a level it doesn't have.
 */
export function raceLevelSummary(races: Race[]): string {
  const present = new Set(races.map((r) => raceLevel(r.meta)).filter(Boolean));
  return (["Federal", "State", "Local"] as Level[]).filter((l) => present.has(l)).join(" • ");
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
