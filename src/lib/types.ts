export type Party = "D" | "R" | "I";
export type Level = "Local" | "State" | "Federal";
/**
 * Promise state, expressed as progress rather than judgment.
 *
 * Each label states an observable fact about the record instead of
 * characterising intent the way "broken promise" does. "No movement" is the
 * honest floor: it says nothing has happened, without implying the official is
 * still pursuing something they have in fact voted against.
 *
 * The internal shorthand for the tallies stays `kept` / `broken` /
 * `broken_count` across the codebase — those are field names, not something a
 * voter ever reads.
 */
export type PromiseStatus = "Delivered" | "In progress" | "No movement";
export type Verdict = "True" | "Misleading" | "False";
export type StanceTag = "Aligned" | "Partial" | "Opposed" | "No record";

/**
 * A politician's stance on an issue, as shown in the Compare grid:
 * [tag, short blurb, sourceUrl?]. `sourceUrl` is a placeholder for a future
 * deep link to the exact passage the stance was sourced from — no seed data
 * populates it yet, so the UI treats a missing sourceUrl as "not yet
 * linkable" rather than inventing a destination.
 */
export type StanceCell = [StanceTag, string, string?];

export interface PolicyPosition {
  issue: string;
  stance: string;
  /** 0-100 alignment with the signed-in user's ranked issues. */
  align: number;
}

export interface PromiseRecord {
  id: string;
  text: string;
  status: PromiseStatus;
  /**
   * 0-100. Drawn as a bar in the ledger; `status` is the label under it.
   * Always 100 for Delivered and 0 for No movement — the database enforces
   * this with a check constraint so the bar and the label cannot disagree.
   */
  progress: number;
  /** Human-readable resolution date, or "Ongoing". */
  date: string;
  sources: string[];
}

export interface TermScore {
  label: string;
  score: number;
}

export interface TimelineEvent {
  date: string;
  label: string;
  /** Dot colour: ink for the pledge, navy for progress, tan for slippage, rust for failure. */
  dot: string;
}

export interface CareerEntry {
  year: string;
  what: string;
  detail: string;
}

export interface Politician {
  id: string;
  name: string;
  office: string;
  district: string;
  level: Level;
  party: Party;
  since: number;
  /** Value match, 0-100. Recomputed per user once issue weights exist. */
  match: number;
  /** Trust score, 0-100. 60% promises kept, 25% recency, 15% significance. */
  trust: number;
  kept: number;
  prog: number;
  broken: number;
  bio: string;
  tags: string[];
  policies: PolicyPosition[];
  promises: PromiseRecord[];
  terms: TermScore[];
  timeline: TimelineEvent[];
  career: CareerEntry[];
}

export interface FactCheck {
  id: string;
  verdict: Verdict;
  politicianId: string;
  topic: string;
  date: string;
  claim: string;
  finding: string;
  sources: string[];
}

export interface RaceCandidate {
  politicianId: string;
  name: string;
  party: Party;
  align: number;
}

export interface Race {
  id: string;
  title: string;
  meta: string;
  candidates: RaceCandidate[];
}

export interface BallotItem {
  race: string;
  candidates: string;
  level: Level;
  state: "Reviewed" | "Needs review" | "No match yet";
  politicianId: string;
}

export interface TrendingClaim {
  text: string;
  meta: string;
  dot: string;
}
