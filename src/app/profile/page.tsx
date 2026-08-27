import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import ProfileView from "@/components/views/ProfileView";
import { listFactChecks, listPoliticians, topicPool } from "@/lib/repo";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <AppShell kicker="Profile" title="Jordan Reyes">
      <ProfileView
        politicians={listPoliticians()}
        topicPool={topicPool()}
        checks={listFactChecks()}
      />
    </AppShell>
  );
}
