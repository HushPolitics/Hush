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

/**
 * Where a HUSH Guide issue position was sourced from, ranked by the priority
 * a researcher should prefer them in: a candidate's own campaign site first,
 * down through official social media last. The UI surfaces this ranking as
 * plain labels — it is not scored or weighted into anything.
 */
export type GuideSourceType =
  | "Campaign site"
  | "Official government site"
  | "Official platform document"
  | "Official press release"
  | "Official social media";

/**
 * A single candidate's sourced position on a single issue, for HUSH Guide's
 * election comparison page. This is the same shape `StanceCell` sketched out
 * for the Compare grid (a short blurb plus an optional `sourceUrl`), extended
 * with the title/type/date fields HUSH Guide's source block needs — an
 * excerpt without a name, type, and freshness for its source isn't enough to
 * evaluate. `date` is optional because not every source is dated (e.g. an
 * evergreen platform page); when absent, the UI omits the date rather than
 * guessing one. There is deliberately no `align`/score field here — HUSH
 * Guide shows what a candidate said, not how well they scored.
 */
export interface IssuePosition {
  /** Short excerpt/quote of the candidate's position — not a full reproduction. */
  excerpt: string;
  sourceTitle: string;
  sourceType: GuideSourceType;
  sourceUrl: string;
  /** Publication or last-updated date, if the source carries one. */
  date?: string;
}

/**
 * A candidate's recorded stance toward one Stance Check statement — their
 * own vote or stated position on the specific claim, not how well it
 * matches the signed-in user. "Neutral" covers a genuinely mixed or
 * conditional record, not a missing one; a candidate with nothing sourced
 * simply has no key in `STANCE_POSITIONS` for that issue, same convention
 * `GUIDE_POSITIONS` already uses, and Stance Check's UI renders that gap as
 * "No record" rather than guessing.
 */
export type StanceCheckAnswer = "Agree" | "Neutral" | "Disagree";

/**
 * Same shape and sourcing rigor as `IssuePosition` — this only exists as a
 * separate type because it carries `stance`, which `IssuePosition`
 * deliberately does not: HUSH Guide shows what a candidate said with no
 * judgment attached, while Stance Check exists specifically to say whether
 * that record agrees or disagrees with the statement. There is still no
 * score here — `stance` is a per-question fact, not something rolled up
 * across questions.
 */
export interface StanceCheckPosition {
  stance: StanceCheckAnswer;
  /** Short excerpt/quote grounding the stance — not a full reproduction. */
  excerpt: string;
  sourceTitle: string;
  sourceType: GuideSourceType;
  sourceUrl: string;
  /** Publication or last-updated date, if the source carries one. */
  date?: string;
}

/** One answer choice on the "My Top Issues" quiz — see TOP_ISSUES_QUIZ. */
export type TopIssuesQuizAnswer = "Not important" | "Somewhat important" | "Very important";

/**
 * How many of each issue's 8 quiz sub-questions a sitting asks — see
 * lib/quiz.ts's QUIZ_DEPTHS for the label/count/total each maps to.
 */
export type QuizDepth = "quick" | "standard" | "thorough";

export interface TrendingClaim {
  text: string;
  meta: string;
  dot: string;
}

/**
 * A piece of legislation shown in HUSH Guide's "Bills Being Considered"
 * section. `explanation`/`yesMeans`/`noMeans` are HUSH's own paraphrase, not
 * the bill's official language — the UI must keep that visually distinct
 * (see BillCard) and never blend the two. `explainerTooComplex` is the
 * honesty valve for a bill HUSH can't confidently simplify yet: when true,
 * the UI shows that admission instead of `explanation`/`yesMeans`/`noMeans`
 * (all left undefined for such a bill) rather than guessing at a summary it
 * can't stand behind. `voteStage` says what kind of vote this is (e.g.
 * "Final passage vote", "Committee vote", "Procedural vote (cloture
 * motion)") so a procedural vote is never read as final passage — `yesMeans`
 * and `noMeans` must describe that vote's actual consequence, not a generic
 * "the opposite of yes."
 */
export interface Bill {
  id: string;
  /** Official bill number, e.g. "H.R. 2145", "Texas SB 214". */
  number: string;
  /** Official title. */
  title: string;
  /** Legislative body considering it, e.g. "U.S. House of Representatives". */
  chamber: string;
  level: Level;
  /** Short official-ish description shown on the tile front, if available. */
  description?: string;
  /** Upcoming vote date, if scheduled. */
  voteDate?: string;
  voteStage?: string;
  explainerTooComplex?: boolean;
  /** "What does this bill do?" — HUSH's plain-English paraphrase. */
  explanation?: string;
  /** "A YES vote would:" bullets — the actual consequence of that vote. */
  yesMeans?: string[];
  /** "A NO vote would:" bullets — not just the inverse of `yesMeans`. */
  noMeans?: string[];
  sourceName: string;
  sourceUrl: string;
  dateAccessed: string;
  /** Date the source was last updated, if the source carries one. */
  dateUpdated?: string;
}
