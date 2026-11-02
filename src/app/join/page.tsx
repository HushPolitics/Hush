import type { Metadata } from "next";
import JoinList from "@/components/JoinList";

// A page's openGraph replaces the layout's openGraph wholesale (Next merges
// metadata shallowly), so siteName and type are repeated here on purpose.
const TITLE = "Join the HUSH. list";
const DESCRIPTION =
  "Get the stuff worth knowing, minus the screaming. Join the list for the latest in politics, early releases, and first dibs on merch.";

export const metadata: Metadata = {
  title: "Join the list",
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/join",
    siteName: "Hush",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function JoinPage() {
  return <JoinList />;
}
