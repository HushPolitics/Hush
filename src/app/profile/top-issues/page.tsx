import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "My Top Issues" };

/**
 * Placeholder for a dedicated ranked-issues view. Today the ranked list
 * lives inline on /profile ("Your top issues"); this stands in as the
 * destination for the Profile hero's "My Top Issues" button until that gets
 * its own page.
 */
export default function TopIssuesPage() {
  return (
    <AppShell kicker="Profile" title="My Top Issues">
      <div style={{ padding: "24px 28px" }}>
        <EmptyState>
          Coming soon — a dedicated view of your ranked issues is on the way. In
          the meantime you can reorder them from{" "}
          <Link href="/profile" style={{ textDecoration: "underline" }}>
            your Profile page
          </Link>
          .
        </EmptyState>
      </div>
    </AppShell>
  );
}
