"use client";

import Link from "next/link";
import { useState } from "react";
import { C } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";
import { Wordmark } from "./MarketingHeader";

const FOOTER_NAV = [
  { label: "Our Story", href: "/our-story" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Fund HUSH.", href: "/fund-hush" },
];

const LEGAL_LINKS = [
  { label: "Our Methodology", href: "/methodology" },
  { label: "File a Dispute", href: "/dispute" },
  { label: "Privacy & Terms", href: "/privacy-terms" },
  { label: "Contact", href: "/contact" },
];

// X is left out until HUSH. has an account there (the XIcon glyph below is
// kept so adding it back is one line).
const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/hushpolitics/" },
  { label: "TikTok", href: "https://www.tiktok.com/@hushpolitics" },
];

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

export function MarketingFooter() {
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website: trap }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <footer style={{ background: C.ink, borderTop: `3px solid ${C.rust}` }}>
      <div
        className="home-footer-row1"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", padding: "26px 34px", borderBottom: `1px solid ${MK.ruleDark}` }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Wordmark size={19} />
          <span aria-hidden style={{ width: 1, alignSelf: "stretch", background: MK.ruleDarkStrong }} />
          <span style={{ fontWeight: 600, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.14em", color: MK.mutedDark, lineHeight: 1.6 }}>
            Quiet the noise.
            <br />
            Read the receipts.
            <br />
            Vote with clarity.
          </span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {FOOTER_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="home-footer-link" style={{ fontSize: 14, color: C.onDark, textDecoration: "none" }}>
              {item.label}
            </Link>
          ))}
        </nav>

        <form style={{ display: "flex", flexDirection: "column", gap: 8 }} onSubmit={signUp}>
          <span style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: C.rust }}>JOIN THE MOVEMENT</span>
          <div style={{ display: "flex", gap: 8 }}>
            {/* Mirrors the visible label's intent ("JOIN THE MOVEMENT") rather
                than repeating it verbatim, which would read awkwardly as
                "Email for the HUSH Join the Movement". */}
            <label htmlFor="footer-brief-email" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
              Email to join the HUSH. Movement
            </label>
            <input
              id="footer-brief-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              style={{ background: MK.field, border: "none", borderBottom: `2px solid ${C.rust}`, color: C.onDark, fontSize: 13, padding: "10px 12px", minWidth: 180 }}
            />
            <button
              type="submit"
              disabled={status === "sending" || status === "done"}
              className="home-btn-primary"
              style={{ background: C.rust, color: C.ink, fontWeight: 700, fontSize: 13, padding: "10px 16px", border: "none", cursor: "pointer" }}
            >
              {status === "sending" ? "Signing up..." : "Sign up"}
            </button>
          </div>
          {/* Honeypot: hidden from people, filled in by bots. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            value={trap}
            onChange={(e) => setTrap(e.target.value)}
            style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }}
          />
          <span role="status" style={{ fontSize: 12, minHeight: 16, color: status === "error" ? C.rust : MK.mutedDark }}>
            {status === "done" ? "You’re in. Thank you." : status === "error" ? "Something went wrong. Please try again." : ""}
          </span>
        </form>
      </div>

      <div className="home-footer-row2" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "16px 34px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: MK.muted }}>© 2026 HUSH.</span>
          <Link href="/fund-hush" className="home-footer-link" style={{ fontSize: 12, color: MK.onBlackBody, textDecoration: "none" }}>
            Funded by voters. No political money.
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {LEGAL_LINKS.map((item) => (
              <Link key={item.label} href={item.href} className="home-footer-link" style={{ fontSize: 12, color: MK.mutedDark, textDecoration: "none" }}>
                {item.label}
              </Link>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="home-social-icon"
                style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${MK.ruleDarkStrong}`, color: C.onDark }}
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
