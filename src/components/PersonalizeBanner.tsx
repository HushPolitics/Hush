"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { createClient } from "@/lib/supabase/client";

/**
 * Nudges a signed-in user who skipped the address/priorities steps to go
 * finish them. Gated on a live session — an anonymous visitor browsing the
 * demo data never has an account to "finish" onboarding for, so they'd just
 * be nagged to sign up, which isn't this banner's job (the landing page's
 * Create Account button already covers that).
 */
export default function PersonalizeBanner() {
  const { onboarded } = usePrefs();
  const [signedIn, setSignedIn] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
  }, []);

  if (!signedIn || onboarded || dismissed) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 28px",
        background: C.shell,
        borderBottom: `1px solid ${C.line}`,
        flex: "0 0 auto",
      }}
    >
      <span style={{ fontFamily: cond, fontSize: 13, letterSpacing: "0.04em", color: C.body }}>
        Finish personalizing your HUSH — add your address and rank what matters to you.
      </span>
      <Link
        href="/signup"
        style={{
          marginLeft: "auto",
          fontFamily: cond,
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: C.navy,
          whiteSpace: "nowrap",
        }}
      >
        Finish setup
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          border: 0,
          background: "transparent",
          color: C.muted,
          fontSize: 13,
          cursor: "pointer",
          padding: 4,
        }}
      >
        ✕
      </button>
    </div>
  );
}
