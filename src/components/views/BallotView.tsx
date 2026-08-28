"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { C, PARTY, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { useNow } from "@/lib/hooks";
import { ELECTION_ISO, KEY_DATES } from "@/lib/seed-data";
import type { Politician, Race } from "@/lib/types";
import { Display, InkButton, Kicker, RustButton } from "@/components/ui";

/**
 * Google Maps Embed API key. Optional — the map falls back to a
 * "open in Google Maps" link when it isn't set, rather than rendering a
 * broken/blank iframe. See .env.example for setup notes.
 */
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function formatCountdown(target: number, now: number) {
  const ms = Math.max(0, target - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${d} days · ${h} hrs · ${m} min · ${s} s`;
}

export default function BallotView({ races, politicians }: { races: Race[]; politicians: Politician[] }) {
  const { polling, setPolling, city, state, zip, streetAddress } = usePrefs();
  const [addr, setAddr] = useState("");
  // Some RaceCandidates (e.g. an opposing candidate with no research done
  // yet) don't have a full Politician profile — same gap CompareView guards
  // against. Those names render as inert text instead of a dead link.
  const knownIds = useMemo(() => new Set(politicians.map((p) => p.id)), [politicians]);
  // Only updated on submit, so the map doesn't reload on every keystroke —
  // it centers on the last address the user actually looked up.
  const [searchedAddr, setSearchedAddr] = useState("");
  const target = new Date(ELECTION_ISO).getTime();
  // 0 until hydration, then ticks every second.
  const now = useNow(1000);

  // Same address the rest of the page already has, in priority order: an
  // address just searched in the polling-place lookup below, then the home
  // address from onboarding, then the city/state/zip set via the header
  // pill. No separate "map address" field.
  const mapQuery = (
    searchedAddr.trim() ||
    streetAddress.trim() ||
    [city, state, zip].filter(Boolean).join(" ")
  ).trim();
  const mapSrc =
    MAPS_KEY && mapQuery
      ? `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=${encodeURIComponent(mapQuery)}`
      : null;
  const openInMapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery || "United States")}`;

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <section
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          padding: "20px 24px",
          borderRadius: 12,
          background: C.ink,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Kicker color={C.tan} style={{ letterSpacing: "0.16em" }}>
            Time until polls close
          </Kicker>
          <span
            style={{
              fontFamily: cond,
              fontSize: 38,
              lineHeight: 1,
              color: C.sand,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {now === 0 ? "—" : formatCountdown(target, now)}
          </span>
        </div>
        <span style={{ height: 44, width: 1, background: "rgba(243,239,228,0.2)" }} />
        {KEY_DATES.map((k) => (
          <div key={k.label} style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 12, color: C.tan }}>{k.label}</span>
            <span style={{ fontFamily: cond, fontSize: 19, color: C.sand }}>{k.value}</span>
          </div>
        ))}
        <RustButton
          style={{ marginLeft: "auto", padding: "12px 18px" }}
          onClick={() => window.open("https://www.vote.org/am-i-registered-to-vote/", "_blank", "noopener")}
        >
          Check my registration
        </RustButton>
      </section>

      <div className="stack-row" style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 420, display: "flex", flexDirection: "column", gap: 11 }}>
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

        <div style={{ width: 360, flex: "0 0 360px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              height: 220,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              overflow: "hidden",
              position: "relative",
              background: C.sand,
            }}
          >
            {mapSrc ? (
              <iframe
                title="Map centered on your address"
                src={mapSrc}
                width="100%"
                height="100%"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "16px 20px",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50% 50% 50% 4px",
                    transform: "rotate(-45deg)",
                    background: C.rust,
                    boxShadow: "0 3px 10px rgba(21,21,21,0.2)",
                  }}
                />
                <span
                  style={{
                    fontFamily: cond,
                    fontSize: 12,
                    letterSpacing: "0.04em",
                    color: C.muted,
                    lineHeight: 1.4,
                  }}
                >
                  Map needs a Google Maps API key —
                  <br />
                  set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                </span>
                <a
                  href={openInMapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: C.rust }}
                >
                  Open in Google Maps →
                </a>
              </div>
            )}
          </div>

          <div
            style={{
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              background: C.white,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <Kicker>Polling place</Kicker>
            <Display size={20}>{polling.name}</Display>
            <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{polling.detail}</span>
            <form
              style={{ display: "flex", gap: 8 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (!addr.trim()) return;
                setPolling({
                  name: "Precinct 214 · Community Hall",
                  detail: `${addr.trim()} · 0.4 mi · Open 7am–7pm on election day`,
                });
                setSearchedAddr(addr.trim());
              }}
            >
              <input
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                placeholder="Enter a different address"
                aria-label="Address for polling place lookup"
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "10px 12px",
                  border: "1px solid rgba(21,21,21,0.2)",
                  borderRadius: 8,
                  background: C.sandDeep,
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <InkButton style={{ padding: "10px 15px", borderRadius: 8 }}>Find</InkButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
