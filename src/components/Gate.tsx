import Link from "next/link";
import type { ReactNode } from "react";
import { C, cond } from "@/lib/theme";
import { getUser, hasEntitlement } from "@/lib/supabase/server";

/**
 * Subscription gate.
 *
 * Wrap any paid surface in this. While the pay structure is undecided,
 * PAYWALL_ENABLED is off and everything renders — so the gate can be placed
 * correctly now and switched on later without touching the views.
 *
 * Set NEXT_PUBLIC_PAYWALL=on to turn it on.
 */
export const PAYWALL_ENABLED = process.env.NEXT_PUBLIC_PAYWALL === "on";

export default async function Gate({
  children,
  feature,
  blurb,
}: {
  children: ReactNode;
  feature: string;
  blurb?: string;
}) {
  if (!PAYWALL_ENABLED) return <>{children}</>;

  const [user, entitled] = await Promise.all([getUser(), hasEntitlement()]);
  if (entitled) return <>{children}</>;

  return (
    <div style={{ padding: "24px 28px" }}>
      <div
        style={{
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          background: C.white,
          padding: 28,
          maxWidth: 560,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: cond,
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.rust,
          }}
        >
          Members only
        </span>
        <span style={{ fontFamily: cond, fontSize: 25 }}>{feature}</span>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.body }}>
          {blurb ??
            "Trust scores and your ballot stay free. This part needs a membership."}
        </p>
        <div style={{ display: "flex", gap: 9, marginTop: 4 }}>
          <Link
            href="/pricing"
            style={{
              padding: "11px 18px",
              borderRadius: 8,
              background: C.rust,
              color: C.sand,
              fontFamily: cond,
              fontSize: 15,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            See plans
          </Link>
          {!user ? (
            <Link
              href="/login"
              style={{
                padding: "11px 18px",
                borderRadius: 8,
                border: "1px solid rgba(21,21,21,0.2)",
                color: C.ink,
                fontFamily: cond,
                fontSize: 15,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
