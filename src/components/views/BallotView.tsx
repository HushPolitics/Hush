"use client";

import Link from "next/link";
import { useMemo } from "react";
import { C, PARTY, cond } from "@/lib/theme";
import { Display } from "@/components/ui";
import type { Politician, Race } from "@/lib/types";

/**
 * Your Ballot's races list. The countdown banner and the map/polling-place
 * lookup that used to sit above and beside this list have moved to
 * `ElectionCountdownBanner` and `PollingPlaceCard` (now on HUSH Guide's
 * dashboard) -- this page is left with just the races, so the list now runs
 * the full page width instead of sharing it with a sidebar.
 */
export default function BallotView({ races, politicians }: { races: Race[]; politicians: Politician[] }) {
  // Some RaceCandidates (e.g. an opposing candidate with no research done
  // yet) don't have a full Politician profile — same gap CompareView guards
  // against. Those names render as inert text instead of a dead link.
  const knownIds = useMemo(() => new Set(politicians.map((p) => p.id)), [politicians]);

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <Display size={21}>{races.length} races on your ballot</Display>
        {races.map((race) => (
          <div
            key={race.id}
            className="card-hover"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              background: C.white,
              padding: "13px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: cond,
                  fontSize: 16,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {race.title}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>
                {race.meta}
              </span>
            </div>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              {race.candidates.map((c) => {
                const dot = (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: PARTY[c.party],
                      flex: "0 0 8px",
                    }}
                  />
                );
                return knownIds.has(c.politicianId) ? (
                  <Link
                    key={c.politicianId}
                    href={`/politician/${c.politicianId}`}
                    className="fade"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 13,
                      color: C.ink,
                      textDecoration: "none",
                    }}
                  >
                    {dot}
                    {c.name}
                  </Link>
                ) : (
                  <span
                    key={c.politicianId}
                    title="No profile yet"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 13,
                      color: C.muted,
                    }}
                  >
                    {dot}
                    {c.name}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
