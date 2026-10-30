import { redirect } from "next/navigation";

// Free beta through the 2026 midterms: there is no separate pricing page.
// Old links land on the plans section of Fund HUSH.
export default function PricingPage() {
  redirect("/fund-hush#membership");
}
