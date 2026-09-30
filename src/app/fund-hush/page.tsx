import type { Metadata } from "next";
import FundHush from "@/components/FundHush";

export const metadata: Metadata = { title: "Fund HUSH." };

export default function FundHushPage() {
  return <FundHush />;
}
