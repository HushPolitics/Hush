import type { Metadata } from "next";
import Dispute from "@/components/Dispute";

export const metadata: Metadata = { title: "File a Dispute" };

export default function DisputePage() {
  return <Dispute />;
}
