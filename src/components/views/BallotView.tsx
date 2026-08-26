"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BALLOT_STATE_STYLE, C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { useNow } from "@/lib/hooks";
import { ELECTION_ISO, KEY_DATES } from "@/lib/seed-data";
import type { BallotItem } from "@/lib/types";
import { Display, InkButton, Kicker, Pill, RustButton } from "@/components/ui";

function formatCountdown(target: number, now: number) {
  const ms = Math.max(0, target - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${d} days · ${h} hrs · ${m} min · ${s} s`;
}

export default function BallotView({ ballot }: { ballot: BallotItem[] }) {
  const router = useRouter();
  const { polling, setPolling } = usePrefs();
  const [addr, setAddr] = useState("");
  const target = new Date(ELECTION_ISO).getTime();
  // 0 until hydration, then ticks every second.
  const now = useNow(1000);

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
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
            Time to polls close
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

      <div className="stack-row" style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 420, display: "flex", flexDirection: "column", gap: 11 }}>
          <Display size={21}>{ballot.length} races on your ballot</Display>
          {ballot.map((b) => {
            const style = BALLOT_STATE_STYLE[b.state];
            return (
              <div
                key={b.race}
                className="card-hover stack-grid"
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/politician/${b.politicianId}`)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/politician/${b.politicianId}`)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.3fr 1.6fr 108px 112px",
                  gap: 14,
                  alignItems: "center",
                  border: `1px solid ${C.line}`,
                  borderRadius: 10,
                  background: C.white,
                  padding: "13px 16px",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontFamily: cond,
                    fontSize: 16,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {b.race}
                </span>
                <span style={{ fontSize: 13, color: C.body }}>{b.candidates}</span>
                <span
                  style={{
                    fontFamily: cond,
                    fontSize: 12,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: C.muted,
                  }}
                >
                  {b.level}
                </span>
                <Pill bg={style.bg} fg={style.fg} style={{ justifySelf: "end", padding: "5px 11px" }}>
                  {b.state}
                </Pill>
              </div>
            );
          })}
        </div>

        <div style={{ width: 360, flex: "0 0 360px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              height: 220,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              background:
                "repeating-linear-gradient(0deg,#F3EFE4 0 23px,rgba(21,21,21,0.07) 23px 24px)," +
                "repeating-linear-gradient(90deg,#F3EFE4 0 23px,rgba(21,21,21,0.07) 23px 24px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 12,
                left: 14,
                fontFamily: cond,
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: C.muted,
                background: C.sand,
                padding: "2px 6px",
              }}
            >
              Precinct map · placeholder
            </span>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: "50% 50% 50% 4px",
                transform: "rotate(-45deg)",
                background: C.rust,
                boxShadow: "0 3px 10px rgba(21,21,21,0.2)",
              }}
            />
          </div>

          <div
            style={{
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              background: C.white,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <Kicker>Polling place</Kicker>
            <Display size={20}>{polling.name}</Display>
            <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{polling.detail}</span>
            <form
              style={{ display: "flex", gap: 8 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (!addr.trim()) return;
                setPolling({
                  name: "Precinct 214 · Community Hall",
                  detail: `${addr.trim()} · 0.4 mi · Open 7am–7pm on election day`,
                });
              }}
            >
              <input
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                placeholder="Enter a different address"
                aria-label="Address for polling place lookup"
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "10px 12px",
                  border: "1px solid rgba(21,21,21,0.2)",
                  borderRadius: 8,
                  background: C.sandDeep,
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <InkButton style={{ padding: "10px 15px", borderRadius: 8 }}>Find</InkButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
