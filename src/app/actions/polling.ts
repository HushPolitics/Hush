"use server";

import { ELECTION_ISO } from "@/lib/app-content";

/**
 * Where a voter votes, from Google's Civic Information API.
 *
 * That API serves the polling places, early voting sites and ballot drop-off
 * locations that state and county election offices publish, and it also hands
 * back each state's own "find your polling place" page. We pass those through
 * as published and add nothing to them.
 *
 * Requires GOOGLE_CIVIC_API_KEY (server-only, never NEXT_PUBLIC_). The key is
 * only ever sent to Google, and is stripped from any text that could be logged.
 *
 * Two outcomes are kept distinct on purpose, because they mean different
 * things to the voter:
 *   ok, electionDay: null  -- the address is fine but the county has not
 *                             published a polling place yet. Say so, and send
 *                             them to the official lookup, rather than guess.
 *   ok: false              -- the lookup itself did not work.
 */

export interface PollingSite {
  /** Venue name, e.g. "Lakeview Library". May be empty when none was published. */
  name: string;
  /** One line: street, city, state ZIP. */
  address: string;
  /** Opening hours exactly as published, e.g. "7am to 7pm". Empty when unpublished. */
  hours: string;
}

export type PollingLookupResult =
  | {
      ok: true;
      /** The assigned Election Day polling place, or null when not published yet. */
      electionDay: PollingSite | null;
      /** Early voting sites near the address (published order, capped). */
      early: PollingSite[];
      /** The state's own polling-place finder, when Google has one on file. */
      lookupUrl: string | null;
    }
  | { ok: false; reason: "unconfigured" | "error" };

const BASE = "https://www.googleapis.com/civicinfo/v2";
const ELECTION_DAY = ELECTION_ISO.slice(0, 10); // "2026-11-03"
const MAX_EARLY_SITES = 5;

interface CivicAddress {
  locationName?: string;
  line1?: string;
  line2?: string;
  line3?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface CivicSite {
  name?: string;
  address?: CivicAddress;
  pollingHours?: string;
}

interface VoterInfo {
  pollingLocations?: CivicSite[];
  earlyVoteSites?: CivicSite[];
  state?: { electionAdministrationBody?: { votingLocationFinderUrl?: string } }[];
}

async function civic<T>(path: string, params: Record<string, string>, key: string): Promise<T | null> {
  const qs = new URLSearchParams({ ...params, key });
  try {
    const res = await fetch(`${BASE}/${path}?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function toSite(s: CivicSite): PollingSite {
  const a = s.address ?? {};
  const street = [a.line1, a.line2, a.line3].filter(Boolean).join(" ");
  const cityLine = [a.city, [a.state, a.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return {
    // Some sources put the venue name in the address block rather than `name`.
    name: (s.name || a.locationName || "").trim(),
    address: [street, cityLine].filter(Boolean).join(", "),
    hours: (s.pollingHours ?? "").trim(),
  };
}

export async function lookupPollingPlace(address: string): Promise<PollingLookupResult> {
  const key = process.env.GOOGLE_CIVIC_API_KEY;
  if (!key) return { ok: false, reason: "unconfigured" };

  const query = address.trim();
  if (query.length < 5) return { ok: false, reason: "error" };

  // Find Google's id for the Nov 3 election rather than hardcoding one: ids are
  // assigned per election by Google, and the API only returns polling data for
  // an election it has on file for the address.
  const list = await civic<{ elections?: { id: string; electionDay: string }[] }>("elections", {}, key);
  if (!list) return { ok: false, reason: "error" };
  const election = (list.elections ?? []).find((e) => e.electionDay === ELECTION_DAY);
  if (!election) return { ok: true, electionDay: null, early: [], lookupUrl: null };

  const info = await civic<VoterInfo>("voterinfo", { address: query, electionId: election.id }, key);
  if (!info) return { ok: false, reason: "error" };

  const polling = (info.pollingLocations ?? []).map(toSite).filter((s) => s.address || s.name);
  const early = (info.earlyVoteSites ?? [])
    .map(toSite)
    .filter((s) => s.address || s.name)
    .slice(0, MAX_EARLY_SITES);
  const lookupUrl = info.state?.[0]?.electionAdministrationBody?.votingLocationFinderUrl ?? null;

  return { ok: true, electionDay: polling[0] ?? null, early, lookupUrl };
}
