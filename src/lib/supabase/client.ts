import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client.
 *
 * Returns null when the env vars are absent so the app degrades to the seed
 * dataset instead of throwing. That is what lets the first Vercel deploy go out
 * before the backend exists.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
