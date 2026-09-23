import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
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
// Campaign funding sync — see 0006_campaign_funding.sql's header comment.
// ---------------------------------------------------------------------------

const FEC_API_BASE = "https://api.open.fec.gov/v1";
/** Don't re-hit the FEC API if a sync already succeeded within this window. */
const FUNDING_SYNC_FRESHNESS_HOURS = 20;
/** Most recent filings per candidate, newest first. */
const FILINGS_PER_CANDIDATE = 8;

type CommitteeContributorType = "pac" | "party_committee" | "other_committee";

function entityTypeToContributorType(entityType: string | null | undefined): CommitteeContributorType {
  if (entityType === "PAC") return "pac";
  if (entityType === "PTY") return "party_committee";
  return "other_committee";
}

/**
 * Skips the sync entirely if one already succeeded recently — this route can
 * be hit by the daily cron and by a manual trigger without double-billing
 * FEC API calls or generating duplicate `funding_sync_runs` rows.
 */
async function runFundingSyncIfDue(supabase: ServiceClient) {
  if (!process.env.FEC_API_KEY) {
    return { skipped: "FEC_API_KEY not configured" };
  }

  const cutoff = new Date(Date.now() - FUNDING_SYNC_FRESHNESS_HOURS * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("funding_sync_runs")
    .select("id")
    .eq("state", "succeeded")
    .gte("started_at", cutoff)
    .limit(1)
    .maybeSingle();

  if (recent) return { skipped: "synced within freshness window" };

  return runFundingSync(supabase);
}

async function runFundingSync(supabase: ServiceClient) {
  const { data: run } = await supabase
    .from("funding_sync_runs")
    .insert({ state: "running" })
    .select("id")
    .single();

  if (!run) return { error: "could not create funding_sync_runs row" };

  let politiciansChecked = 0;
  let filingsCreated = 0;
  let filingsUpdated = 0;

  try {
    const { data: politicians, error } = await supabase
      .from("politicians")
      .select("id, fec_candidate_id")
      .not("fec_candidate_id", "is", null);

    if (error) throw new Error(error.message);

    for (const politician of politicians ?? []) {
      politiciansChecked++;
      const counts = await syncPoliticianFunding(
        supabase,
        politician.id as string,
        politician.fec_candidate_id as string,
      );
      filingsCreated += counts.created;
      filingsUpdated += counts.updated;
    }

    await supabase
      .from("funding_sync_runs")
      .update({
        state: "succeeded",
        finished_at: new Date().toISOString(),
        politicians_checked: politiciansChecked,
        filings_created: filingsCreated,
        filings_updated: filingsUpdated,
      })
      .eq("id", run.id);

    return { politiciansChecked, filingsCreated, filingsUpdated };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await supabase
      .from("funding_sync_runs")
      .update({
        state: "failed",
        finished_at: new Date().toISOString(),
        politicians_checked: politiciansChecked,
        filings_created: filingsCreated,
        filings_updated: filingsUpdated,
        error: message,
      })
      .eq("id", run.id);
    return { error: message };
  }
}

async function syncPoliticianFunding(
  supabase: ServiceClient,
  politicianRowId: string,
  fecCandidateId: string,
): Promise<{ created: number; updated: number }> {
  const apiKey = process.env.FEC_API_KEY;
  const url =
    `${FEC_API_BASE}/candidate/${encodeURIComponent(fecCandidateId)}/filings/` +
    `?sort=-coverage_end_date&per_page=${FILINGS_PER_CANDIDATE}&api_key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`FEC filings lookup failed for ${fecCandidateId}: ${res.status}`);
  const body = (await res.json()) as { results?: FecFiling[] };

  let created = 0;
  let updated = 0;

  for (const filing of body.results ?? []) {
    if (!filing.file_number || !filing.coverage_end_date) continue;

    const individualTotal =
      filing.individual_itemized_contributions != null || filing.individual_unitemized_contributions != null
        ? (filing.individual_itemized_contributions ?? 0) + (filing.individual_unitemized_contributions ?? 0)
        : null;

    const { data: existing } = await supabase
      .from("funding_filings")
      .select("id")
      .eq("politician_id", politicianRowId)
      .eq("fec_filing_id", String(filing.file_number))
      .maybeSingle();

    const { data: saved, error: upsertError } = await supabase
      .from("funding_filings")
      .upsert(
        {
          politician_id: politicianRowId,
          fec_filing_id: String(filing.file_number),
          period_label: `${filing.report_type_full ?? filing.report_type ?? "Filing"} ${filing.report_year ?? ""}`.trim(),
          coverage_start: filing.coverage_start_date,
          coverage_end: filing.coverage_end_date,
          total_raised: filing.total_receipts ?? null,
          total_spent: filing.total_disbursements ?? null,
          cash_on_hand: filing.cash_on_hand_end_period ?? null,
          individual_contributions_total: individualTotal,
          filed_at: filing.receipt_date ?? null,
          source_url: `https://www.fec.gov/data/candidate/${encodeURIComponent(fecCandidateId)}/?tab=filings`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "politician_id,fec_filing_id" },
      )
      .select("id")
      .single();

    if (upsertError || !saved) continue;
    existing ? updated++ : created++;

    // Committee/PAC contributions for this filing — best-effort. A failure
    // here (e.g. the Schedule A query shape drifting from what FEC returns)
    // must not lose the filing totals already saved above, so it's isolated
    // in its own try/catch rather than bubbling up to the whole sync.
    if (filing.committee_id) {
      try {
        await syncFilingContributors(supabase, saved.id as string, filing.committee_id, apiKey);
      } catch {
        // Filing stands without its committee breakdown; next sync retries.
      }
    }
  }

  return { created, updated };
}

async function syncFilingContributors(
  supabase: ServiceClient,
  fundingFilingId: string,
  committeeId: string,
  apiKey: string | undefined,
) {
  const url =
    `${FEC_API_BASE}/schedules/schedule_a/` +
    `?committee_id=${encodeURIComponent(committeeId)}&is_individual=false` +
    `&sort=-contribution_receipt_amount&per_page=20&api_key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Schedule A lookup failed for committee ${committeeId}: ${res.status}`);
  const body = (await res.json()) as { results?: FecScheduleAResult[] };

  // Re-derive this filing's contributor rows from scratch each sync rather
  // than diffing — simpler, and correct as long as a filing's contributor
  // list only ever comes from this one query.
  await supabase.from("funding_contributors").delete().eq("funding_filing_id", fundingFilingId);

  const rows = (body.results ?? [])
    .filter((r) => r.contributor_name && r.contribution_receipt_amount != null)
    .map((r) => ({
      funding_filing_id: fundingFilingId,
      committee_name: r.contributor_name as string,
      committee_fec_id: r.contributor_id ?? null,
      amount: r.contribution_receipt_amount as number,
      contributor_type: entityTypeToContributorType(r.entity_type),
    }));

  if (rows.length) await supabase.from("funding_contributors").insert(rows);
}

interface FecFiling {
  file_number?: number | string;
  coverage_start_date?: string | null;
  coverage_end_date?: string | null;
  total_receipts?: number | null;
  total_disbursements?: number | null;
  cash_on_hand_end_period?: number | null;
  individual_itemized_contributions?: number | null;
  individual_unitemized_contributions?: number | null;
  receipt_date?: string | null;
  report_type_full?: string | null;
  report_type?: string | null;
  report_year?: number | null;
  committee_id?: string | null;
}

interface FecScheduleAResult {
  contributor_name?: string | null;
  contributor_id?: string | null;
  contribution_receipt_amount?: number | null;
  entity_type?: string | null;
}
