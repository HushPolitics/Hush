"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { C } from "@/lib/theme";
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
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
  }, []);

  // Never over HUSH. Guide or its setup screens: that's where the person is
  // already finishing setup, and the Guide should show nothing but that step.
  if (pathname.startsWith("/hush-guide") || pathname.startsWith("/profile/top-issues")) return null;
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
      <span style={{ fontSize: 13, letterSpacing: "0.04em", color: C.body }}>
        Finish personalizing your HUSH. Add your address and rank what matters to you.
      </span>
      <Link
        href="/hush-guide"
        style={{
          marginLeft: "auto",
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: C.rust,
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
