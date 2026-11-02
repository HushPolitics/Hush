import type { Politician } from "@/lib/types";

/**
 * Where a politician's campaign finance reports are filed.
 *
 * - "federal": the FEC. HUSH. syncs these totals once a candidate is matched
 *   to an FEC candidate id.
 * - "state": the Florida Division of Elections (governor, Cabinet, Florida
 *   House and Senate). HUSH. does not pull these numbers, so the page links
 *   out instead.
 * - "local": county and municipal races, which file with local supervisors of
 *   elections. No link-out; the page keeps its plain "not covered" wording.
 */
export type FilingRegime = "federal" | "state" | "local";

const FEDERAL_OFFICE = /\b(U\.S\.|United States) (Representative|Senator)\b/i;

export function filingRegime(p: Pick<Politician, "level" | "office">): FilingRegime {
  if (p.level === "Federal" || FEDERAL_OFFICE.test(p.office)) return "federal";
  if (p.level === "State") return "state";
  return "local";
}

/** Florida Division of Elections campaign finance database (contributions search). */
export const FL_DOE_FINANCE_URL = "https://dos.elections.myflorida.com/campaign-finance/contributions/";

/** FEC candidate browser, for federal candidates HUSH. has not matched yet. */
export const FEC_CANDIDATES_URL = "https://www.fec.gov/data/candidates/";
