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
 * The statement is the exact phrase and marker-slab highlight treatment
 * LandingHero.tsx uses for its own headline ("your vote shouldn't be") --
 * same hand-drawn clipPath shape, same rotation, same black-on-highlight
 * text -- so the footer closes the loop back to the marketing site's own
 * line, words and visual signature both, rather than its own separate
 * wordplay. The gradient's *color* is the one deliberate divergence: this
 * footer's highlight runs on persimmon (C.rust, `rgba(228,87,46,*)`) rather
 * than LandingHero's highlighter-orange, so if LandingHero's own headline
 * treatment is ever updated to match, say so explicitly -- until then the
 * two are intentionally out of sync on hue only. Persimmon is darker and
 * more saturated than the old orange, so black text on the gradient's peak
 * stop now clears ~5.7:1 (was ~7.4:1) -- still comfortably above the 4.5:1
 * minimum, just with less headroom; light text would clear only ~3.4:1
 * (was ~2.5:1) and stays ruled out either way, so black remains the right
 * choice here.
 */
export default function GlobalFooter() {
  return (
    <footer style={{ width: "100%", background: C.ink, padding: "18px 28px" }}>
      <div className="stack-row" style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {/* Statement -- one flowing line; wraps naturally rather than being
            forced with nowrap, so it never overflows at an in-between
            desktop width. Same phrase and highlight treatment LandingHero.tsx
            uses for its own headline ("your vote shouldn't be") -- the
            footer now closes the loop back to the marketing site's own line
            instead of its own separate wordplay. */}
        <p style={{ margin: 0, flex: 1, minWidth: 0, fontWeight: 400, fontSize: 15, lineHeight: 1.4, color: C.onDark }}>
          Politics is noisy,{" "}
          <span
            style={{
              display: "inline-block",
              backgroundImage:
                "linear-gradient(to bottom,rgba(228,87,46,0) 0 5%,rgba(228,87,46,0.88) 5% 18%,rgba(228,87,46,1) 18% 52%,rgba(228,87,46,1) 52% 84%,rgba(228,87,46,0.72) 84% 95%,rgba(228,87,46,0.3) 95% 100%),linear-gradient(96deg,rgba(228,87,46,0.5) 0 1.5%,rgba(228,87,46,1) 4% 92%,rgba(228,87,46,0.45) 99% 100%)",
              clipPath:
                "polygon(0.6% 8%,2.2% 2%,48% 0.3%,96.8% 2.4%,99.6% 9%,100% 86%,97.4% 98%,44% 100%,2% 97.4%,0.2% 88%)",
              transform: "rotate(-0.55deg)",
              padding: "1px 8px 3px",
              color: "#000000",
              fontWeight: 700,
            }}
          >
            your vote shouldn&apos;t be
          </span>
        </p>

        {/* HUSH. wordmark -- moved from the left edge to the right, now the
            last thing in the bar. */}
        <span style={{ display: "flex", alignItems: "baseline", flex: "0 0 auto" }}>
          <span style={{ fontFamily: cond, fontWeight: 600, fontSize: 15, letterSpacing: "0.18em", color: C.onDark }}>
            HUSH
          </span>
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: "0.35em",
              height: "0.35em",
              marginLeft: "0.08em",
              background: C.highlighter,
            }}
          />
        </span>
      </div>
    </footer>
  );
}
