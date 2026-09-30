"use client";

import { useState } from "react";
import { C } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";

export type FaqItem = { q: string; a: string };

// Only one item open at a time -- clicking the open one closes it. All
// closed on load (openIndex starts null, not 0).
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", borderTop: `2px solid ${C.ink}` }}>
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q} style={{ borderBottom: `1px solid ${MK.rule}` }}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              className="hiw-faq-toggle"
              aria-expanded={open}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
                padding: "24px 0",
                border: 0,
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                color: C.ink,
              }}
            >
              <span style={{ fontSize: "clamp(17px, 1.5vw, 20px)", fontWeight: 700, letterSpacing: "-0.012em" }}>{item.q}</span>
              <span aria-hidden style={{ fontSize: 22, lineHeight: 1, fontWeight: 400, flex: "none" }}>
                {open ? "−" : "+"}
              </span>
            </button>
            {open ? (
              <p style={{ margin: 0, padding: "0 0 26px", fontSize: 16, lineHeight: 1.62, color: MK.body, maxWidth: "60ch" }}>
                {item.a}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
