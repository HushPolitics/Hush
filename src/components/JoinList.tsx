"use client";

import Link from "next/link";
import { useState } from "react";
import { C, cond } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";
import { Wordmark } from "@/components/marketing/MarketingHeader";

// Standalone lead-capture page for the Instagram and TikTok bio links. No
// site nav and nothing else links here: it has one job, which is the email.
// Signups go through the same /api/signup route as the footer form.

const mono = "var(--font-mono), ui-monospace, monospace";

const PERKS = [
  {
    n: "01",
    title: "The signal, not the noise",
    body: "What actually happened in politics, sourced and in plain English. No spin, no outrage bait.",
  },
  {
    n: "02",
    title: "Early access",
    body: "New HUSH. features before anyone else, and a say in what we build next.",
  },
  {
    n: "03",
    title: "Merch drops",
    body: "First look at HUSH. gear before it goes public.",
  },
];

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/hushpolitics/" },
  { label: "TikTok", href: "https://www.tiktok.com/@hushpolitics" },
];

export default function JoinList() {
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMessage("");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website: trap, source: "join" }),
      });
      if (res.ok) {
        setStatus("done");
        return;
      }
      let message = "";
      try {
        const data = (await res.json()) as { error?: unknown };
        if (typeof data.error === "string") message = data.error;
      } catch {
        // Non-JSON error body: fall through to the generic message.
      }
      setErrorMessage(message || "Something went wrong. Please try again.");
      setStatus("error");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: C.ink, color: C.onDark }}>
      <div aria-hidden style={{ height: 4, background: C.rust }} />

      <header style={{ padding: "28px 24px 0", width: "100%", maxWidth: 840, margin: "0 auto" }}>
        <Link href="/" aria-label="HUSH home" style={{ display: "inline-block", textDecoration: "none" }}>
          <Wordmark size={34} />
        </Link>
      </header>

      <main style={{ flex: 1, width: "100%", maxWidth: 840, margin: "0 auto", padding: "56px 24px 64px" }}>
        <span
          style={{
            display: "block",
            fontWeight: 700,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: C.rust,
            marginBottom: 20,
          }}
        >
          THE HUSH. LIST
        </span>

        <h1
          style={{
            fontFamily: cond,
            fontWeight: 400,
            fontSize: "clamp(36px, 8.5vw, 68px)",
            lineHeight: 1.04,
            letterSpacing: "-0.01em",
            color: C.onDark,
            marginBottom: 22,
          }}
        >
          Politics is noisy. Your inbox doesn&apos;t have to be.
        </h1>

        <p style={{ fontSize: "clamp(16px, 2.4vw, 19px)", lineHeight: 1.55, color: MK.onBlackBody, maxWidth: 580, marginBottom: 36 }}>
          Get the stuff worth knowing, minus the screaming. Join the list for the latest in politics, early releases,
          and first dibs on merch.
        </p>

        <div aria-live="polite" style={{ maxWidth: 580 }}>
          {status === "done" ? (
            <div style={{ borderLeft: `3px solid ${C.rust}`, padding: "4px 0 4px 20px" }}>
              <div style={{ fontFamily: cond, fontSize: "clamp(26px, 5vw, 36px)", lineHeight: 1.1, color: C.onDark, marginBottom: 12 }}>
                You&apos;re on the list.
              </div>
              <p style={{ fontSize: 17, lineHeight: 1.55, color: MK.onBlackBody, marginBottom: 22 }}>
                Thanks for being early. Want to see what we&apos;re building right now?
              </p>
              <Link
                href="/"
                className="home-btn-primary"
                style={{
                  display: "inline-block",
                  background: C.rust,
                  color: C.ink,
                  fontWeight: 700,
                  fontSize: 16,
                  padding: "16px 28px",
                  textDecoration: "none",
                }}
              >
                Explore HUSH. →
              </Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="join-form-row">
                <label htmlFor="join-email" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
                  Email address
                </label>
                <input
                  id="join-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  style={{
                    background: MK.field,
                    border: "none",
                    borderBottom: `2px solid ${C.rust}`,
                    color: C.onDark,
                    // 16px keeps iOS Safari from zooming the page on focus.
                    fontSize: 16,
                    padding: "16px 18px",
                    borderRadius: 0,
                  }}
                />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="home-btn-primary"
                  style={{
                    background: C.rust,
                    color: C.ink,
                    fontWeight: 700,
                    fontSize: 16,
                    padding: "16px 28px",
                    border: "none",
                    borderRadius: 0,
                    cursor: status === "sending" ? "default" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {status === "sending" ? "Joining..." : "Join the list"}
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

              {status === "error" ? (
                <div role="alert" style={{ marginTop: 12, fontSize: 14, color: C.rust }}>
                  {errorMessage}
                </div>
              ) : null}

              <p style={{ marginTop: 14, fontSize: 13, lineHeight: 1.5, color: MK.mutedDark }}>
                We never sell or share your email.{" "}
                <Link
                  href="/privacy-terms"
                  className="home-link-underline"
                  style={{ color: MK.onBlackBody, textDecoration: "none", borderBottom: `1px solid ${MK.ruleDarkStrong}` }}
                >
                  Privacy &amp; Terms
                </Link>
              </p>
            </form>
          )}
        </div>

        <ol style={{ listStyle: "none", marginTop: 64, borderTop: `1px solid ${MK.ruleDark}` }}>
          {PERKS.map((perk) => (
            <li
              key={perk.n}
              style={{ display: "grid", gridTemplateColumns: "52px 1fr", gap: 8, padding: "26px 0", borderBottom: `1px solid ${MK.ruleDark}` }}
            >
              <span style={{ fontFamily: mono, fontWeight: 500, fontSize: 15, color: C.rust, paddingTop: 3 }}>{perk.n}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: C.onDark, marginBottom: 6 }}>{perk.title}</div>
                <p style={{ fontSize: 15.5, lineHeight: 1.55, color: MK.onBlackBody }}>{perk.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </main>

      <footer style={{ borderTop: `1px solid ${MK.ruleDark}` }}>
        <div
          style={{
            width: "100%",
            maxWidth: 840,
            margin: "0 auto",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13, color: MK.onBlackBody }}>Funded by voters. No political money.</span>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="home-footer-link"
                style={{ fontSize: 13, color: C.onDark, textDecoration: "none" }}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
