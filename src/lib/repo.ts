/**
 * Data access layer.
 *
 * Every view reads through these functions, never from `seed-data` directly.
 * That keeps one seam between the UI and the backend: when the Supabase tables
 * are populated, each function swaps its body for a query and no view changes.
 *
 * `hasSupabase` is the switch. Until the env vars are set the app runs entirely
 * on the seed dataset, which is what makes the first Vercel deploy work with no
 * backend at all.
 */
import {
  POLITICIANS,
  FACT_CHECKS,
  RACES,
  BALLOT,
  STANCES,
  TOPIC_POOL,
  ISSUE_FINDER_BANK,
  GUIDE_POSITIONS,
  BILLS,
  STANCE_STATEMENTS,
  STANCE_WHY_MATTERS,
  STANCE_POSITIONS,
  VOTES,
  ELECTION_UPDATES,
  ARTICLES,
} from "./seed-data";
import type {
  Politician,
  FactCheck,
  Race,
  BallotItem,
  IssuePosition,
  StanceCheckPosition,
  Bill,
  VoteRecord,
  ElectionUpdate,
  ArticleRecord,
  FundingSummary,
  FundingFiling,
  FundingContributor,
} from "./types";
import { createPublicClient } from "./supabase/server";

export const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function listPoliticians(): Politician[] {
  return POLITICIANS;
}

export function getPolitician(id: string): Politician {
  return POLITICIANS.find((p) => p.id === id) ?? POLITICIANS[0];
}

export function politicianExists(id: string): boolean {
  return POLITICIANS.some((p) => p.id === id);
}

export function listFactChecks(): FactCheck[] {
  return FACT_CHECKS;
}

export function factChecksFor(politicianId: string): FactCheck[] {
  return FACT_CHECKS.filter((c) => c.politicianId === politicianId);
}

export function listRaces(): Race[] {
  return RACES;
}

export function getRace(id: string): Race | undefined {
  return RACES.find((r) => r.id === id);
}

export function raceExists(id: string): boolean {
  return RACES.some((r) => r.id === id);
}

/** HUSH Guide's sourced positions: politicianId -> issue -> IssuePosition. */
export function guidePositions(): Record<string, Record<string, IssuePosition>> {
  return GUIDE_POSITIONS;
}

export function listBallot(): BallotItem[] {
  return BALLOT;
}

export function stanceGrid() {
  return STANCES;
}

export function topicPool(): string[] {
  return TOPIC_POOL;
}

/** Issue Finder's question bank: issue -> its 8 specific sub-questions. */
export function issueFinderBank(): Record<string, string[]> {
  return ISSUE_FINDER_BANK;
}

/** HUSH Guide's "Bills Being Considered" seed data — no real bill lookup yet. */
export function listBills(): Bill[] {
  return BILLS;
}

/** Stance Check's per-issue statements: issue -> the statement text. */
export function stanceStatements(): Record<string, string> {
  return STANCE_STATEMENTS;
}

/**
 * Stance Check's optional per-issue "why this matters" context: issue -> a
 * short explainer, only present for issues that have one written. Empty
 * today -- see STANCE_WHY_MATTERS's own doc comment.
 */
export function stanceWhyItMatters(): Record<string, string> {
  return STANCE_WHY_MATTERS;
}

/** Stance Check's sourced per-candidate stances: politicianId -> issue -> StanceCheckPosition. */
export function stancePositions(): Record<string, Record<string, StanceCheckPosition>> {
  return STANCE_POSITIONS;
}

/** The Feed's Votes category: politicianId -> the bills they've voted on. */
export function listVotes(): Record<string, VoteRecord[]> {
  return VOTES;
}

/** The Feed's Election Updates category -- jurisdiction-wide, not tied to a candidate. */
export function listElectionUpdates(): ElectionUpdate[] {
  return ELECTION_UPDATES;
}

/** The Feed's Articles category: news coverage referencing a politician. */
export function listArticles(): ArticleRecord[] {
  return ARTICLES;
}

/**
 * A politician's campaign funding picture, or `null` when there's nothing to
 * show -- either this politician has no `fecCandidateId` (never filed with
 * the FEC, e.g. every state/local office in this app), or Supabase isn't
 * configured. A non-null result with an empty `filings` array is the
 * distinct "matched, nothing synced yet" state -- callers must tell these
 * apart rather than treating both as "no data."
 *
 * The only repo.ts function that talks to Supabase today: funding has no
 * seed-data equivalent (unlike everything else in this file), since it's the
 * one dataset this app was never going to fabricate plausible fictional
 * numbers for. `hasSupabase`'s seam finally has a real consumer here.
 */
/**
 * PostgREST serializes Postgres `numeric` columns as JSON strings, not
 * numbers, to avoid float precision loss -- every money column in
 * 0006_campaign_funding.sql is `numeric`, so every read of one needs this
 * before it's usable as a number (see FundingFiling/FundingContributor's
 * money fields below). `null`/`undefined` pass through as `null`.
 */
function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function getFundingSummary(politicianId: string): Promise<FundingSummary | null> {
  const politician = getPolitician(politicianId);
  if (!politician.fecCandidateId) return null;
  if (!hasSupabase) return null;

  const supabase = createPublicClient();
  if (!supabase) return null;

  const { data: row } = await supabase
    .from("politicians")
    .select("id")
    .eq("fec_candidate_id", politician.fecCandidateId)
    .maybeSingle();

  // Matched on the frontend (fecCandidateId is set) but not yet in Supabase
  // -- the politicians row hasn't been created/backfilled there yet. Still a
  // "nothing synced" state, not an error.
  if (!row) return { fecCandidateId: politician.fecCandidateId, filings: [], lastSyncedAt: null };

  const { data: filingRows } = await supabase
    .from("funding_filings")
    .select(
      "id, period_label, coverage_start, coverage_end, total_raised, total_spent, cash_on_hand, individual_contributions_total, filed_at, source_url, updated_at, funding_contributors(committee_name, amount, contributor_type)",
    )
    .eq("politician_id", row.id)
    .order("coverage_end", { ascending: false });

  const filings: FundingFiling[] = (filingRows ?? []).map((f) => ({
    id: f.id as string,
    periodLabel: f.period_label as string,
    coverageStart: f.coverage_start as string | null,
    coverageEnd: f.coverage_end as string | null,
    totalRaised: toNum(f.total_raised),
    totalSpent: toNum(f.total_spent),
    cashOnHand: toNum(f.cash_on_hand),
    individualContributionsTotal: toNum(f.individual_contributions_total),
    filedAt: f.filed_at as string | null,
    sourceUrl: f.source_url as string,
    contributors: ((f.funding_contributors ?? []) as unknown as {
      committee_name: string;
      amount: unknown;
      contributor_type: FundingContributor["contributorType"];
    }[]).map((c) => ({
      committeeName: c.committee_name,
      amount: toNum(c.amount) ?? 0,
      contributorType: c.contributor_type,
    })),
  }));

  const lastSyncedAt = filingRows?.length
    ? (filingRows
        .map((f) => f.updated_at as string)
        .sort()
        .at(-1) ?? null)
    : null;

  return { fecCandidateId: politician.fecCandidateId, filings, lastSyncedAt };
}
