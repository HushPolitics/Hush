import Link from "next/link";
import { C, cond } from "@/lib/theme";

/**
 * Blocking notice shown in place of Stance Check while the feature is paused
 * (see STANCE_CHECK_PAUSED in src/app/stance-check/page.tsx). It is a modal
 * with no close button: the only ways out are the two links, so nobody lands
 * on the quiz underneath.
 */
export default function StanceCheckPaused() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(21,21,21,0.55)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stance-check-paused-title"
        style={{
          width: "100%",
          maxWidth: 460,
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          background: C.white,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 20px 60px rgba(21,21,21,0.28)",
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: C.rust,
          }}
        >
          Beta
        </span>
        <h1
          id="stance-check-paused-title"
          style={{ margin: 0, fontFamily: cond, fontSize: 28, lineHeight: 1.15, color: C.ink }}
        >
          Stance Check is under construction
        </h1>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: C.body }}>
          Stance Check is still in beta and we&rsquo;re fixing a few glitches. Come back after the
          election to see where you agree and disagree with your current legislators.
        </p>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: C.body }}>
          The questions will refresh every week, so you can get a Stance Check on more nuanced
          issues.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
          <Link
            href="/hush-guide"
            style={{
              padding: "11px 18px",
              borderRadius: 8,
              background: C.ink,
              color: C.white,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Open the HUSH. Guide
          </Link>
          <Link
            href="/feed"
            style={{
              padding: "11px 18px",
              borderRadius: 8,
              border: `1px solid ${C.line}`,
              color: C.ink,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Back to the Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
