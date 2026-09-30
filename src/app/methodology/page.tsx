import type { Metadata } from "next";
import Methodology from "@/components/Methodology";

export const metadata: Metadata = { title: "Our Methodology" };

export default function MethodologyPage() {
  return <Methodology />;
}
