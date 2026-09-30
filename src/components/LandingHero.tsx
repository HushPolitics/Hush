"use client";

import Link from "next/link";
import { C, cond } from "@/lib/theme";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

// Home v11 -- page-scoped tokens with no shared-system equivalent. See the
// build notes for why bodyMuted is a solid hex, not C.body. (The header and
// footer's own on-black tokens moved to src/lib/marketingTheme.ts when they
// became shared components -- see MarketingHeader.tsx / MarketingFooter.tsx.)
const V11 = {
  bodyMuted: "#CFC9BD",
};

function HomeHero() {
  return (
    // minHeight subtracts the header's own rendered height (~112px: 30px
    // padding top + bottom plus its tallest row content) so the header +
    // hero together still land at roughly one full viewport, now that the
    // header takes real space above this instead of floating over it.
    <div
      style={{
        position: "relative",
        minHeight: "calc(max(760px, 100vh) - 112px)",
        width: "100%",
        background: C.ink,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1000,
          width: "100%",
          padding: "26px 34px 80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.16em", color: C.onDark }}>
            REAL INFORMATION.
          </span>
          <span style={{ fontWeight: 600, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.16em", color: C.rust }}>
            LESS NOISE.
          </span>
        </div>

        {/* Headline: was clamp(56px, 9vw, 140px) -- maxed out around 130-140px
            on an ordinary browser window, which is what read as "way too
            big." New range tops out at 92px instead, same scaling behavior
            (a percentage of window width, floored on small screens). */}
        <h1 style={{ margin: "18px 0 0", fontFamily: cond, fontWeight: 400, fontSize: "clamp(40px, 6vw, 92px)", lineHeight: 0.9, color: C.onDark }}>
          POLITICS
          <br />
          IS NOISY.
        </h1>

        <div
          style={{
            marginTop: 20,
            display: "inline-block",
            backgroundImage:
              "linear-gradient(to bottom,rgba(228,87,46,0) 0 4%,rgba(238,108,70,0.9) 4% 16%,rgba(238,108,70,1) 16% 54%,rgba(206,72,36,1) 54% 86%,rgba(228,87,46,0.7) 86% 96%,rgba(228,87,46,0.28) 96% 100%),linear-gradient(96deg,rgba(228,87,46,0.5) 0 1.5%,rgba(228,87,46,1) 4% 92%,rgba(228,87,46,0.45) 99% 100%)",
            clipPath: "polygon(0.5% 7%, 2% 1.6%, 47% 0.2%, 97% 2.2%, 99.6% 8%, 100% 87%, 97.6% 98%, 45% 100%, 2% 97.6%, 0.2% 89%)",
            transform: "rotate(-0.6deg)",
            padding: "8px 32px 22px",
          }}
        >
          {/* Was clamp(42px, 6.9vw, 108px) -- same proportional reduction as
              the headline above. */}
          <span style={{ display: "block", fontFamily: cond, fontWeight: 400, fontSize: "clamp(32px, 4.6vw, 72px)", lineHeight: 0.94, color: C.ink }}>
            YOUR VOTE
            <br />
            SHOULDN&apos;T BE.
          </span>
        </div>

        <p style={{ marginTop: 40, maxWidth: "46ch", fontWeight: 400, fontSize: "clamp(18px, 1.6vw, 23px)", lineHeight: 1.58, color: V11.bodyMuted }}>
          {/* Per the v11 design spec: "HUSH." takes the verb as a singular
              brand subject ("HUSH. gives you..."), not the plural "give." */}
          HUSH. gives you direct quotes, verified sources, and a clear way to compare candidates — so
          you can make an informed vote, without the noise.
        </p>

        <div style={{ marginTop: 42, display: "flex", alignItems: "center", gap: 34, flexWrap: "wrap" }}>
          <Link
            href="/signup"
            className="home-btn-primary"
            style={{ background: C.rust, color: C.ink, fontWeight: 700, fontSize: "clamp(16px, 1.35vw, 19px)", padding: "24px 38px", textDecoration: "none" }}
          >
            Join the Movement
          </Link>
          <Link
            href="/feed"
            className="home-link-underline"
            style={{ color: C.onDark, fontWeight: 600, fontSize: "clamp(16px, 1.35vw, 19px)", textDecoration: "none", borderBottom: `2px solid ${C.onDark}`, paddingBottom: 4 }}
          >
            See How It Works →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LandingHero() {
  return (
    <div style={{ background: C.ink }}>
      <MarketingHeader sticky={false} />
      <HomeHero />
      <MarketingFooter />
    </div>
  );
}
