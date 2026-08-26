"use client";

import type { CSSProperties, ReactNode } from "react";
import { C, cond } from "@/lib/theme";

/** Small-caps condensed eyebrow used above nearly every heading in the design. */
export function Kicker({ children, color = C.rust, size = 11, style }: {
  children: ReactNode;
  color?: string;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: cond,
        fontSize: size,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** Condensed display type. */
export function Display({ children, size = 25, color = C.ink, style }: {
  children: ReactNode;
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span style={{ fontFamily: cond, fontSize: size, color, lineHeight: 1.1, ...style }}>
      {children}
    </span>
  );
}

/** Track + fill bar. Used for trust, alignment and issue weight. */
export function Bar({ pct, color, height = 6, track = C.shell, style }: {
  pct: number;
  color: string;
  height?: number;
  track?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        flex: 1,
        height,
        borderRadius: height / 2,
        background: track,
        display: "block",
        overflow: "hidden",
        ...style,
      }}
    >
      <span
        style={{
          display: "block",
          height,
          borderRadius: height / 2,
          width: `${Math.max(0, Math.min(100, pct))}%`,
          background: color,
        }}
      />
    </span>
  );
}

/** Rounded pill used for verdicts, promise statuses and stance tags. */
export function Pill({ children, bg, fg, style }: {
  children: ReactNode;
  bg: string;
  fg: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        padding: "4px 11px",
        borderRadius: 14,
        fontSize: 12,
        whiteSpace: "nowrap",
        background: bg,
        color: fg,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** Filter chip. `on` drives the inverted ink treatment. */
export function Chip({ on, onClick, children, dot }: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  dot?: string;
}) {
  return (
    <button
      type="button"
      className="chip"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 14px",
        borderRadius: 20,
        fontSize: 13,
        whiteSpace: "nowrap",
        cursor: "pointer",
        background: on ? C.ink : "transparent",
        color: on ? C.sand : C.body,
        border: `1px solid ${on ? C.ink : "rgba(21,21,21,0.18)"}`,
      }}
    >
      {dot ? (
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot }} />
      ) : null}
      {children}
    </button>
  );
}

/** Square-cornered avatar carrying a politician's initials. */
export function Avatar({ text, size = 28, bg = C.shell, fg = C.body, radius, font }: {
  text: string;
  size?: number;
  bg?: string;
  fg?: string;
  radius?: number;
  font?: number;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        borderRadius: radius ?? Math.round(size / 4),
        background: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: cond,
        fontSize: font ?? Math.round(size * 0.4),
      }}
    >
      {text}
    </span>
  );
}

export function Card({ children, style, className }: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        background: C.white,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: 24,
        border: "1px dashed rgba(21,21,21,0.2)",
        borderRadius: 10,
        fontSize: 13,
        color: C.muted,
      }}
    >
      {children}
    </div>
  );
}

/** Primary rust action button. */
export function RustButton({ children, onClick, style, type = "button" }: {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className="btn-rust"
      onClick={onClick}
      style={{
        border: 0,
        padding: "11px 18px",
        borderRadius: 8,
        background: C.rust,
        color: C.sand,
        fontFamily: cond,
        fontSize: 15,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function InkButton({ children, onClick, style, type = "submit" }: {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className="btn-ink"
      onClick={onClick}
      style={{
        border: 0,
        padding: 12,
        borderRadius: 7,
        background: C.ink,
        color: C.sand,
        fontFamily: cond,
        fontSize: 14,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, style }: {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={onClick}
      style={{
        padding: 12,
        borderRadius: 7,
        border: "1px solid rgba(21,21,21,0.2)",
        background: "transparent",
        fontFamily: cond,
        fontSize: 14,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Search field with the design's hairline border and sand fill. */
export function SearchField({ value, onChange, placeholder, style, className }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "0 12px",
        border: "1px solid rgba(21,21,21,0.16)",
        borderRadius: 7,
        background: C.sandDeep,
        ...style,
      }}
    >
      <span style={{ fontSize: 13, color: C.faint }} aria-hidden>
        ⌕
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          border: 0,
          background: "transparent",
          padding: "9px 0",
          fontSize: 13,
          color: C.ink,
          outline: "none",
        }}
      />
    </div>
  );
}
