import type { Politician } from "./types";

/** "Rep. Delia Marchetti" -> "DM". Honorifics are stripped first. */
export function initials(name: string): string {
  return name
    .replace(/^(Rep\.|Sen\.|Mayor|Judge|Gov\.|Del\.)\s+/, "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
}

// The `name` field sometimes carries a title prefix ("Rep. Delia Marchetti",
// "Sen. Rosa Vance"), so alphabetical sorts use the final space-separated
// token rather than the raw string. Hyphenated last names ("Osei-Hart")
// have no internal space, so this still keeps them as one token.
export function lastNameOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
}

/**
 * Trust score: 60% promises kept, 25% recency, 15% promise significance.
 *
 * The seed data carries a precomputed `trust` field. Once the ingestion
 * pipeline is live this becomes the single place the score is derived, so the
 * weighting stays auditable and the number on screen can always be traced back
 * to the ledger rows that produced it.
 */
export const TRUST_WEIGHTS = { kept: 0.6, recency: 0.25, significance: 0.15 } as const;

export function computeTrust(p: Pick<Politician, "kept" | "prog" | "broken" | "trust">): number {
  const total = p.kept + p.prog + p.broken;
  if (!total) return p.trust ?? 0;
  // Until recency and significance are modelled from real ledger rows, the
  // stored score wins so the UI never invents a number it cannot cite.
  return p.trust ?? Math.round((p.kept / total) * 100);
}

/** Linear-falloff weight bars shown on the profile's ranked-issue list. */
export function rankWeights(topics: string[]): { name: string; rank: number; pct: number }[] {
  const n = topics.length;
  const total = (n * (n + 1)) / 2 || 1;
  return topics.map((name, i) => ({
    name,
    rank: i + 1,
    pct: Math.round(((n - i) / total) * 260),
  }));
}

/**
 * "Voting rights" -> "voting-rights". Matches the kebab-case convention the
 * schema already uses elsewhere ('tx-35', 'austin-citywide') and the slugs
 * seeded into `issues` for TOPIC_POOL in migration 0005. Used to resolve a
 * ranked topic name to its `issues.id` when syncing onboarding/profile
 * ranked issues to Supabase.
 */
export function issueSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function promiseSplit(p: Politician) {
  const total = p.kept + p.prog + p.broken || 1;
  return {
    total: p.kept + p.prog + p.broken,
    keptPct: Math.round((p.kept / total) * 100),
    progPct: Math.round((p.prog / total) * 100),
    brokenPct: Math.round((p.broken / total) * 100),
  };
}
