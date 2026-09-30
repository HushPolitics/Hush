import type { ReactNode } from "react";
import { C, cond } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";
import { APP_SAMPLE as APP } from "@/lib/appSampleTheme";

// Shared building blocks for the "logged-in app" samples on the public
// marketing pages -- first built page-local for HUSH. Guide (Step 4),
// pulled out here once What's Included (Step 5) needed the identical
// panel/caption/kicker treatment for its Compare and Follow the Money
// samples. Not every sample uses all three: some pages need a bespoke
// header inside the panel (their own padding, a multi-line kicker) and
// only reuse SampleCaption -- see GuideOverview's laptop preview and
// WhatsIncluded's Feed/Stance Check samples for that case.

// 7px persimmon square + gray note (12px), the caption under every sample.
export function SampleCaption({ text }: { text: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 12, color: MK.muted }}>
      <span aria-hidden style={{ width: 7, height: 7, background: C.rust, display: "block" }} />
      {text}
    </span>
  );
}

// The standard sample panel: app background, hairline border, soft shadow,
// 18px/16px/16px padding. Use a bespoke wrapper instead when a sample's
// padding or header doesn't match this (e.g. Feed's 18/18/8, Stance
// Check's 20/18/18).
export function SampleCard({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: APP.bg, border: `1px solid ${MK.rule}`, boxShadow: "0 12px 30px -18px rgba(28,25,23,0.25)", padding: "18px 16px 16px" }}>
      {children}
    </div>
  );
}

// Orange caps eyebrow + Archivo Black title, the two-line header most
// sample panels open with.
export function SampleKicker({ label, title }: { label: string; title: string }) {
  return (
    <>
      <span style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.rust }}>{label}</span>
      <span style={{ display: "block", marginTop: 6, fontSize: 17, lineHeight: 1.15, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink }}>
        {title}
      </span>
    </>
  );
}
