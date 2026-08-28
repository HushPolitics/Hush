import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import ProfileSettingsView from "@/components/views/ProfileSettingsView";
import { topicPool } from "@/lib/repo";

export const metadata: Metadata = { title: "Profile Settings" };

/**
 * Account settings: Personal Information, Voting Location, HUSH
 * Preferences, Email Preferences and Privacy. Built on the same Prefs
 * fields and `syncOnboardingToSupabase()` the signup wizard writes —
 * see ProfileSettingsView.
 */
export default function ProfileSettingsPage() {
  return (
    <AppShell kicker="Profile" title="Manage your account">
      <ProfileSettingsView topicPool={topicPool()} />
    </AppShell>
  );
}
