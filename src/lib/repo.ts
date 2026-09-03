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
  TRENDING,
  STANCES,
  TOPIC_POOL,
  TOP_ISSUES_QUIZ,
  GUIDE_POSITIONS,
  BILLS,
  STANCE_STATEMENTS,
  STANCE_POSITIONS,
} from "./seed-data";
import type {
  Politician,
  FactCheck,
  Race,
  BallotItem,
  TrendingClaim,
  IssuePosition,
  StanceCheckPosition,
  Bill,
} from "./types";

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

export function listTrending(): TrendingClaim[] {
  return TRENDING;
}

export function stanceGrid() {
  return STANCES;
}

export function topicPool(): string[] {
  return TOPIC_POOL;
}

/** "My Top Issues" quiz's question bank: issue -> its 8 specific sub-questions. */
export function topIssuesQuiz(): Record<string, string[]> {
  return TOP_ISSUES_QUIZ;
}

/** HUSH Guide's "Bills Being Considered" seed data — no real bill lookup yet. */
export function listBills(): Bill[] {
  return BILLS;
}

/** Stance Check's per-issue statements: issue -> the statement text. */
export function stanceStatements(): Record<string, string> {
  return STANCE_STATEMENTS;
}

/** Stance Check's sourced per-candidate stances: politicianId -> issue -> StanceCheckPosition. */
export function stancePositions(): Record<string, Record<string, StanceCheckPosition>> {
  return STANCE_POSITIONS;
}
