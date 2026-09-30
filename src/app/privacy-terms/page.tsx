import type { Metadata } from "next";
import PrivacyTerms from "@/components/PrivacyTerms";

export const metadata: Metadata = { title: "Privacy & Terms" };

export default function PrivacyTermsPage() {
  return <PrivacyTerms />;
}
