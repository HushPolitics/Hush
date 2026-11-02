import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { runLegiscanSync } from "@/lib/pipeline/legiscan";
import { assessClaim, shouldAutoPublish, PROMPT_VERSION, type EvidenceDoc } from "@/lib/pipeline/assess";

export const maxDuration = 300;

/**
 * Ingestion worker.
 *
 * Invoked by the Vercel cron in vercel.json. Pulls a bounded batch of queued
 * jobs and runs them. Bounded on purpose: a run that cannot finish inside the
 * function timeout leaves jobs half-done, so the queue drains across runs
 * rather than in one.
 *
 * Only `claim_assess` is implemented here — it is the stage with the real
 * design risk, and having it end-to-end is what makes the rest mechanical.
 * The remaining kinds are declared so the queue shape is settled.
 *
 * Campaign funding sync runs as a second, independent branch below the
 * claim_assess loop rather than as an `ingest_jobs` kind — see the header
 * comment on 0006_campaign_funding.sql for why it doesn't belong in that
 * queue (nothing about a funding filing needs the verdict/review-queue gate
 * `claim_assess` exists for). It tracks its own state in `funding_sync_runs`
 * and is idempotent within a run window, so hitting this route again before
 * the next scheduled run is harmless.
 */

const BATCH_SIZE = 5;
/** Independent passes per claim. Disagreement routes to human review. */
const PASSES = 2;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "supabase not configured" }, { status: 503 });
  }

  // `?job=legiscan` runs the LegiScan joint-resolution sync instead of the
  // queue. Dry run unless `&commit=1`. The daily cron sends no params, so it
  // is unaffected.
  const params = request.nextUrl.searchParams;
  if (params.get("job") === "legiscan") {
    try {
      return NextResponse.json(await runLegiscanSync(supabase, { commit: params.get("commit") === "1" }));
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
    }
  }

  const { data: jobs, error } = await supabase
    .from("ingest_jobs")
    .select("id, kind, claim_id, politician_id, payload")
    .eq("state", "queued")
    .eq("kind", "claim_assess")
    .lte("run_at", new Date().toISOString())
    .order("run_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { jobId: string; outcome: string }[] = [];

  for (const job of jobs ?? []) {
    await supabase
      .from("ingest_jobs")
      .update({ state: "running", started_at: new Date().toISOString() })
      .eq("id", job.id);

    try {
      const outcome = await runClaimAssess(supabase, job.claim_id as string);
      await supabase
        .from("ingest_jobs")
        .update({ state: "succeeded", finished_at: new Date().toISOString() })
        .eq("id", job.id);
      results.push({ jobId: job.id as string, outcome });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await supabase
        .from("ingest_jobs")
        .update({
          state: "failed",
          last_error: message,
          finished_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      results.push({ jobId: job.id as string, outcome: `failed: ${message}` });
    }
  }

  const funding = await runFundingSyncIfDue(supabase);

  return NextResponse.json({ ran: results.length, results, funding });
}

type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>;

async function runClaimAssess(supabase: ServiceClient, claimId: string): Promise<string> {
  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("id, claim_text, stated_at, context, politician_id, politicians(display_name)")
    .eq("id", claimId)
    .single();

  if (claimError || !claim) throw new Error(`claim not found: ${claimId}`);

  // Evidence: sources that mention this politician, best sources first.
  const { data: mentions } = await supabase
    .from("politician_mentions")
    .select(
      "sources(id, title, publisher, published_at, source_kind, reliability, raw_text)",
    )
    .eq("politician_id", claim.politician_id)
    .gte("match_confidence", 0.8)
    .limit(12);

  const evidence: EvidenceDoc[] = (mentions ?? [])
    .map((m) => {
      const s = m.sources as unknown as {
        id: string;
        title: string | null;
        publisher: string | null;
        published_at: string | null;
        source_kind: string;
        reliability: number;
        raw_text: string | null;
      } | null;
      if (!s) return null;
      return {
        sourceId: s.id,
        title: s.title ?? "Untitled",
        publisher: s.publisher ?? "Unknown",
        publishedAt: s.published_at,
        kind: s.source_kind,
        reliability: Number(s.reliability),
        excerpt: (s.raw_text ?? "").slice(0, 6000),
      };
    })
    .filter((d): d is EvidenceDoc => d !== null);

  if (evidence.length === 0) return "skipped: no evidence";

  const speaker =
    (claim.politicians as unknown as { display_name: string } | null)?.display_name ?? "Unknown";

  // Independent passes: the evidence order is reversed on the second so the
  // model is not anchored the same way twice.
  const assessments = [];
  for (let i = 0; i < PASSES; i++) {
    const ordered = i % 2 === 0 ? evidence : evidence.slice().reverse();
    const a = await assessClaim({
      claimText: claim.claim_text as string,
      speaker,
      statedAt: claim.stated_at as string | null,
      context: claim.context as string | null,
      evidence: ordered,
    });
    assessments.push(a);

    await supabase.from("claim_assessments").insert({
      claim_id: claimId,
      model: process.env.ASSESS_MODEL ?? "claude-sonnet-4-5",
      prompt_version: PROMPT_VERSION,
      verdict: a.verdict,
      finding: a.finding,
      confidence: a.confidence,
      evidence: a.usedSourceIds.map((id) => ({ source_id: id })),
      disconfirming_note: a.disconfirmingNote,
    });
  }

  const decision = shouldAutoPublish({
    assessments,
    evidence,
    inContestedWindow: false, // wired to elections.election_date in the next pass
  });

  const winner = assessments[0];

  const { data: fc, error: fcError } = await supabase
    .from("fact_checks")
    .insert({
      claim_id: claimId,
      verdict: winner.verdict,
      finding: winner.finding,
      confidence: Math.min(...assessments.map((a) => a.confidence)),
      state: decision.publish ? "published" : "in_review",
      published_at: decision.publish ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (fcError || !fc) throw new Error(`could not record fact check: ${fcError?.message}`);

  const cited = new Set(assessments.flatMap((a) => a.usedSourceIds));
  if (cited.size) {
    await supabase.from("fact_check_sources").insert(
      [...cited].map((sourceId) => ({
        fact_check_id: fc.id,
        source_id: sourceId,
        role: "supports",
      })),
    );
  }

  if (!decision.publish) {
    await supabase.from("review_queue").insert({
      subject_kind: "fact_check",
      subject_id: fc.id,
      reason: decision.reason,
      priority: decision.reason === "disagreement" ? 1 : 3,
    });
  }

  return decision.publish ? `published ${winner.verdict}` : `review: ${decision.reason}`;
}

// ---------------------------------------------------------------------------
// Campaign funding sync -- see 0006_campaign_funding.sql's header comment.
//
// Federal races only, because the FEC only covers federal candidates. Scope is
// Florida's 2026 U.S. Senate and U.S. House candidates who are on the ballot
// (not withdrawn) and have a politician row. Two steps:
//   1. Match each one to their FEC candidate id by name. Only a single,
//      unambiguous match is accepted; anything else is reported and skipped.
//   2. Pull the cycle-to-date totals (raised, spent, cash on hand, individual
//      giving) from the FEC and store them as one row per candidate.
// Committee/PAC contributor names are not synced yet.
//
// It is a dry run unless FUNDING_COMMIT=1 is set: it calls the FEC and logs
// what it WOULD write, so the numbers can be checked against fec.gov before
// anything reaches the database.
// ---------------------------------------------------------------------------

const FEC_API_BASE = "https://api.open.fec.gov/v1";
/** Don't re-hit the FEC API if a committed sync already succeeded within this window. */
const FUNDING_SYNC_FRESHNESS_HOURS = 20;
const FEC_CYCLE = 2026;
/** Parallel FEC requests at a time; the FEC allows far more, this just stays polite. */
const FEC_CONCURRENCY = 3;

interface FederalCandidate {
  politicianId: string;
  name: string;
  fecId: string | null;
  office: "H" | "S";
  district: string | null;
}

interface FecCandidateHit {
  candidate_id: string;
  name: string;
}

interface FecTotals {
  receipts?: number | null;
  disbursements?: number | null;
  cash_on_hand_end_period?: number | null;
  last_cash_on_hand_end_period?: number | null;
  individual_contributions?: number | null;
  individual_itemized_contributions?: number | null;
  individual_unitemized_contributions?: number | null;
  coverage_start_date?: string | null;
  coverage_end_date?: string | null;
  last_report_type_full?: string | null;
}

const FEC_MAX_ATTEMPTS = 5;

async function fecGet<T>(path: string, params: Record<string, string>): Promise<T[]> {
  const key = process.env.FEC_API_KEY ?? "";
  const qs = new URLSearchParams({ ...params, api_key: key });
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${FEC_API_BASE}${path}?${qs}`);
    if (res.ok) {
      const body = (await res.json()) as { results?: T[] };
      return body.results ?? [];
    }
    // Rate limited: wait (honoring Retry-After when sent) and try again.
    if (res.status === 429 && attempt < FEC_MAX_ATTEMPTS) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1500 * 2 ** (attempt - 1);
      await new Promise((r) => setTimeout(r, Math.min(waitMs, 20000)));
      continue;
    }
    // The message names the path and the FEC's own explanation, never the URL or key.
    let detail = "";
    try {
      detail = (await res.text()).replaceAll(key, "[key]").replace(/\s+/g, " ").slice(0, 160);
    } catch {
      /* ignore */
    }
    const remaining = res.headers.get("x-ratelimit-remaining");
    throw new Error(
      `FEC ${path} failed: ${res.status}${remaining != null ? ` (remaining ${remaining})` : ""}${detail ? ` ${detail}` : ""}`,
    );
  }
}

async function inBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}

function first<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

const NAME_SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "md", "dr"]);

function normalizeName(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !NAME_SUFFIXES.has(w));
}

/** "Debbie Wasserman Schultz" -> first "debbie", last "schultz". */
function politicianNameParts(fullName: string) {
  const t = normalizeName(fullName);
  return { first: t[0] ?? "", last: t[t.length - 1] ?? "" };
}

/** FEC lists names as "WASSERMAN SCHULTZ, DEBBIE". */
function fecNameParts(fecName: string) {
  const [last = "", rest = ""] = fecName.split(",");
  const l = normalizeName(last);
  const f = normalizeName(rest);
  return { first: f[0] ?? "", last: l[l.length - 1] ?? "" };
}

async function loadFederalCandidates(supabase: ServiceClient): Promise<FederalCandidate[]> {
  const { data, error } = await supabase
    .from("candidacies")
    .select("politicians(id, full_name, fec_candidate_id), races(offices(title))")
    .eq("withdrew", false)
    .not("politician_id", "is", null);
  if (error) throw new Error(error.message);

  type Row = {
    politicians: { id: string; full_name: string; fec_candidate_id: string | null } | { id: string; full_name: string; fec_candidate_id: string | null }[] | null;
    races: { offices: { title: string } | { title: string }[] | null } | { offices: { title: string } | { title: string }[] | null }[] | null;
  };

  const byPolitician = new Map<string, FederalCandidate>();
  for (const row of (data ?? []) as unknown as Row[]) {
    const politician = first(row.politicians);
    const title = first(first(row.races)?.offices)?.title;
    if (!politician || !title) continue;

    const house = /^U\.S\. Representative, FL-(\d+)/i.exec(title);
    const senate = /^(U\.S\.|United States) Senator\b/i.test(title);
    if (!house && !senate) continue;

    byPolitician.set(politician.id, {
      politicianId: politician.id,
      name: politician.full_name,
      fecId: politician.fec_candidate_id,
      office: house ? "H" : "S",
      district: house ? house[1].padStart(2, "0") : null,
    });
  }
  return [...byPolitician.values()];
}

/** The candidate's FEC id, or null unless exactly one FEC candidate matches. */
async function findFecCandidateId(c: FederalCandidate): Promise<string | null> {
  const mine = politicianNameParts(c.name);
  if (!mine.last) return null;
  const hits = await fecGet<FecCandidateHit>("/candidates/search/", {
    q: mine.last,
    state: "FL",
    office: c.office,
    election_year: String(FEC_CYCLE),
    per_page: "50",
    ...(c.district ? { district: c.district } : {}),
  });
  const sameLast = hits.filter((h) => fecNameParts(h.name).last === mine.last);
  const strict = sameLast.filter((h) => {
    const theirs = fecNameParts(h.name).first;
    return !!theirs && !!mine.first && (theirs === mine.first || theirs.startsWith(mine.first) || mine.first.startsWith(theirs));
  });
  if (strict.length === 1) return strict[0].candidate_id;
  if (strict.length > 1) return null;
  // Nicknames ("Angie" vs "Angela"): accept a single same-initial hit for this
  // state, office and district. Anything ambiguous stays unmatched.
  const byInitial = sameLast.filter((h) => !!mine.first && fecNameParts(h.name).first[0] === mine.first[0]);
  return byInitial.length === 1 ? byInitial[0].candidate_id : null;
}

async function fetchCycleTotals(fecId: string): Promise<FecTotals | null> {
  const rows = await fecGet<FecTotals>(`/candidate/${encodeURIComponent(fecId)}/totals/`, {
    cycle: String(FEC_CYCLE),
    election_full: "false",
    per_page: "10",
  });
  // Newest report coverage first, in case more than one row comes back.
  const t = [...rows].sort((a, b) => (b.coverage_end_date ?? "").localeCompare(a.coverage_end_date ?? ""))[0];
  return t && t.coverage_end_date && t.receipts != null ? t : null;
}

/**
 * Skips the sync entirely if a committed one already succeeded recently, so the
 * daily cron and a manual run from the Vercel dashboard can't double up. A dry
 * run has no such limit: it writes nothing.
 */
async function runFundingSyncIfDue(supabase: ServiceClient) {
  if (!process.env.FEC_API_KEY) {
    return { skipped: "FEC_API_KEY not configured" };
  }

  const commit = process.env.FUNDING_COMMIT === "1";

  if (commit) {
    const cutoff = new Date(Date.now() - FUNDING_SYNC_FRESHNESS_HOURS * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("funding_sync_runs")
      .select("id")
      .eq("state", "succeeded")
      .gte("started_at", cutoff)
      .limit(1)
      .maybeSingle();
    if (recent) return { skipped: "synced within freshness window" };
  }

  const result = await runFundingSync(supabase, commit);
  console.log("[funding]", JSON.stringify(result));
  return result;
}

async function runFundingSync(supabase: ServiceClient, commit: boolean) {
  let runId: string | null = null;
  if (commit) {
    const { data: run } = await supabase.from("funding_sync_runs").insert({ state: "running" }).select("id").single();
    if (!run) return { error: "could not create funding_sync_runs row" };
    runId = run.id as string;
  }

  const errors: string[] = [];
  const unmatched: string[] = [];
  const preview: Record<string, unknown>[] = [];
  let idsResolved = 0;
  let noTotals = 0;
  let filingsCreated = 0;
  let filingsUpdated = 0;
  let checked = 0;

  try {
    const candidates = await loadFederalCandidates(supabase);

    // Step 1: fill in missing FEC candidate ids.
    await inBatches(
      candidates.filter((c) => !c.fecId),
      FEC_CONCURRENCY,
      async (c) => {
        try {
          const id = await findFecCandidateId(c);
          if (!id) {
            unmatched.push(`${c.name} (${c.office}${c.district ? "-" + c.district : ""})`);
            return;
          }
          c.fecId = id;
          idsResolved++;
          if (commit) {
            await supabase
              .from("politicians")
              .update({ fec_candidate_id: id })
              .eq("id", c.politicianId)
              .is("fec_candidate_id", null);
          }
        } catch (e) {
          errors.push(`${c.name}: ${e instanceof Error ? e.message : String(e)}`);
        }
      },
    );

    // Step 2: cycle-to-date totals for everyone with an id.
    await inBatches(
      candidates.filter((c) => c.fecId),
      FEC_CONCURRENCY,
      async (c) => {
        checked++;
        try {
          const t = await fetchCycleTotals(c.fecId as string);
          if (!t) {
            noTotals++;
            return;
          }
          const individualTotal =
            t.individual_contributions ??
            (t.individual_itemized_contributions != null || t.individual_unitemized_contributions != null
              ? (t.individual_itemized_contributions ?? 0) + (t.individual_unitemized_contributions ?? 0)
              : null);

          preview.push({
            name: c.name,
            office: c.office + (c.district ? "-" + c.district : ""),
            fecId: c.fecId,
            raised: t.receipts,
            spent: t.disbursements ?? null,
            cashOnHand: t.last_cash_on_hand_end_period ?? t.cash_on_hand_end_period ?? null,
            fromIndividuals: individualTotal,
            through: t.coverage_end_date,
            report: t.last_report_type_full ?? null,
          });

          if (!commit) return;

          const filingKey = `cycle-${FEC_CYCLE}`;
          const { data: existing } = await supabase
            .from("funding_filings")
            .select("id")
            .eq("politician_id", c.politicianId)
            .eq("fec_filing_id", filingKey)
            .maybeSingle();
          const { error: upsertError } = await supabase.from("funding_filings").upsert(
            {
              politician_id: c.politicianId,
              fec_filing_id: filingKey,
              period_label: `${t.last_report_type_full ?? "Latest FEC report"} (through ${new Date(t.coverage_end_date as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })})`,
              coverage_start: t.coverage_start_date ?? null,
              coverage_end: t.coverage_end_date,
              total_raised: t.receipts,
              total_spent: t.disbursements ?? null,
              cash_on_hand: t.last_cash_on_hand_end_period ?? t.cash_on_hand_end_period ?? null,
              individual_contributions_total: individualTotal,
              filed_at: null,
              source_url: `https://www.fec.gov/data/candidate/${encodeURIComponent(c.fecId as string)}/?cycle=${FEC_CYCLE}`,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "politician_id,fec_filing_id" },
          );
          if (upsertError) throw new Error(upsertError.message);
          if (existing) filingsUpdated++;
          else filingsCreated++;
        } catch (e) {
          errors.push(`${c.name}: ${e instanceof Error ? e.message : String(e)}`);
        }
      },
    );

    if (runId) {
      await supabase
        .from("funding_sync_runs")
        .update({
          state: "succeeded",
          finished_at: new Date().toISOString(),
          politicians_checked: checked,
          filings_created: filingsCreated,
          filings_updated: filingsUpdated,
        })
        .eq("id", runId);
    }

    return {
      mode: commit ? "commit" : "dry-run (set FUNDING_COMMIT=1 to write)",
      candidates: candidates.length,
      idsResolved,
      unmatched,
      checked,
      noTotals,
      filingsCreated,
      filingsUpdated,
      errors,
      preview,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (runId) {
      await supabase
        .from("funding_sync_runs")
        .update({
          state: "failed",
          finished_at: new Date().toISOString(),
          politicians_checked: checked,
          filings_created: filingsCreated,
          filings_updated: filingsUpdated,
          error: message,
        })
        .eq("id", runId);
    }
    return { error: message };
  }
}
