import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Profile Settings" };

/**
 * Placeholder for account settings. Will eventually let the user edit their
 * username, email, mailing address and phone number — none of which exist
 * anywhere in the data model yet, so this is a stand-in destination rather
 * than a broken link off the Profile hero.
 */
export default function ProfileSettingsPage() {
  return (
    <AppShell kicker="Profile" title="Profile Settings">
      <div style={{ padding: "24px 28px" }}>
        <EmptyState>
          Coming soon — this is where you&apos;ll edit your username, email, mailing
          address and phone number.{" "}
          <Link href="/profile" style={{ textDecoration: "underline" }}>
            Back to Profile
          </Link>
        </EmptyState>
      </div>
    </AppShell>
  );
}
