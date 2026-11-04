/**
 * The one switch for HUSH. Guide's season.
 *
 *   "between"  -- no election is close. The Guide shows the people who
 *                 represent you and the positions we have on file for them.
 *                 No countdown, no Election Day language, no "your ballot".
 *   "election" -- the full election-season Guide: countdown, key dates,
 *                 polling place, "Your Ballot", Your Races, ballot measures.
 *
 * To flip the Guide, change `GUIDE_MODE` below and nothing else. Everything
 * election-specific in the Guide reads `isElectionMode` from this file; all
 * of the election-season copy and components still exist and render
 * unchanged in "election" mode.
 *
 * This file is read only by the Guide (GuideView.tsx). The Feed, Stance
 * Check, politician pages and the rest of the app have their own election
 * data (app-content.ts) and are not affected by this setting.
 */
export type GuideMode = "between" | "election";

export const GUIDE_MODE: GuideMode = "between";

export const isElectionMode: boolean = (GUIDE_MODE as GuideMode) === "election";

/**
 * Elections the Guide knows about, so the next one can be named in "between"
 * mode. Adding an election (Orlando, the 2028 cycle) is an edit to this list.
 *
 *   date     -- election day, YYYY-MM-DD
 *   runoff   -- runoff day, YYYY-MM-DD, when there is one
 *   regions  -- ids of the districts (public.districts) whose voters take part,
 *               matched against the districts the voter's saved address
 *               already resolved to. This reuses the existing address match;
 *               it adds no new matching. An empty list matches nobody.
 *   show     -- false keeps the entry out of the Guide
 *
 * The "next election for your address" line renders only when `show` is true,
 * the date has not passed, and one of `regions` is among the voter's districts.
 * The entries below have no regions yet: no 2027 races or districts are loaded,
 * so there is nothing to match against. Fill in `regions` and set `show: true`
 * once they are.
 */
export interface GuideElection {
  id: string;
  name: string;
  date: string;
  runoff?: string;
  regions: string[];
  show: boolean;
}

export const GUIDE_ELECTIONS: GuideElection[] = [
  {
    id: "tampa-2027",
    name: "Tampa municipal election",
    date: "2027-03-02",
    runoff: "2027-04-27",
    regions: [],
    show: false,
  },
  {
    id: "jacksonville-2027",
    name: "Jacksonville municipal election",
    date: "2027-03-23",
    runoff: "2027-05-18",
    regions: [],
    show: false,
  },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2027-03-02" -> "March 2, 2027", without a timezone shift. */
export function formatElectionDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/**
 * The soonest listed election, still ahead of `today` (YYYY-MM-DD), that this
 * voter's districts take part in. Null when there is none, which is the
 * normal case until 2027 districts are listed above.
 */
export function nextElectionFor(
  districtIds: string[],
  today: string,
  elections: GuideElection[] = GUIDE_ELECTIONS,
): GuideElection | null {
  const mine = elections
    .filter((e) => e.show && e.date >= today && e.regions.some((r) => districtIds.includes(r)))
    .sort((a, b) => a.date.localeCompare(b.date));
  return mine[0] ?? null;
}
