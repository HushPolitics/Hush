/**
 * Data access layer.
 *
 * Every view reads through these functions, never from a dataset module
 * directly. That seam used to sit in front of `seed-data.ts`; it now sits in
 * front of Supabase, and the views did not change shape when it moved.
 *
 * Two rules govern this file:
 *
 *   1. Everything returned here is a record, or it is empty. There is no
 *      fallback dataset any more. When Supabase is unreachable or a table has
 *      not been populated yet, these functions return nothing -- never an
 *      illustrative stand-in. A voter guide that invents a plausible answer is
 *      worse than one that admits it has none, so "no data yet" is a
 *      first-class result the views are expected to render honestly.
 *
 *   2. Anything Hush wrote itself (the issue taxonomy, the Issue Finder
 *      question bank, the Stance Check statements, the election calendar)
 *      lives in `app-content.ts` and is served synchronously from there. It is
 *      product content, not a claim about a politician, so it does not belong
 *      behind a database query.
 *
 * What is real today: members of Congress, the offices and districts they
 * hold, Florida races and the candidates who filed for them, and Florida
 * legislative bills. What is not populated yet, and therefore comes back
 * empty: roll call votes, fact checks, sourced issue positions, the Compare
 * stance grid, campaign finance, and the feed. Each one has a `// EMPTY:`
 * note below saying what has to land before it returns anything.
 */
import {
  TOPIC_POOL,
  ISSUE_FINDER_BANK,
  STANCE_STATEMENTS,
  STANCE_WHY_MATTERS,
} from "./app-content";
import type {
  Politician,
  FactCheck,
  Race,
  RaceCandidate,
  IssuePosition,
  StanceCell,
  StanceCheckPosition,
  Bill,
  VoteRecord,
  ElectionUpdate,
  ArticleRecord,
  FundingSummary,
  FundingFiling,
  FundingContributor,
  Level,
  Party,
} from "./types";
import { createPublicClient } from "./supabase/server";

export const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

// ---------------------------------------------------------------------------
// Row shapes + mappers
// ---------------------------------------------------------------------------

/**
 * `politicians` joined through `politician_offices` to the office and district
 * it belongs to. PostgREST returns an embedded one-to-many as an array even
 * when the relationship is effectively one-to-one, so every embed below is
 * unwrapped with `first()` rather than read as an object.
 */
const POLITICIAN_SELECT = `
  slug, full_name, display_name, party, bio, portrait_url, official_site_url,
  campaign_site_url, wikipedia_url, bioguide_id, fec_candidate_id, in_office_since,
  politician_offices(
    offices( title, level, districts( name, state_code ) )
  )
`;

function first<T>(v: T[] | T | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

/**
 * Normalises whatever the database holds into the app's `Party` union.
 * Florida's candidate filings carry "NPA" (no party affiliation) and a catch-all
 * "Other"; both are real ballot designations and are passed through rather than
 * flattened into "I", which would misstate them.
 */
function toParty(v: unknown): Party {
  const s = String(v ?? "").toUpperCase();
  if (s === "D" || s === "R" || s === "I" || s === "NPA") return s as Party;
  return "Other";
}

function toLevel(v: unknown): Level {
  const s = String(v ?? "");
  return s === "Local" || s === "State" || s === "Federal" ? s : "Federal";
}

interface PoliticianRow {
  slug: string;
  full_name: string;
  display_name: string | null;
  party: string | null;
  bio: string | null;
  portrait_url: string | null;
  official_site_url: string | null;
  campaign_site_url: string | null;
  wikipedia_url: string | null;
  bioguide_id: string | null;
  fec_candidate_id: string | null;
  in_office_since: number | null;
  politician_offices?: { offices?: unknown }[] | null;
}

function toPolitician(row: PoliticianRow): Politician {
  const office = first(row.politician_offices)?.offices as
    | { title?: string; level?: string; districts?: unknown }
    | null
    | undefined;
  const district = first(office?.districts) as { name?: string } | null;

  return {
    id: row.slug,
    name: row.display_name ?? row.full_name,
    office: office?.title ?? "",
    district: district?.name ?? "",
    level: toLevel(office?.level),
    party: toParty(row.party),
    bio: row.bio ?? "",
    portraitUrl: row.portrait_url ?? undefined,
    officialSiteUrl: row.official_site_url ?? undefined,
    campaignSiteUrl: row.campaign_site_url ?? undefined,
    wikipediaUrl: row.wikipedia_url ?? undefined,
    bioguideId: row.bioguide_id ?? undefined,
    fecCandidateId: row.fec_candidate_id ?? undefined,
    since: row.in_office_since ?? undefined,
    // The HUSH Score and the promise ledger are deliberately absent, not zero.
    // Scoring whether someone kept a promise takes a human reviewer making a
    // judgment call, and Hush has no reviewer yet -- so there is no score to
    // report and `trust`/`kept`/`prog`/`broken` stay undefined. A zero here
    // would read as "this politician scored zero," which is a claim nobody has
    // earned the right to make. The views check for undefined and say so.
    tags: [],
    policies: [],
    promises: [],
    terms: [],
    timeline: [],
    career: [],
  };
}

// ---------------------------------------------------------------------------
// Politicians
// ---------------------------------------------------------------------------

export async function listPoliticians(): Promise<Politician[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("politicians")
    .select(POLITICIAN_SELECT)
    .eq("is_active", true)
    .order("full_name");

  if (error || !data) return [];
  return (data as unknown as PoliticianRow[]).map(toPolitician);
}

/**
 * One politician by slug, or `null` when there is no such row.
 *
 * The old seed-backed version fell back to the first politician in the list
 * when an id did not match, which turned a bad URL into a confident page about
 * the wrong person. Callers now get `null` and are expected to `notFound()`.
 */
export async function getPolitician(id: string): Promise<Politician | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("politicians")
    .select(POLITICIAN_SELECT)
    .eq("slug", id)
    .maybeSingle();

  if (error || !data) return null;
  return toPolitician(data as unknown as PoliticianRow);
}

export async function politicianExists(id: string): Promise<boolean> {
  const supabase = createPublicClient();
  if (!supabase) return false;

  const { data } = await supabase.from("politicians").select("slug").eq("slug", id).maybeSingle();
  return Boolean(data);
}

// ---------------------------------------------------------------------------
// Races and candidates
// ---------------------------------------------------------------------------

const RACE_SELECT = `
  id, title, seats_to_fill, is_nonpartisan,
  offices( title, level, districts( id, name, kind, state_code, is_at_large, jurisdictions( name ) ) ),
  candidacies( id, display_name, party, is_incumbent, ballot_order, withdrew, status, politician_id )
`;

interface RaceRow {
  id: string;
  title: string | null;
  seats_to_fill: number | null;
  is_nonpartisan: boolean | null;
  offices?: unknown;
  candidacies?: {
    id: string;
    display_name: string;
    party: string | null;
    is_incumbent: boolean | null;
    ballot_order: number | null;
    withdrew: boolean | null;
    status: string | null;
    politician_id: string | null;
  }[] | null;
}

function toRace(row: RaceRow, slugById: Map<string, string>): Race {
  const office = first(row.offices) as
    | { title?: string; level?: string; districts?: unknown }
    | null;
  const district = first(office?.districts) as
    | {
        id?: string;
        name?: string;
        kind?: string;
        state_code?: string;
        is_at_large?: boolean;
        jurisdictions?: unknown;
      }
    | null;
  const jurisdiction = first(district?.jurisdictions) as { name?: string } | null;

  // Prefer jurisdiction + office over the stored `title`. The stored one was
  // assembled from a county slug during ingestion, so it reads "Santarosa
  // County" and "Miamidade County"; `jurisdictions.name` carries the properly
  // spelled "Santa Rosa County" / "Miami-Dade County".
  const title =
    jurisdiction?.name && office?.title
      ? `${jurisdiction.name} — ${office.title}`
      : (row.title ?? office?.title ?? "Race");

  // Who is actually on the ballot being shown.
  //
  // Filing records keep every candidate who ever entered the race, with a
  // status saying how far they got. Florida's August primary has already
  // happened, so a county race can carry someone who was defeated there and
  // someone who won outright. Listing them all implies a contest that is over.
  // "Defeated" and withdrawals come out; "Elected" and "Unopposed" stay,
  // because that person does hold the seat and a reader looking up the race
  // should see who won it.
  const DECIDED_AGAINST = new Set(["defeated", "withdrawn"]);
  const running = (row.candidacies ?? []).filter(
    (c) => !c.withdrew && !DECIDED_AGAINST.has(String(c.status ?? "").toLowerCase()),
  );

  const candidates: RaceCandidate[] = running
    .slice()
    .sort(
      (a, b) =>
        (a.ballot_order ?? 9999) - (b.ballot_order ?? 9999) ||
        a.display_name.localeCompare(b.display_name),
    )
    .map((c) => ({
      // A filed candidate usually has no `politicians` row -- the 539 members
      // of Congress are loaded, nobody running for county commission is. The
      // views link a candidate's name only when its id is in their `knownIds`
      // set, so a prefixed candidacy id is deliberately one that never
      // matches: it keys the list uniquely and renders as plain text instead
      // of a link to a profile page that does not exist.
      politicianId: c.politician_id ? (slugById.get(c.politician_id) ?? `candidacy:${c.id}`) : `candidacy:${c.id}`,
      name: c.display_name,
      party: toParty(c.party),
      status: c.status ?? undefined,
    }));

  const level = toLevel(office?.level);
  const seats = row.seats_to_fill ?? 1;
  const meta = [
    level,
    jurisdiction?.name ?? district?.name,
    `${candidates.length} ${candidates.length === 1 ? "candidate" : "candidates"}`,
    seats > 1 ? `${seats} seats` : null,
    row.is_nonpartisan ? "Nonpartisan" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    id: row.id,
    title,
    meta,
    candidates,
    districtId: district?.id,
    districtName: district?.name,
    level,
    districtKind: district?.kind,
    districtStateCode: district?.state_code?.trim() || undefined,
    isAtLarge: district?.is_at_large ?? false,
  };
}

/**
 * Slug lookup for the handful of candidacies that are matched to a loaded
 * politician. Skipped entirely when none are, which is the case today.
 */
async function politicianSlugsByUuid(
  supabase: NonNullable<ReturnType<typeof createPublicClient>>,
  ids: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();

  const { data } = await supabase.from("politicians").select("id, slug").in("id", unique);
  return new Map((data ?? []).map((r) => [r.id as string, r.slug as string]));
}

export async function listRaces(): Promise<Race[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("races").select(RACE_SELECT).order("title");
  if (error || !data) return [];

  const rows = data as unknown as RaceRow[];
  const linked = rows.flatMap((r) => (r.candidacies ?? []).map((c) => c.politician_id)).filter(Boolean) as string[];
  const slugById = await politicianSlugsByUuid(supabase, linked);

  return rows.map((r) => toRace(r, slugById));
}

export async function getRace(id: string): Promise<Race | undefined> {
  const supabase = createPublicClient();
  if (!supabase) return undefined;

  const { data, error } = await supabase.from("races").select(RACE_SELECT).eq("id", id).maybeSingle();
  if (error || !data) return undefined;

  const row = data as unknown as RaceRow;
  const linked = (row.candidacies ?? []).map((c) => c.politician_id).filter(Boolean) as string[];
  const slugById = await politicianSlugsByUuid(supabase, linked);

  return toRace(row, slugById);
}

export async function raceExists(id: string): Promise<boolean> {
  const supabase = createPublicClient();
  if (!supabase) return false;

  const { data } = await supabase.from("races").select("id").eq("id", id).maybeSingle();
  return Boolean(data);
}

// ---------------------------------------------------------------------------
// Bills
// ---------------------------------------------------------------------------

interface BillRow {
  id: string;
  number: string;
  title: string;
  chamber: string | null;
  session_label: string | null;
  plain_summary: string | null;
  status: string | null;
  introduced_on: string | null;
  source_url: string | null;
  retrieved_at: string | null;
}

const CHAMBER_LABEL: Record<string, string> = {
  house: "Florida House of Representatives",
  senate: "Florida Senate",
};

/**
 * Bills currently before the legislature.
 *
 * `plain_summary` is the legislature's own official summary as carried by
 * LegiScan, so it maps to `description` (the tile's "short official-ish
 * description"), never to `explanation`, which the Bill type reserves for
 * Hush's own plain-English paraphrase. Hush has not written those paraphrases,
 * so every bill sets `explainerTooComplex` -- the type's built-in honesty
 * valve -- and the card shows that admission instead of a "what a YES vote
 * means" that nobody wrote.
 */
export async function listBills(): Promise<Bill[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("bills")
    .select("id, number, title, chamber, session_label, plain_summary, status, introduced_on, source_url, retrieved_at")
    .order("number")
    .limit(200);

  if (error || !data) return [];

  return (data as BillRow[]).map((b) => ({
    id: b.id,
    number: b.number,
    title: b.title,
    chamber: CHAMBER_LABEL[String(b.chamber ?? "").toLowerCase()] ?? (b.session_label ?? "Florida Legislature"),
    level: "State" as Level,
    description: b.plain_summary ?? undefined,
    voteStage: b.status ?? undefined,
    // No Hush-written explainer exists for any bill yet -- see the doc comment.
    explainerTooComplex: true,
    sourceName: "LegiScan",
    sourceUrl: b.source_url ?? "https://legiscan.com/FL",
    dateAccessed: (b.retrieved_at ?? "").slice(0, 10),
  }));
}

// ---------------------------------------------------------------------------
// App content -- written by Hush, not ingested. Synchronous by design.
// ---------------------------------------------------------------------------

export function topicPool(): string[] {
  return TOPIC_POOL;
}

/** Issue Finder's question bank: issue -> its 8 specific sub-questions. */
export function issueFinderBank(): Record<string, string[]> {
  return ISSUE_FINDER_BANK;
}

/** Stance Check's per-issue statements: issue -> the statement text. */
export function stanceStatements(): Record<string, string> {
  return STANCE_STATEMENTS;
}

/** Stance Check's optional per-issue "why this matters" context. */
export function stanceWhyItMatters(): Record<string, string> {
  return STANCE_WHY_MATTERS;
}

// ---------------------------------------------------------------------------
// Not populated yet
//
// Each of these returns empty and says what has to land first. They are
// functions rather than deleted exports because the views already render an
// empty state for each one, and because the query that fills them is the only
// thing that has to change when the data arrives.
// ---------------------------------------------------------------------------

/** EMPTY: needs roll call ingestion (`votes` is 0 rows). */
export async function listVotes(): Promise<Record<string, VoteRecord[]>> {
  return {};
}

/** EMPTY: needs a human reviewer -- `fact_checks` has no rows and no pipeline. */
export async function listFactChecks(): Promise<FactCheck[]> {
  return [];
}

/** EMPTY: see listFactChecks. */
export async function factChecksFor(_politicianId: string): Promise<FactCheck[]> {
  void _politicianId;
  return [];
}

/** EMPTY: needs sourced position research (`policy_positions` is 0 rows). */
export async function guidePositions(): Promise<Record<string, Record<string, IssuePosition>>> {
  return {};
}

/** EMPTY: the Compare stance grid is derived from sourced positions. */
export async function stanceGrid(): Promise<Record<string, Record<string, StanceCell>>> {
  return {};
}

/** EMPTY: see guidePositions. */
export async function stancePositions(): Promise<Record<string, Record<string, StanceCheckPosition>>> {
  return {};
}

/** EMPTY: needs the feed pipeline (`feed_items` is 0 rows). */
export async function listElectionUpdates(): Promise<ElectionUpdate[]> {
  return [];
}

/** EMPTY: see listElectionUpdates. */
export async function listArticles(): Promise<ArticleRecord[]> {
  return [];
}

// ---------------------------------------------------------------------------
// Funding
// ---------------------------------------------------------------------------

/**
 * PostgREST serializes Postgres `numeric` as a JSON string, not a number, to
 * avoid float precision loss -- every money column here is `numeric`, so every
 * read of one needs this before it is usable. `null`/`undefined` pass through.
 */
function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * A politician's campaign funding picture, or `null` when there is nothing to
 * show -- either they have no `fecCandidateId` (never filed with the FEC) or
 * Supabase is not configured. A non-null result with an empty `filings` array
 * is the distinct "matched, nothing synced yet" state; callers must tell these
 * apart rather than treating both as "no data."
 */
export async function getFundingSummary(politicianId: string): Promise<FundingSummary | null> {
  const politician = await getPolitician(politicianId);
  if (!politician?.fecCandidateId) return null;
  if (!hasSupabase) return null;

  const supabase = createPublicClient();
  if (!supabase) return null;

  const { data: row } = await supabase
    .from("politicians")
    .select("id")
    .eq("fec_candidate_id", politician.fecCandidateId)
    .maybeSingle();

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
    ? (filingRows.map((f) => f.updated_at as string).sort().at(-1) ?? null)
    : null;

  return { fecCandidateId: politician.fecCandidateId, filings, lastSyncedAt };
}
