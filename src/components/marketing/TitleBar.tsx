import { C, cond } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";

// Shared title-bar pattern for every inner page (first built for Our Story,
// Step 2): a small eyebrow label with a persimmon square standing in for
// the period, then one headline line with a highlighted word/phrase in the
// same sticker treatment. `before`/`after` are both optional since the
// highlight sits at the end for Our Story/How It Works ("Why we built
// HUSH.", "...finally made clear.") but at the very start for HUSH. Guide
// ("Every race on your ballot.") -- pass whichever side(s) the copy needs.
export function MarketingTitleBar({
  eyebrow,
  before,
  highlight,
  after,
}: {
  eyebrow: string;
  before?: string;
  highlight: string;
  after?: string;
}) {
  return (
    <section style={{ background: C.ink, padding: "40px 34px 46px", borderBottom: `1px solid ${MK.ruleDark}` }}>
      <span style={{ display: "flex", alignItems: "baseline", fontSize: 14, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.onDark }}>
        {eyebrow}
        <span aria-hidden style={{ display: "inline-block", width: 6, height: 6, background: C.rust, marginLeft: 3 }} />
      </span>
      <h1
        style={{
          margin: "18px 0 0",
          fontFamily: cond,
          fontWeight: 400,
          fontSize: "clamp(28px, 3.6vw, 58px)",
          lineHeight: 1.05,
          textTransform: "uppercase",
          color: C.onDark,
        }}
      >
        {before ? <>{before}{" "}</> : null}
        <span
          style={{
            display: "inline-block",
            background: C.rust,
            color: C.ink,
            padding: "0.02em 0.14em 0.06em",
            transform: "rotate(-1deg)",
            clipPath: "polygon(0.8% 6%, 3% 0%, 50% 1.5%, 97% 0%, 100% 8%, 99.4% 92%, 96% 100%, 48% 98%, 2% 100%, 0% 90%)",
          }}
        >
          {highlight}
        </span>
        {after ? <>{" "}{after}</> : null}
      </h1>
    </section>
  );
}
