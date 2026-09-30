import Link from "next/link";
import { C } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";

// Shared closing-quote pattern (first built for How It Works, Step 3): a
// persimmon bar, a large pull quote with attribution, then a divider row
// pairing a short line with a CTA button. Built reusable per the spec --
// other pages swap in their own quote/line/CTA.
export function ClosingQuote({
  quote,
  attributionName,
  attributionSource,
  line,
  ctaLabel = "Join the Movement",
  ctaHref = "/signup",
}: {
  quote: string;
  attributionName: string;
  attributionSource: string;
  line: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <section style={{ background: C.ink, padding: "96px 34px 100px" }}>
      <div style={{ maxWidth: 980 }}>
        <span aria-hidden style={{ display: "block", width: 56, height: 6, background: C.rust }} />
        <p style={{ margin: "30px 0 0", fontSize: "clamp(26px, 3vw, 46px)", lineHeight: 1.2, letterSpacing: "-0.03em", fontWeight: 600, color: C.onDark, maxWidth: "30ch" }}>
          “{quote}”
        </p>
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.onDark }}>{attributionName}</span>
          <span style={{ fontSize: 13, color: MK.mutedDark }}>{attributionSource}</span>
        </div>
        <div
          style={{
            marginTop: 44,
            paddingTop: 30,
            borderTop: `1px solid ${MK.ruleDarkStrong}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 28,
            flexWrap: "wrap",
          }}
        >
          <p style={{ margin: 0, fontSize: "clamp(18px, 1.6vw, 22px)", lineHeight: 1.45, letterSpacing: "-0.015em", fontWeight: 600, color: C.onDark, maxWidth: "36ch" }}>
            {line}
          </p>
          <Link
            href={ctaHref}
            className="home-btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "18px 28px",
              background: C.rust,
              color: C.ink,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              textDecoration: "none",
              flex: "none",
            }}
          >
            {ctaLabel} →
          </Link>
        </div>
      </div>
    </section>
  );
}
