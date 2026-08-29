"use client";

import Link from "next/link";
import { createContext, useContext, useState, type CSSProperties, type ReactNode } from "react";
import { C, cond } from "@/lib/theme";

type OpenFn = (politicianId?: string) => void;

const HushScoreInfoContext = createContext<OpenFn | null>(null);

/**
 * Mounts once in AppShell so every page shares a single instance of the
 * "What's the HUSH. Score?" explanation modal. Every <HushScoreInfoIcon>
 * anywhere on the page opens this same shared modal instead of each one
 * carrying its own — per spec, no duplicate bubbles within a component.
 */
export function HushScoreInfoProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [politicianId, setPoliticianId] = useState<string | undefined>(undefined);

  const openModal: OpenFn = (id) => {
    setPoliticianId(id);
    setOpen(true);
  };

  return (
    <HushScoreInfoContext.Provider value={openModal}>
      {children}
      {open ? (
        <HushScoreInfoModal politicianId={politicianId} onClose={() => setOpen(false)} />
      ) : null}
    </HushScoreInfoContext.Provider>
  );
}

/**
 * Small clickable (i) trigger placed next to a "HUSH. Score" reference.
 * Pass `politicianId` when one is in scope so "See how we calculate it"
 * can point at that politician's promise ledger; omitted elsewhere.
 *
 * Rendered as a span (not a button) so it's always safe to drop next to —
 * or inside — an existing clickable row/card without nesting one
 * interactive element inside another.
 */
export function HushScoreInfoIcon({
  politicianId,
  style,
}: {
  politicianId?: string;
  style?: CSSProperties;
}) {
  const openModal = useContext(HushScoreInfoContext);

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label="What's the HUSH. Score?"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openModal?.(politicianId);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        e.stopPropagation();
        openModal?.(politicianId);
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 14,
        height: 14,
        flex: "0 0 14px",
        borderRadius: "50%",
        border: "1px solid currentColor",
        opacity: 0.55,
        fontFamily: cond,
        fontSize: 10,
        lineHeight: 1,
        cursor: "pointer",
        userSelect: "none",
        ...style,
      }}
    >
      i
    </span>
  );
}

function HushScoreInfoModal({
  politicianId,
  onClose,
}: {
  politicianId?: string;
  onClose: () => void;
}) {
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
      }}
    >
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(21,21,21,0.45)" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="What's the HUSH. Score?"
        style={{
          position: "relative",
          zIndex: 61,
          width: "100%",
          maxWidth: 420,
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          background: C.white,
          padding: 26,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 20px 60px rgba(21,21,21,0.28)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <span
            style={{
              fontFamily: cond,
              fontSize: 13,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: C.rust,
            }}
          >
            What&rsquo;s the HUSH. Score?
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              border: 0,
              background: "transparent",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              color: C.muted,
              padding: 0,
              flex: "0 0 auto",
            }}
          >
            &times;
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: C.body }}>
          We track what they said.
          <br />
          Then we track what they did.
        </p>

        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: C.body }}>
          The HUSH. Score measures how closely a politician&rsquo;s actions and votes
          align with the positions and priorities they&rsquo;ve publicly stated.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 13, color: C.body }}>
            <span style={{ fontFamily: cond, fontSize: 15, color: C.navy }}>100</span>
            {" — Aligned with what they said."}
          </span>
          <span style={{ fontSize: 13, color: C.body }}>
            <span style={{ fontFamily: cond, fontSize: 15, color: C.olive }}>50</span>
            {" — No clear action to evaluate."}
          </span>
          <span style={{ fontSize: 13, color: C.body }}>
            <span style={{ fontFamily: cond, fontSize: 15, color: C.rust }}>0</span>
            {" — Contradicts what they said."}
          </span>
        </div>

        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.muted }}>
          New to office? No score yet. As a politician builds a record, their
          score builds with it.
          <br />
          More history. More evidence. More clarity.
        </p>

        <Link
          href={politicianId ? `/politician/${politicianId}/trust` : "/feed"}
          onClick={onClose}
          style={{ fontSize: 13, color: C.rust, fontWeight: 600, textDecoration: "none" }}
        >
          See how we calculate it →
        </Link>
      </div>
    </div>
  );
}
