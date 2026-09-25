"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import { C, cond } from "@/lib/theme";

// Home v11 -- page-scoped tokens with no shared-system equivalent. See the
// build notes for why Rule/ruleStrong are solid hex, not C.line/C.lineHard.
const V11 = {
  bodyMuted: "#CFC9BD",
  muted: "#8C8477",
  faint: "#6B6355",
  rule: "#2A2620",
  ruleStrong: "#3A342C",
  field: "#24201B",
};

const HOW_IT_WORKS_ITEMS = [
  { label: "Overview", href: "/how-it-works" },
  { label: "HUSH. Guide", href: "/hush-guide" },
  { label: "What's Included?", href: "/whats-included" },
];

const FOOTER_NAV = [
  { label: "Our Story", href: "/our-story" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Fund HUSH", href: "/fund" },
];

// "Our Methodology" points at "#" -- not built yet, per the brief. The rest
// point at real paths; see the build notes on which of those exist today.
const LEGAL_LINKS = [
  { label: "Our Methodology", href: "#" },
  { label: "File a Dispute", href: "/dispute" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: "/contact" },
];

// Placeholder destinations until real account URLs are supplied.
const SOCIAL_LINKS = [
  { label: "Instagram", href: "#" },
  { label: "TikTok", href: "#" },
  { label: "X", href: "#" },
];

const mobileLinkStyle: CSSProperties = {
  padding: "12px 16px",
  fontSize: 16,
  fontWeight: 500,
  color: C.onDark,
  textDecoration: "none",
  borderRadius: 6,
};

// Square, never a round period -- same device GlobalFooter.tsx already uses
// for its own wordmark dot, tuned to v11's 0.3em/0.07em spec.
function Wordmark({ size }: { size: number | string }) {
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

// Placeholder line-art glyphs, not brand assets -- swap for real logo SVGs
// whenever you have them. See the build notes.
function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function TikTokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M15 3v10.6a3.6 3.6 0 1 1-3-3.55" />
      <path d="M15 3c.4 2.4 2.1 4.1 4.5 4.4" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}

function HomeHeader() {
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

  const navLinkStyle: CSSProperties = {
    fontSize: "clamp(16px, 1.3vw, 19px)",
    fontWeight: 500,
    color: C.onDark,
    textDecoration: "none",
  };

  return (
    <header style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, padding: "30px 34px" }}>
      <div
        className="home-header-row"
        style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 16 }}
      >
        <Link href="/" style={{ justifySelf: "start", textDecoration: "none" }} aria-label="HUSH home">
          <Wordmark size="clamp(28px, 2.4vw, 36px)" />
        </Link>

        <nav className="home-nav-desktop" style={{ justifySelf: "center", display: "flex", alignItems: "center", gap: 40 }}>
          <Link href="/our-story" className="home-nav-link" style={navLinkStyle}>
            Our Story
          </Link>

          <div style={{ position: "relative" }} onMouseEnter={openHow} onMouseLeave={closeHowSoon}>
            <Link
              href="/how-it-works"
              className="home-nav-link"
              style={navLinkStyle}
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
                  border: `1px solid ${V11.ruleStrong}`,
                  borderTop: `3px solid ${C.rust}`,
                  borderRadius: 8,
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

          <Link href="/fund" className="home-nav-link" style={navLinkStyle}>
            Fund HUSH
          </Link>
        </nav>

        <div className="home-header-actions" style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: 28 }}>
          <Link href="/login" className="home-nav-link" style={navLinkStyle}>
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
              borderRadius: 8,
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
            border: `1px solid ${V11.ruleStrong}`,
            borderRadius: 8,
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
          style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4, background: C.ink, border: `1px solid ${V11.ruleStrong}`, borderRadius: 10, padding: 8 }}
        >
          <Link href="/our-story" className="home-nav-link" style={mobileLinkStyle} onClick={() => setMobileOpen(false)}>
            Our Story
          </Link>
          <Link href="/how-it-works" className="home-nav-link" style={mobileLinkStyle} onClick={() => setMobileOpen(false)}>
            How It Works
          </Link>
          <Link href="/hush-guide" className="home-nav-link" style={{ ...mobileLinkStyle, paddingLeft: 32, fontSize: 14 }} onClick={() => setMobileOpen(false)}>
            HUSH. Guide
          </Link>
          <Link href="/whats-included" className="home-nav-link" style={{ ...mobileLinkStyle, paddingLeft: 32, fontSize: 14 }} onClick={() => setMobileOpen(false)}>
            What&apos;s Included?
          </Link>
          <Link href="/fund" className="home-nav-link" style={mobileLinkStyle} onClick={() => setMobileOpen(false)}>
            Fund HUSH
          </Link>
          <div style={{ height: 1, background: V11.rule, margin: "6px 4px" }} />
          <Link href="/login" className="home-nav-link" style={mobileLinkStyle} onClick={() => setMobileOpen(false)}>
            Log In
          </Link>
          <Link
            href="/signup"
            className="home-btn-primary"
            style={{ margin: 4, textAlign: "center", background: C.rust, color: C.ink, fontWeight: 700, fontSize: 16, padding: "14px 20px", borderRadius: 8, textDecoration: "none" }}
            onClick={() => setMobileOpen(false)}
          >
            Join the Movement
          </Link>
        </div>
      ) : null}
    </header>
  );
}

function HomeHero() {
  return (
    <div style={{ position: "relative", minHeight: "max(760px, 100vh)", width: "100%", background: C.ink, display: "flex", alignItems: "center" }}>
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1000,
          margin: "0 auto",
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

        <h1 style={{ margin: "18px 0 0", fontFamily: cond, fontWeight: 400, fontSize: "clamp(56px, 9vw, 140px)", lineHeight: 0.9, color: C.onDark }}>
          POLITICS
          <br />
          IS NOISY.
        </h1>

        <div
          style={{
            marginTop: 20,
            display: "inline-block",
            backgroundImage:
              "linear-gradient(to bottom,rgba(228,87,46,0) 0 5%,rgba(228,87,46,0.88) 5% 18%,rgba(228,87,46,1) 18% 52%,rgba(228,87,46,1) 52% 84%,rgba(228,87,46,0.72) 84% 95%,rgba(228,87,46,0.3) 95% 100%),linear-gradient(96deg,rgba(228,87,46,0.5) 0 1.5%,rgba(228,87,46,1) 4% 92%,rgba(228,87,46,0.45) 99% 100%)",
            clipPath: "polygon(0.5% 7%, 2% 1.6%, 47% 0.2%, 97% 2.2%, 99.6% 8%, 100% 87%, 97.6% 98%, 45% 100%, 2% 97.6%, 0.2% 89%)",
            transform: "rotate(-0.6deg)",
            padding: "8px 32px 22px",
          }}
        >
          <span style={{ display: "block", fontFamily: cond, fontWeight: 400, fontSize: "clamp(42px, 6.9vw, 108px)", lineHeight: 0.94, color: C.ink }}>
            YOUR VOTE
            <br />
            SHOULDN&apos;T BE.
          </span>
        </div>

        <p style={{ marginTop: 40, maxWidth: "46ch", fontWeight: 400, fontSize: "clamp(18px, 1.6vw, 23px)", lineHeight: 1.58, color: V11.bodyMuted }}>
          HUSH gives you direct quotes, verified sources, and a clear way to compare candidates — so
          you can make an informed vote, without the noise.
        </p>

        <div style={{ marginTop: 42, display: "flex", alignItems: "center", gap: 34, flexWrap: "wrap" }}>
          <Link
            href="/signup"
            className="home-btn-primary"
            style={{ background: C.rust, color: C.ink, fontWeight: 700, fontSize: "clamp(16px, 1.35vw, 19px)", padding: "24px 38px", borderRadius: 8, textDecoration: "none" }}
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

function HomeFooter() {
  return (
    <footer style={{ background: C.ink, borderTop: `3px solid ${C.rust}` }}>
      <div
        className="home-footer-row1"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", padding: "26px 34px", borderBottom: `1px solid ${V11.rule}` }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Wordmark size={19} />
          <span aria-hidden style={{ width: 1, alignSelf: "stretch", background: V11.ruleStrong }} />
          <span style={{ fontWeight: 600, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.14em", color: V11.muted, lineHeight: 1.6 }}>
            QUESTION EVERYTHING.
            <br />
            SHOW THE RECEIPTS.
            <br />
            THINK FOR YOURSELF.
          </span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {FOOTER_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="home-footer-link" style={{ fontSize: 14, color: C.onDark, textDecoration: "none" }}>
              {item.label}
            </Link>
          ))}
        </nav>

        <form style={{ display: "flex", flexDirection: "column", gap: 8 }} onSubmit={(e) => e.preventDefault() /* no signup backend yet -- see build notes */}>
          <span style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: C.rust }}>THE BRIEF</span>
          <div style={{ display: "flex", gap: 8 }}>
            <label htmlFor="home-brief-email" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
              Email for the HUSH Brief
            </label>
            <input
              id="home-brief-email"
              type="email"
              placeholder="you@email.com"
              style={{ background: V11.field, border: "none", borderBottom: `2px solid ${C.rust}`, color: C.onDark, fontSize: 13, padding: "10px 12px", minWidth: 180 }}
            />
            <button
              type="submit"
              className="home-btn-primary"
              style={{ background: C.rust, color: C.ink, fontWeight: 700, fontSize: 13, padding: "10px 16px", borderRadius: 6, border: "none", cursor: "pointer" }}
            >
              Sign up
            </button>
          </div>
        </form>
      </div>

      <div className="home-footer-row2" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "16px 34px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: V11.faint }}>© 2026 HUSH.</span>
          <Link href="/fund" className="home-footer-link" style={{ fontSize: 12, color: V11.bodyMuted, textDecoration: "none" }}>
            Funded by members. No political money.
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {LEGAL_LINKS.map((item) => (
              <Link key={item.label} href={item.href} className="home-footer-link" style={{ fontSize: 12, color: V11.muted, textDecoration: "none" }}>
                {item.label}
              </Link>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="home-social-icon"
                style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${V11.ruleStrong}`, borderRadius: 6, color: C.onDark }}
              >
                {s.label === "Instagram" ? <InstagramIcon /> : s.label === "TikTok" ? <TikTokIcon /> : <XIcon />}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingHero() {
  return (
    <div style={{ background: C.ink }}>
      <HomeHeader />
      <HomeHero />
      <HomeFooter />
    </div>
  );
}
