"use client";

import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { C, cond } from "@/lib/theme";
import { shortPhrase } from "@/lib/guide";

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

/**
 * Filter chip. `on` drives the selected treatment -- navy/cream by default,
 * matching the selected-answer treatment AnswerChip (Stance Check) already
 * uses. `activeBg`/`activeFg` are there so one call site can override the
 * color for a specific reason (see PoliticiansView's party-filter row,
 * which keeps the old ink/sand treatment so a selected "Democrat" chip
 * doesn't render in the same navy as its own party dot).
 */
export function Chip({ on, onClick, children, dot, activeBg = C.navy, activeFg = C.cream }: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  dot?: string;
  activeBg?: string;
  activeFg?: string;
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
        background: on ? activeBg : "transparent",
        color: on ? activeFg : C.body,
        border: `1px solid ${on ? activeBg : C.lineHard}`,
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

export function Card({ children, style, className, onClick, onKeyDown, role, tabIndex, id, "aria-label": ariaLabel }: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  role?: string;
  tabIndex?: number;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      id={id}
      className={className}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
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
        border: `1px dashed ${C.lineHard}`,
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
        border: `1px solid ${C.lineHard}`,
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
        border: `1px solid ${C.lineHard}`,
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

/**
 * A verbatim sourced quote, truncated by default with a "Show more" toggle --
 * the public site's commitment is that a candidate's position is always the
 * actual quote (never a paraphrase), but a Compare cell or Guide race card
 * doesn't have room for the full 50-190 characters a real excerpt runs.
 * Truncating and expanding in place keeps the full quote one click away
 * without redesigning either surface's layout around worst-case quote
 * length. Quoting style (curly quotes, italic) matches the politician page's
 * own "Positions" section, so the same excerpt reads the same everywhere.
 */
export function ExpandableQuote({ text, maxLen = 92, style }: {
  text: string;
  maxLen?: number;
  style?: CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);
  const truncated = text.length > maxLen;
  const shown = expanded || !truncated ? text : shortPhrase(text, maxLen);
  return (
    <span style={{ fontStyle: "italic", ...style }}>
      &ldquo;{shown}&rdquo;
      {truncated ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          style={{
            marginLeft: 6,
            border: 0,
            background: "transparent",
            padding: 0,
            font: "inherit",
            fontStyle: "normal",
            fontSize: 11,
            color: C.navy,
            cursor: "pointer",
            textDecoration: "underline",
            whiteSpace: "nowrap",
          }}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </span>
  );
}

/**
 * One flat single-stroke line glyph per TOPIC_POOL issue -- same hand-drawn,
 * no-fill convention TypeIcon already established for Feed event types,
 * reused here rather than starting a second visual language for icons.
 * Guns uses a plain shield and Reproductive rights a document glyph,
 * deliberately, rather than anything more literal -- staying neutral on
 * genuinely contested topics the same way STATUS_STYLE and RESULT_STYLE
 * already do with color.
 */
export function IssueIcon({ topic, size = 16, color = C.ink }: { topic: string; size?: number; color?: string }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: color,
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (topic) {
    case "Healthcare":
      return (
        <svg {...common} aria-hidden>
          <circle cx="8" cy="8" r="5.5" />
          <line x1="8" y1="5.2" x2="8" y2="10.8" />
          <line x1="5.2" y1="8" x2="10.8" y2="8" />
        </svg>
      );
    case "Housing":
      return (
        <svg {...common} aria-hidden>
          <path d="M2.5 8.5L8 3.5L13.5 8.5" />
          <path d="M4 7.5V13H12V7.5" />
        </svg>
      );
    case "Voting rights":
      return (
        <svg {...common} aria-hidden>
          <path d="M3 6h10l-1 7.5H4L3 6z" />
          <line x1="5.5" y1="6" x2="6" y2="3.5" />
          <line x1="10.5" y1="6" x2="10" y2="3.5" />
          <line x1="6" y1="3.5" x2="10" y2="3.5" />
          <line x1="5.5" y1="8.7" x2="10.5" y2="8.7" />
        </svg>
      );
    case "Climate":
      return (
        <svg {...common} aria-hidden>
          <path d="M8 13.5C4 12 3 8 5 4.5C7.5 6 10 5 12 3C13 7 12 11 8 13.5Z" />
          <line x1="8" y1="13.5" x2="10.5" y2="4.5" />
        </svg>
      );
    case "Labor":
      return (
        <svg {...common} aria-hidden>
          <rect x="2.5" y="6" width="11" height="7" rx="1" />
          <path d="M6 6V4.5a1 1 0 011-1h2a1 1 0 011 1V6" />
          <line x1="2.5" y1="9.5" x2="13.5" y2="9.5" />
        </svg>
      );
    case "Education":
      return (
        <svg {...common} aria-hidden>
          <path d="M8 3L14 6L8 9L2 6L8 3Z" />
          <path d="M4.5 7.2V10.5C4.5 11.5 6 12.5 8 12.5C10 12.5 11.5 11.5 11.5 10.5V7.2" />
          <line x1="14" y1="6" x2="14" y2="10" />
        </svg>
      );
    case "Economy":
      return (
        <svg {...common} aria-hidden>
          <line x1="3" y1="13" x2="13" y2="13" />
          <rect x="3.5" y="9" width="2.2" height="4" />
          <rect x="6.9" y="6.5" width="2.2" height="6.5" />
          <rect x="10.3" y="3.5" width="2.2" height="9.5" />
        </svg>
      );
    case "Immigration":
      return (
        <svg {...common} aria-hidden>
          <circle cx="8" cy="8" r="5.5" />
          <ellipse cx="8" cy="8" rx="2.4" ry="5.5" />
          <line x1="2.5" y1="8" x2="13.5" y2="8" />
        </svg>
      );
    case "Criminal justice":
      return (
        <svg {...common} aria-hidden>
          <line x1="8" y1="2.5" x2="8" y2="12" />
          <line x1="8" y1="12" x2="5.5" y2="13.3" />
          <line x1="8" y1="12" x2="10.5" y2="13.3" />
          <line x1="3" y1="4.5" x2="13" y2="4.5" />
          <line x1="3" y1="4.5" x2="3" y2="8" />
          <line x1="13" y1="4.5" x2="13" y2="8" />
          <path d="M1 8a2 2 0 004 0" />
          <path d="M11 8a2 2 0 004 0" />
        </svg>
      );
    case "Guns":
      return (
        <svg {...common} aria-hidden>
          <path d="M8 2.5L13 4.3V8C13 11 10.8 13 8 13.5C5.2 13 3 11 3 8V4.3L8 2.5Z" />
        </svg>
      );
    case "Reproductive rights":
      return (
        <svg {...common} aria-hidden>
          <path d="M4.5 2.5H10L11.5 4V13.5H4.5V2.5Z" />
          <path d="M10 2.5V4H11.5" />
          <line x1="6" y1="6.5" x2="10" y2="6.5" />
          <line x1="6" y1="9" x2="10" y2="9" />
          <line x1="6" y1="11.5" x2="8.5" y2="11.5" />
        </svg>
      );
    case "Transit":
      return (
        <svg {...common} aria-hidden>
          <rect x="2.5" y="4" width="11" height="7" rx="1.5" />
          <line x1="2.5" y1="7.5" x2="13.5" y2="7.5" />
          <circle cx="5" cy="12.5" r="1.2" />
          <circle cx="11" cy="12.5" r="1.2" />
        </svg>
      );
    case "Water":
      return (
        <svg {...common} aria-hidden>
          <path d="M8 2.5C8 2.5 12.5 8 12.5 10.8C12.5 13 10.5 14.2 8 14.2C5.5 14.2 3.5 13 3.5 10.8C3.5 8 8 2.5 8 2.5Z" />
        </svg>
      );
    case "Veterans":
      return (
        <svg {...common} aria-hidden>
          <path d="M8 2L9.4 6.2H13.8L10.2 8.7L11.6 13L8 10.4L4.4 13L5.8 8.7L2.2 6.2H6.6L8 2Z" />
        </svg>
      );
    default:
      // Any future TOPIC_POOL addition without a matching case here falls
      // back to a plain dot instead of rendering nothing.
      return (
        <svg {...common} aria-hidden>
          <circle cx="8" cy="8" r="2.5" fill={color} stroke="none" />
        </svg>
      );
  }
}
