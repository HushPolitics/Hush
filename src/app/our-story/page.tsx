import type { Metadata } from "next";
import OurStory from "@/components/OurStory";

export const metadata: Metadata = { title: "Our Story" };

export default function OurStoryPage() {
  return <OurStory />;
}
