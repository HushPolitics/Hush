/**
 * Address to coordinates, via the Census Bureau's geocoder.
 *
 * Chosen over a commercial geocoder for three reasons: it is free and needs no
 * API key, it is the same agency that draws the TIGER boundaries the districts
 * were loaded from (so an address and a boundary are read off the same map),
 * and it has no per-request licensing terms to pass on to users.
 *
 * Deliberately address-only. A ZIP is not enough: ZIP codes are mail carrier
 * routes, not political geography, and they cross district lines routinely. A
 * ZIP-based lookup is right often enough to feel like it works and wrong often
 * enough to show somebody the wrong ballot, which is the worst combination.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  /** The address as the Census matched it, for showing back to the user. */
  matchedAddress: string;
  city: string | null;
  state: string | null;
  zip: string | null;
}

const ENDPOINT = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";

interface CensusMatch {
  matchedAddress?: string;
  coordinates?: { x?: number; y?: number };
  addressComponents?: {
    city?: string;
    state?: string;
    zip?: string;
  };
}

/**
 * Geocodes a one-line address. Returns `null` for anything the Census cannot
 * place -- a typo, a PO box, an address outside the US. Callers must treat
 * `null` as "we could not find this", never as "no districts", because those
 * mean very different things to someone trying to find their ballot.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const query = address.trim();
  if (query.length < 5) return null;

  const url =
    `${ENDPOINT}?address=${encodeURIComponent(query)}` +
    `&benchmark=Public_AR_Current&format=json`;

  let res: Response;
  try {
    res = await fetch(url, {
      // The boundary set changes a few times a year at most, and the same
      // address always lands on the same point, so this is safe to cache for
      // a day. It also keeps a retyped address from re-querying the Census.
      next: { revalidate: 86400 },
    });
  } catch {
    return null; // network failure: indistinguishable from no match to the caller
  }

  if (!res.ok) return null;

  let body: { result?: { addressMatches?: CensusMatch[] } };
  try {
    body = await res.json();
  } catch {
    return null;
  }

  const match = body.result?.addressMatches?.[0];
  const x = match?.coordinates?.x;
  const y = match?.coordinates?.y;
  if (match == null || typeof x !== "number" || typeof y !== "number") return null;

  return {
    lat: y,
    lng: x,
    matchedAddress: match.matchedAddress ?? query,
    city: match.addressComponents?.city ?? null,
    state: match.addressComponents?.state ?? null,
    zip: match.addressComponents?.zip ?? null,
  };
}
