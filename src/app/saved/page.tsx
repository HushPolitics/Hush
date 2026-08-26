import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import ProfileView from "@/components/views/ProfileView";
import { listPoliticians, topicPool } from "@/lib/repo";

export const metadata: Metadata = { title: "Saved" };

export default function SavedPage() {
  return (
    <AppShell kicker="Saved" title="Your list">
      <ProfileView politicians={listPoliticians()} topicPool={topicPool()} />
    </AppShell>
  );
}
