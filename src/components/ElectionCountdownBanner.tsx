"use client";

import { C, cond } from "@/lib/theme";
import { useNow } from "@/lib/hooks";
import { ELECTION_ISO, KEY_DATES } from "@/lib/seed-data";
import { Kicker, RustButton } from "@/components/ui";

function formatCountdown(target: number, now: number) {
  const ms = Math.max(0, target - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${d} days · ${h} hrs · ${m} min · ${s} s`;
}

/**
 * The dark "Time until polls close" banner: live countdown, key dates
 * (Register by / Early voting / Mail ballot request), and the "Check my
 * registration" link-out. Self-contained and prop-free -- reads the election
 * date and key dates straight from seed-data and ticks its own clock -- so
 * any page can drop it in as-is. Originally Your Ballot's top banner; also
 * used at the top of HUSH Guide's tile grid.
 */
export default function ElectionCountdownBanner() {
  const target = new Date(ELECTION_ISO).getTime();
  // 0 until hydration, then ticks every second.
  const now = useNow(1000);

  return (
    <section
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28,
        padding: "20px 24px",
        borderRadius: 12,
        background: C.ink,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Kicker color={C.tan} style={{ letterSpacing: "0.16em" }}>
          Time until polls close
        </Kicker>
        <span
          style={{
            fontFamily: cond,
            fontSize: 38,
            lineHeight: 1,
            color: C.sand,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {now === 0 ? "—" : formatCountdown(target, now)}
        </span>
      </div>
      <span style={{ height: 44, width: 1, background: "rgba(243,239,228,0.2)" }} />
      {KEY_DATES.map((k) => (
        <div key={k.label} style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 12, color: C.tan }}>{k.label}</span>
          <span style={{ fontFamily: cond, fontSize: 19, color: C.sand }}>{k.value}</span>
        </div>
      ))}
      <RustButton
        style={{ marginLeft: "auto", padding: "12px 18px" }}
        onClick={() => window.open("https://www.vote.org/am-i-registered-to-vote/", "_blank", "noopener")}
      >
        Check my registration
      </RustButton>
    </section>
  );
}
