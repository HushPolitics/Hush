import { C, cond } from "@/lib/theme";

/**
 * Global brand-statement footer for every logged-in HUSH page. Mounted once
 * in AppShell, inside the `.scroll` pane right after `{children}` -- so it
 * sits in each page's normal scroll flow and only comes into view once a
 * reader reaches the bottom of that page's content, the way a real footer
 * would. (Not the same element as the existing "Illustrative placeholder
 * data" bar at the very bottom of AppShell -- that one lives outside the
 * scroll pane and stays pinned on screen at all times.)
 *
 * "Including us." reuses the exact marker-slab highlight treatment
 * LandingHero.tsx uses for "your vote shouldn't be" -- same gradient, same
 * hand-drawn clipPath shape, same rotation, same black-on-orange text (the
 * gradient's peak color only clears ~2.5:1 for light text vs ~7.4:1 for
 * black, per that component's own note) -- so this is the one deliberate
 * spot where the calm product borrows the marketing site's exact visual
 * signature, not just its color.
 */
export default function GlobalFooter() {
  return (
    <footer style={{ width: "100%", background: C.ink, padding: "26px 28px" }}>
      <div className="stack-row" style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {/* HUSH. wordmark */}
        <span style={{ display: "flex", alignItems: "baseline", flex: "0 0 auto" }}>
          <span style={{ fontFamily: cond, fontWeight: 600, fontSize: 20, letterSpacing: "0.2em", color: C.onDark }}>
            HUSH
          </span>
          <span style={{ fontFamily: cond, fontWeight: 600, fontSize: 20, color: C.highlighter }}>.</span>
        </span>

        {/* Statement -- one flowing line; wraps naturally rather than being
            forced with nowrap, so it never overflows at an in-between
            desktop width. */}
        <p style={{ margin: 0, flex: 1, minWidth: 0, fontFamily: cond, fontWeight: 400, fontSize: 20, lineHeight: 1.3, color: C.onDark }}>
          Don&apos;t let anyone tell you how to vote.{" "}
          <span
            style={{
              display: "inline-block",
              backgroundImage:
                "linear-gradient(to bottom,rgba(255,109,0,0) 0 5%,rgba(255,126,22,0.88) 5% 18%,rgba(255,122,14,1) 18% 52%,rgba(236,96,0,1) 52% 84%,rgba(255,109,0,0.72) 84% 95%,rgba(255,109,0,0.3) 95% 100%),linear-gradient(96deg,rgba(255,109,0,0.5) 0 1.5%,rgba(255,109,0,1) 4% 92%,rgba(255,109,0,0.45) 99% 100%)",
              clipPath:
                "polygon(0.6% 8%,2.2% 2%,48% 0.3%,96.8% 2.4%,99.6% 9%,100% 86%,97.4% 98%,44% 100%,2% 97.4%,0.2% 88%)",
              transform: "rotate(-0.55deg)",
              padding: "2px 10px 5px",
              color: "#000000",
              fontWeight: 700,
            }}
          >
            Including us.
          </span>
        </p>

        {/* Right, anchored: a straight orange rule, then the tagline. */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "0 0 auto" }}>
          <span aria-hidden style={{ width: 32, height: 2, background: C.highlighter, flex: "0 0 32px" }} />
          <span
            style={{ fontFamily: cond, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: C.tan, whiteSpace: "nowrap" }}
          >
            Facts. Sources. Your Decision.
          </span>
        </div>
      </div>
    </footer>
  );
}
