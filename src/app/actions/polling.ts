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
       * A link to the county's own polling place finder. `prefilled` is true when
       * the voter's house number and street are in the link (counties where we
       * have checked how the form works) and false when it is just the county's
       * page. Null outside Florida. Used only when Google has no Election Day place.
       */
      precinct: { url: string; county: string; prefilled: boolean } | null;
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

/**
 * Every Florida county's own page for finding a polling place, keyed by FIPS.
 * For counties whose precinct finder we haven't opened and checked end to end
 * (everything but VOTERFOCUS_COUNTIES) the voter lands on that page and types
 * their address there, so nothing about the address is sent. Where a county's
 * dedicated finder page couldn't be confirmed, the entry is the county
 * elections office's home page instead of a guessed deep link.
 * Sourced from each supervisor of elections' site and the FL Division of
 * Elections list of precinct lookups; re-check before each election.
 */
const FL_COUNTY_FINDERS: Record<string, { name: string; url: string }> = {
  "12001": { name: "Alachua", url: "https://www.votealachua.gov/207/Precinct-Voting" },
  "12003": { name: "Baker", url: "https://votebakerfl.gov/precinct-finder/" },
  "12005": { name: "Bay", url: "https://www.bayvotesfl.gov/" },
  "12007": { name: "Bradford", url: "https://www.votebradfordfl.gov/voter/polling_locations.php" },
  "12009": { name: "Brevard", url: "https://www.votebrevard.gov/Voter-Information/Find-Your-Precinct" },
  "12011": { name: "Broward", url: "https://browardvotes.gov/voters/precinct-finder" },
  "12013": { name: "Calhoun", url: "https://votecalhounfl.gov/" },
  "12015": { name: "Charlotte", url: "https://www.soecharlottecountyfl.gov/" },
  "12017": { name: "Citrus", url: "https://www.votecitrus.gov/230/Precinct-Finder" },
  "12019": { name: "Clay", url: "https://www.clayelections.gov/Election-Information/Precinct-Finder" },
  "12021": { name: "Collier", url: "https://www.colliervotes.gov/165/Find-My-Precinct" },
  "12023": { name: "Columbia", url: "https://www.votecolumbiafl.gov/voter_information/precincts_and_maps.php" },
  "12027": { name: "DeSoto", url: "https://votedesotofl.gov/voter-information/precinct-finder/" },
  "12029": { name: "Dixie", url: "https://dixievotes.gov/voter-resources/precinct-finder/" },
  "12031": { name: "Duval", url: "https://www.duvalelections.gov/204" },
  "12033": { name: "Escambia", url: "https://escambiavotes.gov/precinct-finder" },
  "12035": { name: "Flagler", url: "https://www.flaglerelections.gov/My-Voter-Info/Find-Your-Precinct" },
  "12037": { name: "Franklin", url: "https://www.votefranklinfl.gov/voter_information/precinct.php" },
  "12039": { name: "Gadsden", url: "https://votegadsdenfl.gov/election-info/precinct-information/precinct-lookup/" },
  "12041": { name: "Gilchrist", url: "https://www.votegilchrist.com/information_for_voters/precinct_finder.php" },
  "12043": { name: "Glades", url: "https://voteglades.gov/voting-info/precinct-finder/" },
  "12045": { name: "Gulf", url: "https://votegulf.gov/voters/where-to-vote/" },
  "12047": { name: "Hamilton", url: "https://www.hamiltonvotesfl.gov/" },
  "12049": { name: "Hardee", url: "https://hardeeflvotes.gov/voter-information-sample-ballot/find-my-precinct/" },
  "12051": { name: "Hendry", url: "https://hendryelections.gov/voter/precinct_finder.php" },
  "12053": { name: "Hernando", url: "https://www.hernandovotes.gov/" },
  "12055": { name: "Highlands", url: "https://www.votehighlands.gov/where-do-i-vote" },
  "12057": { name: "Hillsborough", url: "https://votehillsborough.gov/Q5page" },
  "12059": { name: "Holmes", url: "https://holmeselectionsfl.gov/voter-information/where-to-vote/precinct-finder/" },
  "12061": { name: "Indian River", url: "https://www.voteindianriver.com/Polling-Places/Find-My-Polling-Place" },
  "12063": { name: "Jackson", url: "https://www.votejacksonfl.gov/" },
  "12065": { name: "Jefferson", url: "https://www.jeffersonvotesfl.gov/" },
  "12067": { name: "Lafayette", url: "https://www.lafayettevotes.net/" },
  "12069": { name: "Lake", url: "https://www.lakevotes.gov/164/Find-My-Precinct" },
  "12071": { name: "Lee", url: "https://www.lee.vote/245/Precincts-and-Polling-Places" },
  "12073": { name: "Leon", url: "https://www.leonvotes.gov/Registration/Check-Your-Info" },
  "12075": { name: "Levy", url: "https://www.votelevy.gov/voters/where-to-vote-in-person/" },
  "12077": { name: "Liberty", url: "https://libertycountyflsoe.gov/" },
  "12079": { name: "Madison", url: "https://www.votemadison.com/where-to-vote-in-person/" },
  "12081": { name: "Manatee", url: "https://www.votemanatee.gov/precinct-finder/" },
  "12083": { name: "Marion", url: "https://www.votemarion.gov/335/Find-My-Voting-Location" },
  "12085": { name: "Martin", url: "https://www.martinvotes.gov/election-information/precinct-maps/" },
  "12086": { name: "Miami-Dade", url: "https://www.votemiamidade.gov/elections/voters/information.page" },
  "12087": { name: "Monroe", url: "https://www.votemonroeflkeys.gov/Where-to-Vote/Search" },
  "12089": { name: "Nassau", url: "https://www.votenassaufl.gov/where-do-i-vote" },
  "12091": { name: "Okaloosa", url: "https://www.voteokaloosa.gov/voters/where-to-vote-in-person/" },
  "12093": { name: "Okeechobee", url: "https://voteokeechobee.gov/voter-information/find-your-precinct/" },
  "12095": { name: "Orange", url: "https://voteorangefl.gov/find-your-polling-place/" },
  "12097": { name: "Osceola", url: "https://www.voteosceola.gov/" },
  "12099": { name: "Palm Beach", url: "https://www.votepalmbeach.gov/Voters/Precinct-Finder" },
  "12101": { name: "Pasco", url: "https://www.pascovotes.gov/precincts/precinct_finder.php" },
  "12103": { name: "Pinellas", url: "https://www.voterfocus.com/PrecinctFinder/addressSearch?county=FL-PIN" },
  "12105": { name: "Polk", url: "https://www.polkelections.gov/Voter-Services/Voting-Information" },
  "12107": { name: "Putnam", url: "https://www.voteputnamflorida.gov/election_information/precinct_finder.php" },
  "12109": { name: "St. Johns", url: "https://www.votesjc.gov/find-my-polling-place" },
  "12111": { name: "St. Lucie", url: "https://www.stlucievotes.gov/voter_information/find_my_precinct.php" },
  "12113": { name: "Santa Rosa", url: "https://votesantarosa.gov/election-information/list-of-precincts/" },
  "12115": { name: "Sarasota", url: "https://sarasotavotes.gov/Voter-Information/Find-My-Polling-Place" },
  "12117": { name: "Seminole", url: "https://voteseminole.dolphmap.com/" },
  "12119": { name: "Sumter", url: "https://elections.sumtercountyfl.gov/" },
  "12121": { name: "Suwannee", url: "https://www.suwanneevotes.com/where-to-vote-in-person/" },
  "12123": { name: "Taylor", url: "https://www.taylorelectionsfl.gov/where-to-vote-in-person/" },
  "12125": { name: "Union", url: "https://unionflvotes.com/voters/where-to-vote-in-person/" },
  "12127": { name: "Volusia", url: "https://www.volusiaelections.gov/voterportal/index.stml" },
  "12129": { name: "Wakulla", url: "https://wakullavotes.gov/" },
  "12131": { name: "Walton", url: "https://votewalton.gov/where-do-i-vote/" },
  "12133": { name: "Washington", url: "https://wcsoe.gov/find-my-precinct/" },
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
 * Builds the county polling-place finder link for an address, or null when the
 * address isn't in a Florida county or the Census can't place it.
 * The county comes from the Census geocoder (the same agency and benchmark the
 * rest of the app uses), and the street parts from its parse of the address, so
 * "100 1st Ave N" is sent the way the county's own form sends it.
 */
async function precinctFinderFor(address: string): Promise<{ url: string; county: string; prefilled: boolean } | null> {
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
  const fips = county?.STATE && county?.COUNTY ? county.STATE + county.COUNTY : undefined;
  const finder = fips ? FL_COUNTY_FINDERS[fips] : undefined;
  if (!fips || !finder) return null;
  const countyName = county?.NAME ?? `${finder.name} County`;

  // Counties we have checked get the voter's street filled in; the rest get the
  // county's own page, where the voter types it themselves.
  const code = VOTERFOCUS_COUNTIES[fips];
  const parts = match?.addressComponents;
  const houseNumber = match?.matchedAddress?.match(/^(\d+)/)?.[1];
  if (!code || !parts?.streetName || !houseNumber) return { url: finder.url, county: countyName, prefilled: false };

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
    county: countyName,
    prefilled: true,
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
 * 7 am - 7 pm"). When weekdays and weekends differ it groups them ("Oct 19 -
 * Nov 1, Mon-Fri 7 am - 7 pm; Sat-Sun 7 am - 5 pm"). Only when one specific
 * weekday has different hours on different weeks does it fall back to pointing
 * at the county's schedule, since the county's own schedule is what the voter
 * should follow.
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
    // Group days by their hours. Works when each weekday keeps the same hours
    // all the way through the window (Mon-Fri one set, Sat-Sun another).
    const timeForDay = new Map<number, string>();
    const daysByTime = new Map<string, number[]>();
    let consistent = true;
    for (const p of parsed) {
      const dow = weekdayIndex(p.date);
      const seen = dow === null ? undefined : timeForDay.get(dow);
      if (dow === null || (seen !== undefined && seen !== p.time)) {
        consistent = false;
        break;
      }
      timeForDay.set(dow, p.time);
      daysByTime.set(p.time, [...(daysByTime.get(p.time) ?? []), dow]);
    }
    if (consistent) {
      const groups = [...daysByTime.entries()]
        .sort((a, b) => Math.min(...a[1]) - Math.min(...b[1]))
        .map(([time, days]) => `${weekdayRuns(days)} ${time}`);
      return `${parsed[0].date} - ${parsed[parsed.length - 1].date}, ${groups.join("; ")}`;
    }
  }
  return "Hours vary by day; see the county's schedule";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Monday-first weekday index (0 = Mon ... 6 = Sun) for "Oct 19" in the election year. */
function weekdayIndex(date: string): number | null {
  const m = date.match(/^([A-Za-z]{3})\s+(\d{1,2})$/);
  if (!m) return null;
  const month = MONTHS.findIndex((x) => x.toLowerCase() === m[1].toLowerCase());
  if (month < 0) return null;
  const year = Number(ELECTION_ISO.slice(0, 4));
  const sundayFirst = new Date(Date.UTC(year, month, Number(m[2]))).getUTCDay();
  return (sundayFirst + 6) % 7;
}

/** [0,1,2,3,4] -> "Mon-Fri"; [5,6] -> "Sat-Sun"; [0,2] -> "Mon, Wed"; all seven -> "daily". */
function weekdayRuns(days: number[]): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === 7) return "daily";
  const runs: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    runs.push(j === i ? WEEKDAYS[sorted[i]] : `${WEEKDAYS[sorted[i]]}-${WEEKDAYS[sorted[j]]}`);
    i = j + 1;
  }
  return runs.join(", ");
}

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
