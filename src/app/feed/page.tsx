import type { Metadata } from "next";
import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import FeedView from "@/components/views/FeedView";
import { listPoliticians } from "@/lib/repo";

export const metadata: Metadata = { title: "Feed" };

export default function FeedPage() {
  return (
    <AppShell kicker="Feed" title="Matches near you">
      <Suspense fallback={null}>
        <FeedView politicians={listPoliticians()} />
      </Suspense>
    </AppShell>
  );
}
