"use client";

import { useState } from "react";
import { C } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { Card, Display, InkButton, Kicker } from "@/components/ui";

/**
 * Google Maps Embed API key. Optional — the map falls back to an
 * "open in Google Maps" link when it isn't set, rather than rendering a
 * broken/blank iframe. See .env.example for setup notes.
 */
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Map + polling-place lookup. Self-contained: reads `polling`,
 * `streetAddress`, `city`, `state`, `zip` straight from `usePrefs()` and
 * owns its own address-lookup state, so it can be dropped into any page
 * with no props.
 *
 * Originally Your Ballot's narrow right-hand sidebar (map stacked over the
 * polling info in a fixed-width column). Laid out horizontally here instead
 * -- map on one side, polling info + lookup form on the other, in one
 * full-width card -- since a full-width slot (HUSH Guide's tile grid) has no
 * sidebar shape to fit into. `.stack-row` still collapses it to a single
 * stacked column at phone width, same as every other side-by-side panel in
 * the app.
 */
export default function PollingPlaceCard() {
  const { polling, setPolling, streetAddress, city, state, zip } = usePrefs();
  const [addr, setAddr] = useState("");
  // Only updated on submit, so the map doesn't reload on every keystroke —
  // it centers on the last address the user actually looked up.
  const [searchedAddr, setSearchedAddr] = useState("");

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
    <Card
      className="stack-row"
      style={{
        display: "flex",
        gap: 20,
        alignItems: "stretch",
        flexWrap: "wrap",
        padding: 18,
      }}
    >
      {/*
        With no Maps API key configured, this used to render a framed box
        with the literal env var name in it -- a raw developer error in the
        middle of the primary flow. Rather than show a broken map frame at
        all, the key-less state below drops the frame entirely and folds the
        address/hours/link it would have shown into the polling-info panel
        on the right. See .env.example for how to set the key and get the
        embedded map back.
      */}
      {mapSrc ? (
        <div
          style={{
            flex: "1 1 320px",
            minWidth: 260,
            minHeight: 200,
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            overflow: "hidden",
            position: "relative",
            background: C.sand,
          }}
        >
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
        </div>
      ) : null}

      <div style={{ flex: "1 1 260px", minWidth: 240, display: "flex", flexDirection: "column", gap: 10 }}>
        <Kicker>Polling place</Kicker>
        <Display size={20}>{polling.name}</Display>
        <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{polling.detail}</span>
        {!mapSrc ? (
          <a
            href={openInMapsHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: C.rust }}
          >
            Open in Google Maps →
          </a>
        ) : null}
        <form
          style={{ display: "flex", gap: 8, marginTop: "auto" }}
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
    </Card>
  );
}
