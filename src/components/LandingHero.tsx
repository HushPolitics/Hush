"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { C, cond } from "@/lib/theme";

/**
 * Base look for every landing-page CTA. Padding/font stay fixed; `width` is
 * layered on top once measured below, so all four buttons — split across
 * the top bar and the bottom row — line up as one consistent set instead of
 * each hugging its own label.
 */
const landingBtnStyle: CSSProperties = {
  padding: "13px 26px",
  borderRadius: 8,
  background: C.rust,
  color: C.sand,
  fontFamily: cond,
  fontSize: 15,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  textDecoration: "none",
  textAlign: "center",
  boxSizing: "border-box",
};

export default function LandingHero() {
  const createAccountRef = useRef<HTMLAnchorElement>(null);
  const loginRef = useRef<HTMLAnchorElement>(null);
  const uiPreviewRef = useRef<HTMLAnchorElement>(null);
  const homePreviewRef = useRef<HTMLAnchorElement>(null);

  // Measured from whichever label is actually longest at render time — never
  // a guessed pixel value — so this keeps working if any label changes.
  const [btnWidth, setBtnWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const widths = [createAccountRef, loginRef, uiPreviewRef, homePreviewRef].map(
      (ref) => ref.current?.getBoundingClientRect().width ?? 0,
    );
    const max = Math.max(...widths);
    if (max > 0) setBtnWidth(max);
  }, []);

  const btnStyle: CSSProperties = btnWidth ? { ...landingBtnStyle, width: btnWidth } : landingBtnStyle;

  return (
    <div
      style={{
        position: "relative",
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
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "20px 24px",
        }}
      >
        <Link href="/signup" className="btn-rust landing-cta" ref={createAccountRef} style={btnStyle}>
          Create Account
        </Link>
        <Link href="/login" className="btn-rust landing-cta" ref={loginRef} style={btnStyle}>
          Login
        </Link>
      </div>

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

      <div
        style={{
          marginTop: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Link href="/feed" className="btn-rust landing-cta" ref={uiPreviewRef} style={btnStyle}>
          UI Preview
        </Link>
        {/* Destination not built yet — placeholder link until that page exists. */}
        <Link href="#" className="btn-rust landing-cta" ref={homePreviewRef} style={btnStyle}>
          Home Page Preview
        </Link>
      </div>
    </div>
  );
}
