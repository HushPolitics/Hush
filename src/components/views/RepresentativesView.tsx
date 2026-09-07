"use client";

import Link from "next/link";
import { useMemo } from "react";
import { C, PARTY } from "@/lib/theme";
import { ballotPoliticianIds } from "@/lib/feed";
import { initials } from "@/lib/scoring";
import { Avatar, Display, Kicker } from "@/components/ui";
import type { Politician, Race } from "@/lib/types";

/**
 * A lightweight index of everyone on the reader's ballot -- linked from the
 * Feed's "Your Representatives" orientation card. Deliberately thin: name,
 * office, district, party. No HUSH. Score anywhere on this page, matching
 * that card's own doc comment -- this is a directory of who represents you,
 * not a ranking of them. Each row links out to the person's own page, which
 * is the one place their score is allowed to appear alongside everything
 * else about their record.
 */
export default function RepresentativesView({
  politicians,
  races,
}: {
  politicians: Politician[];
  races: Race[];
}) {
  const ballotIds = useMemo(() => ballotPoliticianIds(races), [races]);
  const shown = useMemo(() => politicians.filter((p) => ballotIds.has(p.id)), [politicians, ballotIds]);

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Kicker>Your Ballot</Kicker>
        <Display size={25}>Your Representatives</Display>
        <span style={{ fontSize: 13, color: C.body, maxWidth: 640, lineHeight: 1.5 }}>
          Everyone on your ballot, in one place. No scores here — see each person&apos;s full record,
          including their HUSH. Score, on their own page.
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {shown.map((p) => (
          <Link
            key={p.id}
            href={`/politician/${p.id}`}
            className="card-hover"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              background: C.white,
              padding: "13px 16px",
              color: C.ink,
            }}
          >
            <Avatar text={initials(p.name)} size={36} radius={9} font={14} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
              <span style={{ fontSize: 12, color: C.muted }}>
                {p.office} · {p.district}
              </span>
            </div>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: PARTY[p.party], flex: "0 0 8px" }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
