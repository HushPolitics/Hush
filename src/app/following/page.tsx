import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import FollowingView from "@/components/views/FollowingView";
import { listPoliticians } from "@/lib/repo";

export const metadata: Metadata = { title: "Following" };

export default function FollowingPage() {
  return (
    <AppShell>
      <FollowingView politicians={listPoliticians()} />
    </AppShell>
  );
}
