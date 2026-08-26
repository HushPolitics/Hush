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
  if (!jobs?.length) return NextResponse.json({ ran: 0 });

  const results: { jobId: string; outcome: string }[] = [];

  for (const job of jobs) {
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

  return NextResponse.json({ ran: results.length, results });
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
