import type { createServiceClient } from "@/lib/supabase/server";

type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>;

/**
 * LegiScan sync for Florida joint resolutions.
 *
 * Why this exists: a constitutional amendment on the ballot is the end of a
 * legislative joint resolution (HJR/SJR), and the original bills load only
 * carried regular bills (HB/SB). This pulls the joint resolutions so the
 * ballot-measures section can read them from `bills` instead of being typed
 * in by hand.
 *
 * Safe by default: unless `commit` is true this only reads from LegiScan and
 * reports what it found. Nothing is written. Writes are an upsert on
 * (external_source, external_id), so running it twice never duplicates rows.
 *
 * Requires LEGISCAN_API_KEY (server-only, never NEXT_PUBLIC_). The key is only
 * ever sent to LegiScan, and is stripped from any error text before it is
 * returned.
 */

const API = "https://api.legiscan.com/";
const STATE = "FL";
/** First calendar year to sync. 2025 matters: amendments passed then are on the 2026 ballot. */
const FROM_YEAR = 2025;

/** LegiScan's numeric bill status -> the text values already stored in `bills.status`. */
const STATUS_TEXT: Record<number, string> = {
  1: "Introduced",
  2: "Engrossed",
  3: "Passed", // Enrolled: passed both chambers
  4: "Passed",
  5: "Vetoed",
  6: "Failed",
};

interface LegiScanSession {
  session_id: number;
  year_start: number;
  year_end: number;
  special: number;
  session_name: string;
}

interface MasterListEntry {
  bill_id: number;
  number: string;
  title: string;
  description: string;
  status: number;
  status_date: string;
  last_action_date: string;
  last_action: string;
  url: string;
}

export interface JointResolution {
  sessionId: number;
  session: string;
  billId: number;
  number: string;
  title: string;
  description: string;
  status: string;
  lastActionDate: string;
  lastAction: string;
  url: string;
}

async function call(key: string, params: Record<string, string | number>): Promise<Record<string, unknown>> {
  const qs = new URLSearchParams({ key, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
  let res: Response;
  try {
    res = await fetch(`${API}?${qs.toString()}`, { cache: "no-store" });
  } catch (e) {
    throw new Error(`LegiScan request failed: ${scrub(e instanceof Error ? e.message : String(e), key)}`);
  }
  if (!res.ok) throw new Error(`LegiScan returned HTTP ${res.status} for ${String(params.op)}`);
  const body = (await res.json()) as Record<string, unknown>;
  if (body.status !== "OK") {
    const alert = (body.alert as { message?: string } | undefined)?.message ?? "unknown error";
    throw new Error(`LegiScan ${String(params.op)}: ${scrub(alert, key)}`);
  }
  return body;
}

function scrub(text: string, key: string): string {
  return text.split(key).join("<key>");
}

export async function fetchJointResolutions(key: string): Promise<{ sessions: string[]; resolutions: JointResolution[] }> {
  const list = await call(key, { op: "getSessionList", state: STATE });
  const sessions = ((list.sessions as LegiScanSession[]) ?? []).filter((s) => s.year_end >= FROM_YEAR);

  const resolutions: JointResolution[] = [];
  for (const s of sessions) {
    const master = await call(key, { op: "getMasterList", id: s.session_id });
    const entries = Object.entries((master.masterlist as Record<string, unknown>) ?? {})
      // "session" is metadata; everything else is a numbered bill entry.
      .filter(([k]) => k !== "session")
      .map(([, v]) => v as MasterListEntry);

    for (const b of entries) {
      if (!/^[HS]JR\d+/i.test(b.number)) continue;
      resolutions.push({
        sessionId: s.session_id,
        session: s.session_name,
        billId: b.bill_id,
        number: b.number,
        title: b.title,
        description: b.description,
        status: STATUS_TEXT[b.status] ?? `LegiScan status ${b.status}`,
        lastActionDate: b.last_action_date,
        lastAction: b.last_action,
        url: b.url,
      });
    }
  }

  return { sessions: sessions.map((s) => s.session_name), resolutions };
}

export async function runLegiscanSync(supabase: ServiceClient, opts: { commit: boolean }) {
  const key = process.env.LEGISCAN_API_KEY;
  if (!key) throw new Error("LEGISCAN_API_KEY is not set");

  const { sessions, resolutions } = await fetchJointResolutions(key);

  const byStatus: Record<string, number> = {};
  for (const r of resolutions) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

  if (!opts.commit) {
    return { mode: "dry-run", sessions, total: resolutions.length, byStatus, resolutions };
  }

  // Reuse the jurisdiction the existing Florida bills already point at.
  const { data: existing, error: jErr } = await supabase
    .from("bills")
    .select("jurisdiction_id")
    .eq("external_source", "legiscan")
    .not("jurisdiction_id", "is", null)
    .limit(1)
    .maybeSingle();
  if (jErr || !existing) throw new Error("could not find the Florida jurisdiction from existing bills");

  const now = new Date().toISOString();
  const rows = resolutions.map((r) => ({
    jurisdiction_id: existing.jurisdiction_id,
    chamber: r.number.toUpperCase().startsWith("H") ? "house" : "senate",
    session_label: `${STATE} ${r.session}`,
    number: r.number,
    title: r.title,
    plain_summary: r.description || null,
    status: r.status,
    source_url: r.url,
    external_source: "legiscan",
    external_id: String(r.billId),
    retrieved_at: now,
  }));

  const { error } = await supabase.from("bills").upsert(rows, { onConflict: "external_source,external_id" });
  if (error) throw new Error(`upsert failed: ${error.message}`);

  return { mode: "commit", sessions, total: resolutions.length, byStatus, written: rows.length };
}
