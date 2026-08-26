/**
 * Source reliability rubric.
 *
 * Deliberately a plain table rather than a model judgment: how much a source is
 * worth should be a decision the team makes and can be argued with, not
 * something inferred per-request. A verdict's confidence is capped by the best
 * source supporting it, so this file directly bounds what can be published.
 */

export type SourceKind =
  | "primary_record"
  | "official_site"
  | "article"
  | "press_release"
  | "transcript"
  | "social"
  | "dataset";

/** Domains whose content is a primary public record. */
const PRIMARY_RECORD_DOMAINS = [
  "congress.gov",
  "govinfo.gov",
  "senate.gov",
  "house.gov",
  "gao.gov",
  "cbo.gov",
  "federalregister.gov",
  "fec.gov",
  "bls.gov",
  "census.gov",
  "courtlistener.com",
  "capitol.texas.gov",
  "legiscan.com",
  "openstates.org",
];

/** Wire services and desks with a standing corrections policy. */
const NEWS_DESK_DOMAINS: Record<string, number> = {
  "apnews.com": 0.75,
  "reuters.com": 0.75,
  "npr.org": 0.7,
  "bbc.com": 0.7,
  "propublica.org": 0.75,
  "texastribune.org": 0.7,
  "statesman.com": 0.68,
  "kut.org": 0.68,
};

const OPINION_PATH = /\/(opinion|editorial|commentary|op-ed|blogs?)\//i;

export function classifySource(url: string): { kind: SourceKind; reliability: number } {
  let host = "";
  let path = "";
  try {
    const u = new URL(url);
    host = u.hostname.replace(/^www\./, "");
    path = u.pathname;
  } catch {
    return { kind: "article", reliability: 0.3 };
  }

  if (PRIMARY_RECORD_DOMAINS.some((d) => host === d || host.endsWith("." + d))) {
    return { kind: "primary_record", reliability: 0.95 };
  }

  // .gov generally, minus the press-release wing of any given office.
  if (host.endsWith(".gov")) {
    if (/press|news|release/i.test(path)) return { kind: "press_release", reliability: 0.55 };
    return { kind: "primary_record", reliability: 0.85 };
  }

  if (OPINION_PATH.test(path)) return { kind: "article", reliability: 0.3 };

  const desk = NEWS_DESK_DOMAINS[host];
  if (desk) return { kind: "article", reliability: desk };

  if (/(^|\.)(x|twitter|facebook|instagram|threads|bsky)\.(com|app|social)$/.test(host)) {
    return { kind: "social", reliability: 0.2 };
  }

  // Unknown outlet: usable as corroboration, never as sole support for a
  // "False" verdict or a promise status change.
  return { kind: "article", reliability: 0.45 };
}

/** A politician's own site: authoritative for stated positions, not for outcomes. */
export function classifyOfficialSite(): { kind: SourceKind; reliability: number } {
  return { kind: "official_site", reliability: 0.8 };
}

export const PUBLISH_THRESHOLDS = {
  minConfidence: 0.75,
  minSupportingReliability: 0.6,
  /** Verdicts and promise transitions that require a primary record to auto-publish. */
  requiresPrimaryRecord: ["False", "Delivered", "No movement"] as const,
  /** Share of auto-published rows queued for human audit anyway. */
  randomAuditRate: 0.05,
  /** Days before an election when auto-publish tightens for that race. */
  contestedWindowDays: 30,
  contestedMinConfidence: 0.9,
};
