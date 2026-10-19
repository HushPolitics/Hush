"use server";

import { geocodeAddress } from "@/lib/geocode";
import { createClient, createPublicClient, getUser } from "@/lib/supabase/server";

/**
 * One resolved district the signed-in-or-not voter belongs to.
 *
 * `via` comes straight from resolve_districts and says how the match was made:
 * "polygon" is a direct point-in-polygon hit, "precinct" is a lookup through
 * the voter's precinct. Kept so the UI can be honest about a weaker match
 * rather than presenting both the same way.
 */
export interface ResolvedDistrict {
  id: string;
  kind: string;
  name: string;
  via: string;
}

export type ResolveAddressResult =
  | {
      ok: true;
      matchedAddress: string;
      city: string | null;
      state: string | null;
      zip: string | null;
      districts: ResolvedDistrict[];
    }
  | { ok: false; reason: "not_found" | "unconfigured" | "no_districts" };

/**
 * Turns a typed address into the districts that address votes in.
 *
 * Three failures are kept distinct on purpose, because they call for different
 * things from the reader and collapsing them produces a misleading empty
 * state:
 *   not_found     -- the Census could not place the address; retype it
 *   no_districts  -- the address is real but sits outside every boundary
 *                    loaded so far (today: outside Florida, or in a Florida
 *                    county whose local boundaries are not in yet)
 *   unconfigured  -- the backend is not wired up; nothing to do with the user
 *
 * Writes to user_addresses/user_districts only when someone is signed in.
 * Signed-out visitors get the same answer, held in their browser, because
 * looking up your own ballot should not require an account.
 */
export async function resolveAddress(address: string): Promise<ResolveAddressResult> {
  const point = await geocodeAddress(address);
  if (!point) return { ok: false, reason: "not_found" };

  const supabase = createPublicClient();
  if (!supabase) return { ok: false, reason: "unconfigured" };

  const { data, error } = await supabase.rpc("resolve_districts", {
    p_lat: point.lat,
    p_lng: point.lng,
    p_as_of: new Date().toISOString().slice(0, 10),
  });

  if (error) return { ok: false, reason: "unconfigured" };

  const districts: ResolvedDistrict[] = (data ?? []).map(
    (r: { district_id: string; kind: string; name: string; via: string }) => ({
      id: r.district_id,
      kind: r.kind,
      name: r.name,
      via: r.via,
    }),
  );

  if (districts.length === 0) return { ok: false, reason: "no_districts" };

  // Best effort only: a failed write must not cost the user their answer,
  // which is already computed and about to be returned.
  const user = await getUser();
  if (user) {
    const authed = await createClient();
    if (authed) {
      await authed.from("user_addresses").upsert(
        {
          user_id: user.id,
          street: point.matchedAddress,
          city: point.city,
          state_code: point.state,
          zip: point.zip,
          lat: point.lat,
          lng: point.lng,
          geocode_source: "census",
          geocoded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      await authed.from("user_districts").delete().eq("user_id", user.id);
      await authed.from("user_districts").insert(
        districts.map((d) => ({
          user_id: user.id,
          district_id: d.id,
          resolved_at: new Date().toISOString(),
        })),
      );
    }
  }

  return {
    ok: true,
    matchedAddress: point.matchedAddress,
    city: point.city,
    state: point.state,
    zip: point.zip,
    districts,
  };
}
