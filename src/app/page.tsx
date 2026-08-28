import type { Metadata } from "next";
import LandingHero from "@/components/LandingHero";

export const metadata: Metadata = {
  title: "Coming Soon",
  description:
    "Coming soon: political clarity. Hush matches you with the politicians on your ballot by the issues you care about, and scores every one of them on whether they follow through on what they promised.",
  openGraph: {
    title: "Hush — coming soon",
    description: "Politics is noisy, your vote shouldn't be. Coming soon: political clarity.",
  },
};

export default function LandingPage() {
  return <LandingHero />;
}
