"use client";

import Link from "next/link";
import { C, PARTY } from "@/lib/theme";
import { Card, Kicker } from "@/components/ui";
import type { Politician } from "@/lib/types";

/**
 * "Your Representatives" -- a short directory card, not a ranking: name,
 * office, party dot, nothing else. Used on the Feed's orientation strip and
 * HUSH Guide's right column (app-layout-v2 phases 1-2), identical both
 * places, so it lives here rather than being copied into each view.
 *
 * Deliberately carries no HUSH. Score -- the standing rule against showing
 * two scores on one screen means the only place a politician's score
 * belongs is their own page, one click away via the name link or the
 * chevron to the full /politicians index.
 */
export default function RepresentativesCard({
  politicians,
  limit = 4,
}: {
  politicians: Politician[];
  limit?: number;
}) {
  const shown = politicians.slice(0, limit);
  return (
    <Card style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Kicker>Your Representatives</Kicker>
        <Link
          href="/politicians"
          aria-label="See the full politician directory"
          style={{ marginLeft: "auto", fontSize: 15, color: C.muted }}
        >
          →
        </Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {shown.map((p) => (
          <Link
            key={p.id}
            href={`/politician/${p.id}`}
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.ink }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 2, background: PARTY[p.party], flex: "0 0 7px" }} />
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.name}
            </span>
            <span style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>{p.office}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
