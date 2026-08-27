import type { Metadata } from "next";
import Link from "next/link";
import { C, cond } from "@/lib/theme";

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
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: C.ink,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <span
          style={{
            fontFamily: cond,
            fontWeight: 600,
            fontSize: 34,
            letterSpacing: "0.22em",
            color: C.onDark,
          }}
        >
          HUSH
        </span>
        <span style={{ fontFamily: cond, fontWeight: 600, fontSize: 34, color: C.rust }}>.</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 560 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: cond,
            fontWeight: 400,
            fontSize: 40,
            lineHeight: 1.15,
            color: C.onDark,
          }}
        >
          Politics is noisy, your vote shouldn&apos;t be
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: cond,
            fontSize: 17,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: C.tan,
          }}
        >
          Coming Soon: Political Clarity
        </p>
      </div>

      <Link
        href="/feed"
        className="btn-rust landing-cta"
        style={{
          marginTop: 8,
          padding: "13px 26px",
          borderRadius: 8,
          background: C.rust,
          color: C.sand,
          fontFamily: cond,
          fontSize: 15,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          textDecoration: "none",
        }}
      >
        See a Preview?
      </Link>
    </div>
  );
}
