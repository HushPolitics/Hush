import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Server Supabase client bound to the request's cookie jar. */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: middleware refreshes the session
          // instead, so this is safe to swallow.
        }
      },
    },
  });
}

/**
 * Service-role client for ingestion jobs and the Stripe webhook.
 *
 * Bypasses RLS. Never import this into anything that renders — it belongs in
 * route handlers and background jobs only.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createServerClient(url, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

/** The signed-in user, or null. Safe to call when Supabase is unconfigured. */
export async function getUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/** Whether the signed-in user has paid access. False when unconfigured. */
export async function hasEntitlement(): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("has_entitlement");
  if (error) return false;
  return Boolean(data);
}
