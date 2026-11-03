"use client";

import { C, cond } from "@/lib/theme";
import { useMounted, useNow } from "@/lib/hooks";
import { ELECTION_ISO, POLLS_OPEN_ISO } from "@/lib/app-content";

const DAY = 86400000;
// Florida's Panhandle counties are on Central Time, so their polls close an
// hour after the Eastern ones (ELECTION_ISO is 7 pm ET).
const PANHANDLE_CLOSE_OFFSET = 3600000;

function hms(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

type Phase = { value: string; label: string; note?: string; ticking: boolean };

function phaseAt(now: number): Phase {
  const open = new Date(POLLS_OPEN_ISO).getTime();
  const close = new Date(ELECTION_ISO).getTime();
  if (now < open) {
    const ms = open - now;
    if (ms >= DAY) {
      const days = Math.floor(ms / DAY);
      return { value: String(days), label: days === 1 ? "day until Election Day" : "days until Election Day", ticking: false };
    }
    return { value: hms(ms), label: "until polls open", ticking: true };
  }
  if (now < close) {
    return {
      value: hms(close - now),
      label: "until polls close",
      note: "7 pm Eastern. Panhandle counties (Central Time) close at 8 pm ET.",
      ticking: true,
    };
  }
  if (now < close + PANHANDLE_CLOSE_OFFSET) {
    return {
      value: "Closed",
      label: "Eastern Time polls",
      note: "Panhandle counties (Central Time) close at 8 pm ET. Anyone in line by then can still vote.",
      ticking: false,
    };
  }
  return { value: "Closed", label: "Polls have closed", ticking: false };
}

/**
 * The "days until Election Day" figure, which turns into a live HH:MM:SS timer
 * once polls are less than 24 hours from opening, then counts down to close.
 * `stack` is the tall Guide panel (big number over its label); `row` is the
 * inline number-plus-label used on the Feed card and the Voting Plan.
 */
export default function ElectionClock({
  size,
  labelSize,
  layout = "row",
}: {
  size: number;
  labelSize: number;
  layout?: "row" | "stack";
}) {
  const mounted = useMounted();
  const now = useNow(1000);
  const phase = mounted ? phaseAt(now) : null;
  // The stacked panel keeps its short "Days to go" wording while a day count shows.
  const label =
    phase && layout === "stack" && phase.label.endsWith("until Election Day")
      ? phase.value === "1"
        ? "Day to go"
        : "Days to go"
      : phase?.label;
  const valueStyle = {
    fontFamily: cond,
    fontSize: size,
    lineHeight: 1,
    color: C.ink,
    fontVariantNumeric: "tabular-nums" as const,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div
        style={{
          display: "flex",
          flexDirection: layout === "stack" ? "column" : "row",
          alignItems: layout === "stack" ? "flex-start" : "baseline",
          gap: layout === "stack" ? 0 : 8,
        }}
      >
        <span style={valueStyle} suppressHydrationWarning>
          {phase ? phase.value : "—"}
        </span>
        <span style={{ fontSize: labelSize, color: layout === "stack" ? C.ink : C.body }}>{label ?? ""}</span>
      </div>
      {phase?.note ? <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{phase.note}</span> : null}
    </div>
  );
}
