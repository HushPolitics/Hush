"use client";

import { createClient } from "./client";
import { issueSlug } from "@/lib/scoring";

export interface OnboardingSyncData {
  firstName?: string;
  lastName?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  marketingEmailOptIn?: boolean;
  /** Ranked issue names, best rank first — mirrors Prefs.topics. */
  rankedTopics?: string[];
  /** Stamp profiles.onboarded_at when the user reaches the end of the wizard. */
  markOnboarded?: boolean;
}

/**
 * Best-effort sync of onboarding answers to Supabase.
 *
 * `profiles` and `user_issue_weights` are owner-only under RLS, so any write
 * here needs a live session — and `signUp()` does not hand back one when the
 * project's "Confirm email" setting is on (the default), which is exactly
 * the state a brand-new signup is in for most of the wizard. Prefs is always
 * written to regardless (see SignupWizard), so nothing the user enters is
 * lost either way; this only decides whether it also reaches the server
 * right now. Returns whether it actually wrote anything, so the UI can be
 * honest about local-only vs. synced state.
 */
export async function syncOnboardingToSupabase(data: OnboardingSyncData): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return false;

  const profilePatch: Record<string, unknown> = {};
  if (data.firstName !== undefined) profilePatch.first_name = data.firstName || null;
  if (data.lastName !== undefined) profilePatch.last_name = data.lastName || null;
  if (data.streetAddress !== undefined) profilePatch.street_address = data.streetAddress || null;
  if (data.city !== undefined) profilePatch.city = data.city || null;
  if (data.state !== undefined) profilePatch.state = data.state || null;
  if (data.marketingEmailOptIn !== undefined) {
    profilePatch.marketing_email_opt_in = data.marketingEmailOptIn;
  }
  if (data.markOnboarded) profilePatch.onboarded_at = new Date().toISOString();

  if (Object.keys(profilePatch).length > 0) {
    const { error } = await supabase.from("profiles").update(profilePatch).eq("id", user.id);
    if (error) return false;
  }

  if (data.rankedTopics && data.rankedTopics.length > 0) {
    const slugs = data.rankedTopics.map(issueSlug);
    const { data: issueRows, error: issuesError } = await supabase
      .from("issues")
      .select("id, slug")
      .in("slug", slugs);
    if (issuesError) return false;

    const idBySlug = new Map((issueRows ?? []).map((r) => [r.slug as string, r.id as string]));
    const rows = data.rankedTopics
      .map((name, i) => {
        const id = idBySlug.get(issueSlug(name));
        return id ? { user_id: user.id, issue_id: id, rank: i + 1 } : null;
      })
      .filter((r): r is { user_id: string; issue_id: string; rank: number } => r !== null);

    // Replace-in-full: onboarding and Profile always write a whole ranked
    // list at once, never a single row, so delete-then-insert is simpler
    // (and safer under the unique (user_id, rank) index) than diffing.
    const { error: deleteError } = await supabase
      .from("user_issue_weights")
      .delete()
      .eq("user_id", user.id);
    if (deleteError) return false;

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("user_issue_weights").insert(rows);
      if (insertError) return false;
    }
  }

  return true;
}
