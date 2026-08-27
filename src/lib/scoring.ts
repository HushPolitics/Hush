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

/**
 * Value match: how closely a politician's positions track the user's ranked
 * issues. Weights fall off linearly by rank, so the #1 issue counts most.
 *
 * Coverage matters as much as agreement. An official with one position on file
 * that happens to align perfectly is not a better match than one who aligns
 * closely across every issue the voter ranked — but a raw average scores them
 * 100 and puts them at the top of the feed. So the raw score is shrunk toward
 * neutral (50) in proportion to how much of the voter's ranked weight is
 * actually evidenced.
 *
 * This mirrors compute_match() in migration 0003. Keep the two in step.
 */
export function matchDetail(
  p: Politician,
  rankedTopics: string[],
): { score: number; raw: number; coverage: number } {
  if (!rankedTopics.length) return { score: p.match, raw: p.match, coverage: 1 };

  const n = rankedTopics.length;
  let totalWeight = 0;
  let coveredWeight = 0;
  let scoreSum = 0;

  rankedTopics.forEach((topic, i) => {
    const w = n - i;
    totalWeight += w;
    const pos = p.policies.find((x) => x.issue.toLowerCase() === topic.toLowerCase());
    if (!pos) return;
    coveredWeight += w;
    scoreSum += w * pos.align;
  });

  if (!coveredWeight) return { score: p.match, raw: p.match, coverage: 0 };

  const raw = scoreSum / coveredWeight;
  const coverage = coveredWeight / totalWeight;
  return {
    score: Math.round(raw * coverage + 50 * (1 - coverage)),
    raw: Math.round(raw),
    coverage: Math.round(coverage * 100) / 100,
  };
}

export function computeMatch(p: Politician, rankedTopics: string[]): number {
  return matchDetail(p, rankedTopics).score;
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

export function promiseSplit(p: Politician) {
  const total = p.kept + p.prog + p.broken || 1;
  return {
    total: p.kept + p.prog + p.broken,
    keptPct: Math.round((p.kept / total) * 100),
    progPct: Math.round((p.prog / total) * 100),
    brokenPct: Math.round((p.broken / total) * 100),
  };
}
