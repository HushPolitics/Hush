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
      /** Span of the early voting sites' dates, e.g. "Oct 19 - Nov 1", when known. */
      earlyWindow: string | null;
      /**
       * A link to the county's own precinct finder with the voter's house number
       * and street filled in, for counties where we have checked how it works.
       * Null elsewhere. Used only when Google has no Election Day place.
       */
      precinct: { url: string; county: string } | null;
      /** Counts only (no addresses), to tell "Google has none" from "we dropped it". */
      diag: { electionId: string; polling: number; early: number; dropOff: number; retried: boolean };
    }
  | { ok: false; reason: "unconfigured" | "error" };

const BASE = "https://www.googleapis.com/civicinfo/v2";
const ELECTION_DAY = ELECTION_ISO.slice(0, 10); // "2026-11-03"
const MAX_EARLY_SITES = 5;

/**
 * Counties whose own precinct finder (run by the vendor VoterFocus) we have
 * opened and checked end to end, keyed by 5-digit FIPS (state + county) to the
 * vendor's county code. Add a county only after trying its finder, because the
 * codes are not guessable and a wrong one lands the voter on an empty form.
 *
 * We only build a link for the voter to click. We never fetch the vendor's
 * pages ourselves: its robots.txt asks automated tools not to.
 */
const VOTERFOCUS_COUNTIES: Record<string, string> = {
  "12103": "FL-PIN", // Pinellas, checked against 855 Central Ave and 100 1st Ave N, St. Petersburg
};

const CENSUS_GEOGRAPHIES = "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";

interface CensusGeoMatch {
  matchedAddress?: string;
  addressComponents?: {
    preDirection?: string;
    streetName?: string;
    suffixType?: string;
    suffixDirection?: string;
    zip?: string;
  };
  geographies?: { Counties?: { STATE?: string; COUNTY?: string; NAME?: string }[] };
}

/**
 * Builds the county precinct-finder link for an address, or null when the
 * county isn't one we have checked or the Census can't place the address.
 * The county comes from the Census geocoder (the same agency and benchmark the
 * rest of the app uses), and the street parts from its parse of the address, so
 * "100 1st Ave N" is sent the way the county's own form sends it.
 */
async function precinctFinderFor(address: string): Promise<{ url: string; county: string } | null> {
  const url =
    `${CENSUS_GEOGRAPHIES}?address=${encodeURIComponent(address)}` +
    `&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
  let match: CensusGeoMatch | undefined;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const body = (await res.json()) as { result?: { addressMatches?: CensusGeoMatch[] } };
    match = body.result?.addressMatches?.[0];
  } catch {
    return null;
  }
  const county = match?.geographies?.Counties?.[0];
  const code = county?.STATE && county?.COUNTY ? VOTERFOCUS_COUNTIES[county.STATE + county.COUNTY] : undefined;
  const parts = match?.addressComponents;
  const houseNumber = match?.matchedAddress?.match(/^(\d+)/)?.[1];
  if (!code || !parts?.streetName || !houseNumber) return null;

  // The county form encodes the street as "pre-direction|name|type|post-direction".
  const street = [parts.preDirection ?? "", parts.streetName, parts.suffixType ?? "", parts.suffixDirection ?? ""].join("|");
  const params = new URLSearchParams({
    streetNumber: houseNumber,
    streetNameComponents: street,
    zipCode: parts.zip ?? "",
    county: code,
  });
  return {
    url: `https://www.voterfocus.com/PrecinctFinder/addressSearchResults?${params.toString()}`,
    county: county?.NAME ?? "your county",
  };
}

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
  startDate?: string;
  endDate?: string;
  address?: CivicAddress;
  pollingHours?: string;
}

interface VoterInfo {
  pollingLocations?: CivicSite[];
  earlyVoteSites?: CivicSite[];
  dropOffLocations?: CivicSite[];
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

/**
 * Counties often publish early voting hours as one line per day ("Mon, Oct 19:
 * 7 am - 7 pm" for two weeks straight), which is unreadable in a small box.
 * When every day has the same hours it becomes one line ("Oct 19 - Nov 1, daily
 * 7 am - 7 pm"). When the days differ it says so rather than guessing, since
 * the county's own schedule is what the voter should follow.
 */
function summarizeHours(raw: string): string {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length <= 1) return lines[0] ?? "";

  const parsed = lines.map((l) => {
    const m = l.match(/^(?:[A-Za-z]{3},\s*)?([A-Za-z]{3}\s+\d{1,2}):\s*(.+)$/);
    return m ? { date: m[1], time: m[2].trim() } : null;
  });
  if (parsed.every((p): p is { date: string; time: string } => p !== null)) {
    const times = new Set(parsed.map((p) => p.time));
    if (times.size === 1) return `${parsed[0].date} - ${parsed[parsed.length - 1].date}, daily ${parsed[0].time}`;
  }
  return "Hours vary by day; see the county's schedule";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-19" -> sortable number (month*100+day) and label "Oct 19". */
function fromIso(iso: string | undefined): { key: number; label: string } | null {
  const m = iso?.match(/^\d{4}-(\d{2})-(\d{2})/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  return month >= 1 && month <= 12 ? { key: month * 100 + day, label: `${MONTHS[month - 1]} ${day}` } : null;
}

/** "Oct 19 - Nov 1, daily 7 am - 7 pm" (see summarizeHours) -> the two dates. */
function fromSummary(hours: string): { start: { key: number; label: string }; end: { key: number; label: string } } | null {
  const m = hours.match(/^([A-Za-z]{3}) (\d{1,2}) - ([A-Za-z]{3}) (\d{1,2}),/);
  if (!m) return null;
  const mo = (name: string) => MONTHS.findIndex((x) => x.toLowerCase() === name.toLowerCase()) + 1;
  const a = mo(m[1]);
  const b = mo(m[3]);
  if (!a || !b) return null;
  return {
    start: { key: a * 100 + Number(m[2]), label: `${MONTHS[a - 1]} ${Number(m[2])}` },
    end: { key: b * 100 + Number(m[4]), label: `${MONTHS[b - 1]} ${Number(m[4])}` },
  };
}

/**
 * The span the early voting sites cover, from Google's own start/end dates when
 * it sends them and otherwise from the dates in the published hours. Earliest
 * start to latest end across the sites, since counties differ.
 */
function earlyWindowOf(raw: CivicSite[], sites: PollingSite[]): string | null {
  const starts: { key: number; label: string }[] = [];
  const ends: { key: number; label: string }[] = [];
  raw.forEach((r, i) => {
    const a = fromIso(r.startDate);
    const b = fromIso(r.endDate);
    const h = sites[i] ? fromSummary(sites[i].hours) : null;
    if (a && b) {
      starts.push(a);
      ends.push(b);
    } else if (h) {
      starts.push(h.start);
      ends.push(h.end);
    }
  });
  if (starts.length === 0) return null;
  const start = starts.reduce((x, y) => (y.key < x.key ? y : x));
  const end = ends.reduce((x, y) => (y.key > x.key ? y : x));
  return `${start.label} - ${end.label}`;
}

function toSite(s: CivicSite): PollingSite {
  const a = s.address ?? {};
  const street = [a.line1, a.line2, a.line3].filter(Boolean).join(" ");
  const cityLine = [a.city, [a.state, a.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return {
    // Some sources put the venue name in the address block rather than `name`.
    name: (s.name || a.locationName || "").trim(),
    address: [street, cityLine].filter(Boolean).join(", "),
    hours: summarizeHours(s.pollingHours ?? ""),
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
  if (!election) {
    return {
      ok: true,
      electionDay: null,
      early: [],
      lookupUrl: null,
      earlyWindow: null,
      precinct: await precinctFinderFor(query),
      diag: { electionId: "none", polling: 0, early: 0, dropOff: 0, retried: false },
    };
  }

  let info = await civic<VoterInfo>("voterinfo", { address: query, electionId: election.id }, key);
  if (!info) return { ok: false, reason: "error" };

  // Google's own advice is to also query without an election id, which lets it
  // pick the election for the address. Tried only when the first answer has no
  // Election Day place, and used only if it does.
  let retried = false;
  if ((info.pollingLocations ?? []).length === 0) {
    retried = true;
    const again = await civic<VoterInfo>("voterinfo", { address: query }, key);
    if (again && (again.pollingLocations ?? []).length > 0) info = again;
  }

  const polling = (info.pollingLocations ?? []).map(toSite).filter((s) => s.address || s.name);
  const earlyRaw = (info.earlyVoteSites ?? []).filter((r) => toSite(r).address || toSite(r).name).slice(0, MAX_EARLY_SITES);
  const early = earlyRaw.map(toSite);
  const lookupUrl = info.state?.[0]?.electionAdministrationBody?.votingLocationFinderUrl ?? null;

  return {
    ok: true,
    electionDay: polling[0] ?? null,
    early,
    lookupUrl,
    earlyWindow: earlyWindowOf(earlyRaw, early),
    // Only worth a Census call when Google had no Election Day place to show.
    precinct: polling[0] ? null : await precinctFinderFor(query),
    diag: {
      electionId: election.id,
      polling: (info.pollingLocations ?? []).length,
      early: (info.earlyVoteSites ?? []).length,
      dropOff: (info.dropOffLocations ?? []).length,
      retried,
    },
  };
}
