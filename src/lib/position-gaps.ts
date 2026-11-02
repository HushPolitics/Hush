/**
 * Issues where HUSH. searched for a candidate's stated position and found
 * none, as opposed to issues it simply has no sourced row for yet.
 *
 * The distinction matters because a blank can mean two different things:
 * "we have not got to this one" or "we looked and the candidate has not said
 * anything". Both used to render as the same "No official position found".
 * Only the second is a finding, so it gets its own wording and a check date.
 *
 * Add a pair here only after the search was actually done, and re-date it
 * when it is repeated. Keys are politician slugs and issue labels exactly as
 * migration 0007 spells them. This is a record of a search, not a verdict
 * that the candidate has no view, so the copy that renders it says so.
 */
export const CONFIRMED_NO_POSITION: Record<string, { checked: string; issues: readonly string[] }> = {
  "david-jolly-fl": {
    checked: "2026-11-02",
    issues: ["Foreign Policy"],
  },
  "byron-donalds-fl": {
    checked: "2026-11-02",
    issues: ["Medicare / Social Security", "LGBTQ+ Rights", "Foreign Policy"],
  },
};

/** The date (YYYY-MM-DD) HUSH. confirmed there was nothing to find, or null if it never checked. */
export function confirmedNoPositionDate(slug: string, issue: string): string | null {
  const entry = CONFIRMED_NO_POSITION[slug];
  return entry && entry.issues.includes(issue) ? entry.checked : null;
}

/** "2026-11-02" -> "Nov 2, 2026", without a timezone shift. */
export function formatCheckedDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}
