import { ELECTION_ISO } from "./seed-data";
import type {
  ArticleRecord,
  Bill,
  ElectionUpdate,
  FactCheck,
  IssuePosition,
  Politician,
  PromiseStatus,
  Race,
  StanceCheckAnswer,
  StanceCheckPosition,
  VoteRecord,
} from "./types";
import type { FeedScope } from "./feedScope";

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

/**
 * Normalizes the three date shapes scattered across the seed data into a
 * sortable timestamp. Returns `null` for anything with no fixed point in
 * time ("Ongoing") -- those items are excluded from the Feed's dated,
 * reverse-chronological list rather than sorted arbitrarily.
 *
 * Handles "Mon YYYY" (PromiseRecord/IssuePosition/StanceCheckPosition/
 * ScoreChangeEvent dates), "QN YYYY" (one outlier promise date -- resolves
 * to that quarter's first month), "Mon D" with no year (FactCheck dates --
 * the implicit year is the election's own year, from `ELECTION_ISO`, not
 * the real device clock, so the Feed still sorts correctly when viewed
 * after the 2026 election), and "Mon D, YYYY" (Bill/VoteRecord/
 * ElectionUpdate/ArticleRecord dates -- these carry an explicit year since
 * some, like a bill's `voteDate`, are scheduled in the future rather than
 * dated against the election year).
 */
export function parseFeedDate(date: string): number | null {
  if (date === "Ongoing") return null;

  const quarter = date.match(/^Q([1-4]) (\d{4})$/);
  if (quarter) {
    return new Date(Number(quarter[2]), (Number(quarter[1]) - 1) * 3, 1).getTime();
  }

  const monthDayYear = date.match(/^([A-Za-z]{3}) (\d{1,2}), (\d{4})$/);
  if (monthDayYear && MONTHS[monthDayYear[1]] !== undefined) {
    return new Date(Number(monthDayYear[3]), MONTHS[monthDayYear[1]], Number(monthDayYear[2])).getTime();
  }

  const monthYear = date.match(/^([A-Za-z]{3}) (\d{4})$/);
  if (monthYear && MONTHS[monthYear[1]] !== undefined) {
    return new Date(Number(monthYear[2]), MONTHS[monthYear[1]], 1).getTime();
  }

  const monthDay = date.match(/^([A-Za-z]{3}) (\d{1,2})$/);
  if (monthDay && MONTHS[monthDay[1]] !== undefined) {
    const electionYear = new Date(ELECTION_ISO).getFullYear();
    return new Date(electionYear, MONTHS[monthDay[1]], Number(monthDay[2])).getTime();
  }

  return null;
}

interface FeedEventBase {
  id: string;
  ts: number;
  date: string;
  politician: Politician;
}

export interface ScoreFeedEvent extends FeedEventBase {
  type: "score";
  from: number;
  to: number;
  reason: string;
}

export interface PromiseFeedEvent extends FeedEventBase {
  type: "promise";
  text: string;
  status: PromiseStatus;
}

export interface FactCheckFeedEvent extends FeedEventBase {
  type: "factcheck";
  check: FactCheck;
}

export interface PositionFeedEvent extends FeedEventBase {
  type: "position";
  issue: string;
  excerpt: string;
  sourceTitle: string;
  sourceUrl: string;
  /** Which surface this position was sourced for -- drives the deep link. */
  kind: "guide" | "stance";
  stance?: StanceCheckAnswer;
}

export interface VoteFeedEvent extends FeedEventBase {
  type: "vote";
  vote: VoteRecord;
}

/**
 * A bill or piece of legislation up for a vote -- the only Feed event type
 * with no `politician` attached. A bill isn't any one candidate's record;
 * it's chamber-wide, so unlike every other event here it has nothing to
 * scope to Following, and it's always considered "on the ballot" for the
 * app IA restructure brief's single-district seed set.
 */
export interface BillFeedEvent {
  type: "bill";
  id: string;
  ts: number;
  date: string;
  bill: Bill;
}

/**
 * A jurisdiction-wide election administration update -- see
 * `ElectionUpdate`'s doc comment in lib/types.ts. Also has no `politician`.
 */
export interface ElectionUpdateFeedEvent {
  type: "electionUpdate";
  id: string;
  ts: number;
  date: string;
  update: ElectionUpdate;
}

export interface ArticleFeedEvent extends FeedEventBase {
  type: "article";
  article: ArticleRecord;
}

/**
 * One dated thing that happened, for the rebuilt Feed. A discriminated union
 * on `type` so JSX rendering narrows cleanly, same convention as
 * `StanceCell`/`BallotItem.state` elsewhere in this codebase.
 */
export type FeedEvent =
  | ScoreFeedEvent
  | PromiseFeedEvent
  | FactCheckFeedEvent
  | PositionFeedEvent
  | VoteFeedEvent
  | BillFeedEvent
  | ElectionUpdateFeedEvent
  | ArticleFeedEvent;

/**
 * Merges every dated event type the app IA restructure brief's amendment and
 * Phase 3's FactCheckCard doc comment both call for -- score changes (with
 * their reason), promise status changes, fact-check verdicts, and new/updated
 * positions -- into one reverse-chronological list. Undated items ("Ongoing"
 * promises, sourceless positions) are left out entirely rather than sorted
 * arbitrarily; there is no gap being papered over, since a genuinely
 * undated fact has no place on a dated timeline.
 *
 * Guide and Stance Check positions are deduped by (politician, excerpt): the
 * two surfaces sometimes cite the identical sourced quote for related
 * issues, and showing it twice would read as two events for one fact.
 */
export function buildFeedEvents(
  politicians: Politician[],
  factChecks: FactCheck[],
  guide: Record<string, Record<string, IssuePosition>>,
  stance: Record<string, Record<string, StanceCheckPosition>>,
  votes: Record<string, VoteRecord[]>,
  bills: Bill[],
  electionUpdates: ElectionUpdate[],
  articles: ArticleRecord[],
): FeedEvent[] {
  const byId = new Map(politicians.map((p) => [p.id, p]));
  const events: FeedEvent[] = [];

  for (const p of politicians) {
    for (const ev of p.scoreEvents ?? []) {
      const ts = parseFeedDate(ev.date);
      if (ts === null) continue;
      events.push({
        type: "score",
        id: `score-${p.id}-${ev.date}`,
        ts,
        date: ev.date,
        politician: p,
        from: ev.from,
        to: ev.to,
        reason: ev.reason,
      });
    }
    for (const pr of p.promises) {
      const ts = parseFeedDate(pr.date);
      if (ts === null) continue;
      events.push({
        type: "promise",
        id: `promise-${pr.id}`,
        ts,
        date: pr.date,
        politician: p,
        text: pr.text,
        status: pr.status,
      });
    }
  }

  for (const c of factChecks) {
    const p = byId.get(c.politicianId);
    if (!p) continue;
    const ts = parseFeedDate(c.date);
    if (ts === null) continue;
    events.push({ type: "factcheck", id: `factcheck-${c.id}`, ts, date: c.date, politician: p, check: c });
  }

  const seenExcerpts = new Set<string>();
  function addPosition(
    politicianId: string,
    issue: string,
    pos: IssuePosition | StanceCheckPosition,
    kind: "guide" | "stance",
  ) {
    if (!pos.date) return;
    const p = byId.get(politicianId);
    if (!p) return;
    const ts = parseFeedDate(pos.date);
    if (ts === null) return;
    const dedupeKey = `${politicianId}::${pos.excerpt}`;
    if (seenExcerpts.has(dedupeKey)) return;
    seenExcerpts.add(dedupeKey);
    events.push({
      type: "position",
      id: `position-${kind}-${politicianId}-${issue}`,
      ts,
      date: pos.date,
      politician: p,
      issue,
      excerpt: pos.excerpt,
      sourceTitle: pos.sourceTitle,
      sourceUrl: pos.sourceUrl,
      kind,
      stance: kind === "stance" ? (pos as StanceCheckPosition).stance : undefined,
    });
  }

  for (const [politicianId, issues] of Object.entries(guide)) {
    for (const [issue, pos] of Object.entries(issues)) addPosition(politicianId, issue, pos, "guide");
  }
  for (const [politicianId, issues] of Object.entries(stance)) {
    for (const [issue, pos] of Object.entries(issues)) addPosition(politicianId, issue, pos, "stance");
  }

  for (const [politicianId, vs] of Object.entries(votes)) {
    const p = byId.get(politicianId);
    if (!p) continue;
    for (const v of vs) {
      const ts = parseFeedDate(v.date);
      if (ts === null) continue;
      events.push({ type: "vote", id: `vote-${v.id}`, ts, date: v.date, politician: p, vote: v });
    }
  }

  for (const b of bills) {
    // A bill's most useful date for the Feed is when it's next up for a
    // vote; falling back to when the source was last updated (or first
    // pulled) keeps a not-yet-scheduled bill from being excluded entirely.
    const dateStr = b.voteDate ?? b.dateUpdated ?? b.dateAccessed;
    const ts = parseFeedDate(dateStr);
    if (ts === null) continue;
    events.push({ type: "bill", id: `bill-${b.id}`, ts, date: dateStr, bill: b });
  }

  for (const u of electionUpdates) {
    const ts = parseFeedDate(u.date);
    if (ts === null) continue;
    events.push({ type: "electionUpdate", id: `election-${u.id}`, ts, date: u.date, update: u });
  }

  for (const a of articles) {
    const p = byId.get(a.politicianId);
    if (!p) continue;
    const ts = parseFeedDate(a.date);
    if (ts === null) continue;
    events.push({ type: "article", id: `article-${a.id}`, ts, date: a.date, politician: p, article: a });
  }

  return events.sort((a, b) => b.ts - a.ts);
}

/** The politician a Feed event is about, or `null` for the two jurisdiction-wide types (bill, electionUpdate). */
export function eventPolitician(e: FeedEvent): Politician | null {
  return e.type === "bill" || e.type === "electionUpdate" ? null : e.politician;
}

/**
 * Ballot-scoped politician ids: everyone running as a candidate in a race
 * `listRaces()` returns. No real per-ZIP filtering exists in the seed data
 * yet (every address currently sees the same races), so this is the same
 * "known" set CompareView/GuideView already derive inline -- the Feed's
 * default scope, before the user switches to Following.
 */
export function ballotPoliticianIds(races: Race[]): Set<string> {
  const ids = new Set<string>();
  for (const r of races) for (const c of r.candidates) ids.add(c.politicianId);
  return ids;
}

/**
 * Whether one Feed event is about at least one of the reader's ranked
 * issues -- the Feed sidebar's "My issues" scope. Position and fact-check
 * events carry a direct issue/topic field and match on that. Score and
 * promise events carry no per-event issue -- they're about a politician's
 * overall record, not one issue -- so they fall back to matching the
 * politician's own `tags`: an imperfect but existing topic-adjacent field,
 * rather than leaving those two event types unmatchable under this scope
 * entirely. An empty `topics` list matches nothing, same "nothing ranked
 * yet" convention every other `topics` consumer in this codebase uses.
 */
export function matchesIssues(e: FeedEvent, topics: string[]): boolean {
  if (topics.length === 0) return false;
  switch (e.type) {
    case "position":
      return topics.includes(e.issue);
    case "factcheck":
      return topics.includes(e.check.topic);
    case "score":
    case "promise":
    case "vote":
    case "article":
      return e.politician.tags.some((t) => topics.includes(t));
    case "bill":
      return (e.bill.issues ?? []).some((t) => topics.includes(t));
    case "electionUpdate":
      // Procedural, not about any one issue -- never matches an issue scope.
      return false;
  }
}

/**
 * Whether a Feed event belongs under the reader's current scope chip --
 * centralizes the three scopes' rules in one place rather than leaving the
 * view to reimplement them, since two event types (bill, electionUpdate)
 * have no `politician` to check against `ballotIds`/`saved` the way every
 * other type does. Both are jurisdiction-wide, so they're always considered
 * "on the ballot" and never "Following" (there's no politician to follow).
 */
export function eventInScope(
  e: FeedEvent,
  scope: FeedScope,
  ballotIds: Set<string>,
  saved: string[],
  topics: string[],
): boolean {
  if (scope === "issues") return matchesIssues(e, topics);
  const politician = eventPolitician(e);
  if (!politician) return scope === "ballot";
  return scope === "ballot" ? ballotIds.has(politician.id) : saved.includes(politician.id);
}
