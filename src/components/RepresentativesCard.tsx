"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { C, PARTY, cond } from "@/lib/theme";
import { Card, Display, Kicker } from "@/components/ui";
import type { Politician } from "@/lib/types";

/**
 * "Your Representatives" -- a short directory card, not a ranking: name,
 * office, an initials avatar ringed in party color, nothing else. Used on
 * the Feed's orientation strip and HUSH Guide's right column (app-layout-v2
 * phases 1-2), identical both places, so it lives here rather than being
 * copied into each view.
 *
 * Deliberately carries no HUSH. Score -- the standing rule against showing
 * two scores on one screen means the only place a politician's score
 * belongs is their own page, one click away via the name link or the
 * chevron to the full /politicians index.
 *
 * `header` defaults to the small uppercase Kicker treatment this card has
 * always used (HUSH Guide's sidebar, where the surrounding cards are all
 * that same small/dense type). The Feed's orientation strip opts into
 * `"display"` instead -- a bigger, bolder condensed header to read as a
 * header alongside "Your Election"/"Your Top Issues" there, without
 * changing how this card looks anywhere else it's used.
 */
export default function RepresentativesCard({
  politicians,
  limit = 4,
  style,
  header = "kicker",
}: {
  politicians: Politician[];
  limit?: number;
  style?: CSSProperties;
  header?: "kicker" | "display";
}) {
  const shown = politicians.slice(0, limit);
  return (
    <Card style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8, ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {header === "display" ? (
          <Display size={16} color={C.rust}>
            Your Representatives
          </Display>
        ) : (
          <Kicker>Your Representatives</Kicker>
        )}
        <Link
          href="/politicians"
          aria-label="See the full politician directory"
          style={{ marginLeft: "auto", fontSize: 15, color: C.muted }}
        >
          →
        </Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {shown.map((p) => {
          const initials = p.name
            .split(" ")
            .filter(Boolean)
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          return (
            <Link
              key={p.id}
              href={`/politician/${p.id}`}
              style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: C.ink }}
            >
              <span
                aria-hidden
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  flex: "0 0 28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: cond,
                  fontSize: 11,
                  fontWeight: 600,
                  color: PARTY[p.party],
                  background: C.shell,
                  border: `1.5px solid ${PARTY[p.party]}`,
                }}
              >
                {initials}
              </span>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                  {p.name}
                </span>
                <span style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.office}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
