"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import { C, cond } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";

export type MarketingNavKey = "our-story" | "how-it-works" | "fund-hush";

// "HUSH. Guide" points at /guide-overview, the public marketing preview of
// the Guide feature (Step 4) -- not /hush-guide, which is the real,
// logged-in app page. Building the marketing page at the same path as the
// real feature would have overwritten it, so Step 4 got its own route.
const HOW_IT_WORKS_ITEMS = [
  { label: "Overview", href: "/how-it-works" },
  { label: "HUSH. Guide", href: "/guide-overview" },
  { label: "What's Included?", href: "/whats-included" },
];

const mobileLinkStyle: CSSProperties = {
  padding: "12px 16px",
  fontSize: 16,
  fontWeight: 500,
  color: C.onDark,
  textDecoration: "none",
};

// Square, never a round period -- same device GlobalFooter.tsx already uses
// for its own wordmark dot, tuned to v11's 0.3em/0.07em spec. Shared with
// MarketingFooter, which renders its own smaller copy.
export function Wordmark({ size }: { size: number | string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline" }}>
      <span style={{ fontFamily: cond, fontSize: size, letterSpacing: "0.02em", color: C.onDark }}>
        HUSH
      </span>
      <span
        aria-hidden
        style={{ display: "inline-block", width: "0.3em", height: "0.3em", marginLeft: "0.07em", background: C.rust }}
      />
    </span>
  );
}

// `active` marks which nav item stands for the current page -- persimmon
// text with a 2px underline, 3px below the text. Nothing is active on Home.
// `sticky` defaults to true (every inner page, per the Step 2 spec); Home
// passes false to keep its own v11 foundation-spec treatment -- fully
// transparent, no border, takes real space above the hero instead of
// overlaying it (a deliberate call, not an oversight -- see the Step 0
// build notes).
export function MarketingHeader({ active, sticky = true }: { active?: MarketingNavKey; sticky?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openHow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHowOpen(true);
  }
  function closeHowSoon() {
    closeTimer.current = setTimeout(() => setHowOpen(false), 120);
  }

  function navLinkStyle(key: MarketingNavKey): CSSProperties {
    if (active === key) {
      return {
        fontSize: "clamp(15px, 1.1vw, 16px)",
        fontWeight: 500,
        color: C.rust,
        textDecoration: "none",
        borderBottom: `2px solid ${C.rust}`,
        paddingBottom: 3,
      };
    }
    return { fontSize: "clamp(15px, 1.1vw, 16px)", fontWeight: 500, color: C.onDark, textDecoration: "none" };
  }

  return (
    <header
      style={
        sticky
          ? { padding: "30px 34px", position: "sticky", top: 0, zIndex: 100, background: C.ink, borderBottom: `1px solid ${MK.ruleDark}` }
          : { padding: "30px 34px" }
      }
    >
      <div
        className="home-header-row"
        style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 16 }}
      >
        <Link href="/" style={{ justifySelf: "start", textDecoration: "none" }} aria-label="HUSH home">
          <Wordmark size="clamp(28px, 2.4vw, 36px)" />
        </Link>

        <nav className="home-nav-desktop" style={{ justifySelf: "center", display: "flex", alignItems: "center", gap: 40 }}>
          <Link href="/our-story" className="home-nav-link" style={navLinkStyle("our-story")}>
            Our Story
          </Link>

          <div style={{ position: "relative" }} onMouseEnter={openHow} onMouseLeave={closeHowSoon}>
            <Link
              href="/how-it-works"
              className="home-nav-link"
              style={navLinkStyle("how-it-works")}
              aria-haspopup="true"
              aria-expanded={howOpen}
              onClick={(e) => {
                // Touch devices: first tap opens the menu instead of
                // navigating -- there's no hover to reveal it first. The
                // menu is now visible, so a second tap on this same link
                // follows through to /how-it-works normally.
                if (!howOpen && typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) {
                  e.preventDefault();
                  setHowOpen(true);
                }
              }}
            >
              How It Works ▾
            </Link>
            {howOpen ? (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 16px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  minWidth: 230,
                  background: C.ink,
                  border: `1px solid ${MK.ruleDarkStrong}`,
                  borderTop: `3px solid ${C.rust}`,
                  boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
                  padding: "6px 0",
                  zIndex: 20,
                }}
              >
                {HOW_IT_WORKS_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className="home-dropdown-item"
                    style={{ display: "block", padding: "12px 20px", fontSize: 15, fontWeight: 500, color: C.onDark, textDecoration: "none" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <Link href="/fund-hush" className="home-nav-link" style={navLinkStyle("fund-hush")}>
            Fund HUSH.
          </Link>
        </nav>

        <div className="home-header-actions" style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: 28 }}>
          <Link
            href="/login"
            className="home-nav-link"
            style={{ fontSize: "clamp(15px, 1.1vw, 16px)", fontWeight: 500, color: C.onDark, textDecoration: "none" }}
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="home-btn-primary"
            style={{
              background: C.rust,
              color: C.ink,
              fontWeight: 700,
              fontSize: "clamp(15px, 1.1vw, 16px)",
              padding: "16px 28px",
              textDecoration: "none",
            }}
          >
            Join the Movement
          </Link>
        </div>

        <button
          type="button"
          className="home-nav-toggle"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          style={{
            justifySelf: "end",
            gridColumn: 2,
            border: `1px solid ${MK.ruleDarkStrong}`,
            background: "transparent",
            color: C.onDark,
            width: 44,
            height: 40,
            fontSize: 20,
          }}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {mobileOpen ? (
        <div
          className="home-mobile-menu"
          style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4, background: C.ink, border: `1px solid ${MK.ruleDarkStrong}`, padding: 8 }}
        >
          <Link href="/our-story" className="home-nav-link" style={mobileLinkStyle} onClick={() => setMobileOpen(false)}>
            Our Story
          </Link>
          <Link href="/how-it-works" className="home-nav-link" style={mobileLinkStyle} onClick={() => setMobileOpen(false)}>
            How It Works
          </Link>
          <Link href="/guide-overview" className="home-nav-link" style={{ ...mobileLinkStyle, paddingLeft: 32, fontSize: 14 }} onClick={() => setMobileOpen(false)}>
            HUSH. Guide
          </Link>
          <Link href="/whats-included" className="home-nav-link" style={{ ...mobileLinkStyle, paddingLeft: 32, fontSize: 14 }} onClick={() => setMobileOpen(false)}>
            What&apos;s Included?
          </Link>
          <Link href="/fund-hush" className="home-nav-link" style={mobileLinkStyle} onClick={() => setMobileOpen(false)}>
            Fund HUSH.
          </Link>
          <div style={{ height: 1, background: MK.ruleDark, margin: "6px 4px" }} />
          <Link href="/login" className="home-nav-link" style={mobileLinkStyle} onClick={() => setMobileOpen(false)}>
            Log In
          </Link>
          <Link
            href="/signup"
            className="home-btn-primary"
            style={{ margin: 4, textAlign: "center", background: C.rust, color: C.ink, fontWeight: 700, fontSize: 16, padding: "14px 20px", textDecoration: "none" }}
            onClick={() => setMobileOpen(false)}
          >
            Join the Movement
          </Link>
        </div>
      ) : null}
    </header>
  );
}
