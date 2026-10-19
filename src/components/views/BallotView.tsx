"use client";

import Link from "next/link";
import { useMemo } from "react";
import { C, PARTY, cond } from "@/lib/theme";
import { Display } from "@/components/ui";
import { stripPartySuffix } from "@/lib/guide";
import { usePrefs } from "@/lib/prefs";
import AddressLookup from "@/components/AddressLookup";
import { filterRaces, scopeLabel, scopeReasonFor } from "@/lib/ballot-scope";
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

  const { districtIds, state } = usePrefs();

  // No address means no narrowing: every race stays visible. An empty ballot
  // must never be the result of us not knowing where someone lives.
  const scope = districtIds.length > 0 ? { districtIds, stateCode: state } : null;
  const shown = useMemo(() => filterRaces(races, scope), [races, scope]);
  const narrowed = scope !== null;

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <AddressLookup />
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <Display size={21}>
          {narrowed
            ? `${shown.length} ${shown.length === 1 ? "race" : "races"} on your ballot`
            : `${races.length} races statewide`}
        </Display>
        {narrowed ? (
          <span style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>
            Narrowed from {races.length} to the seats your address votes in.
          </span>
        ) : (
          <span style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>
            Every race we have loaded. Add your address above to see only yours.
          </span>
        )}
        {narrowed && shown.length === 0 ? (
          <span style={{ fontSize: 13, color: C.body, lineHeight: 1.6 }}>
            We resolved your address but matched none of the races loaded so far. That is a gap in
            our data, not a quiet ballot. Use &ldquo;show all races&rdquo; above to see everything.
          </span>
        ) : null}
        {shown.map((race) => (
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
              {/* Says why a race survived the filter when it was not a direct
                  district match, so an unexpected race is explained rather
                  than looking like a bug. */}
              {narrowed ? (() => {
                const label = scopeLabel(scopeReasonFor(race, scope));
                return label ? (
                  <span style={{ fontSize: 11, color: C.muted, fontStyle: "italic", width: "100%" }}>
                    {label}
                  </span>
                ) : null;
              })() : null}
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
                    {stripPartySuffix(c.name)}
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
                    {stripPartySuffix(c.name)}
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
