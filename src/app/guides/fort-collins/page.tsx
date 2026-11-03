import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getUser } from "@/lib/supabase/server";
import FortCollinsGuide from "./FortCollinsGuide";

// Unlisted: not linked from the nav, footer, Feed or any sitemap, and kept out
// of search. Anyone with the link and an account can open it. Signed-out
// visitors (and any request where sign-in cannot be checked) go to login and
// come back here afterward.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fort Collins ballot guide",
  robots: { index: false, follow: false, nocache: true },
};

export default async function FortCollinsGuidePage() {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/guides/fort-collins")}`);

  return (
    <AppShell>
      <FortCollinsGuide />
    </AppShell>
  );
}
