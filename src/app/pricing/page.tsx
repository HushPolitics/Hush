import type { Metadata } from "next";
import Link from "next/link";
import { C, cond } from "@/lib/theme";
import { PAYWALL_ENABLED } from "@/components/Gate";

export const metadata: Metadata = { title: "Membership" };

/**
 * Placeholder pricing page.
 *
 * The three shapes below mirror the `plans` rows in migration 0004. Prices are
 * stand-ins until the structure is decided; nothing here charges anyone yet.
 */
const PLANS = [
  {
    slug: "free",
    name: "Free",
    price: "$0",
    cadence: "always",
    lines: [
      "Every published trust score",
      "Your ballot and value matching",
      "Fact-check feed",
    ],
  },
  {
    slug: "monthly",
    name: "Monthly",
    price: "$5",
    cadence: "per month",
    lines: [
      "Full promise ledgers with sources",
      "Side-by-side compare",
      "Alerts when a tracked promise moves",
    ],
    featured: true,
  },
  {
    slug: "founder",
    name: "Founding member",
    price: "$99",
    cadence: "once",
    lines: ["Everything, permanently", "Supports the fact-checking work", "Early access to new races"],
  },
];

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100vh", background: C.sand, padding: "48px 24px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Link href="/" style={{ display: "flex", alignItems: "baseline", color: C.ink }}>
            <span style={{ fontFamily: cond, fontWeight: 600, fontSize: 28, letterSpacing: "0.22em" }}>
              HUSH
            </span>
            <span style={{ fontFamily: cond, fontWeight: 600, fontSize: 28, color: C.rust }}>.</span>
          </Link>
          <span style={{ fontFamily: cond, fontSize: 32 }}>Membership</span>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: C.body, maxWidth: 620 }}>
            Trust scores stay free — a voter should never hit a paywall between themselves and a
            public record. Membership pays for the fact-checking work behind them.
          </p>
          {!PAYWALL_ENABLED ? (
            <span style={{ fontSize: 12, color: C.muted }}>
              Pricing is not live yet. These are placeholders while the structure is decided.
            </span>
          ) : null}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
          {PLANS.map((p) => (
            <div
              key={p.slug}
              style={{
                border: `1px solid ${p.featured ? C.ink : C.line}`,
                borderRadius: 12,
                background: C.white,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <span style={{ fontFamily: cond, fontSize: 20 }}>{p.name}</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontFamily: cond, fontSize: 42, lineHeight: 1 }}>{p.price}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{p.cadence}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                {p.lines.map((l) => (
                  <li key={l} style={{ fontSize: 13, color: C.body, display: "flex", gap: 8, lineHeight: 1.45 }}>
                    <span style={{ color: C.rust }}>·</span>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
