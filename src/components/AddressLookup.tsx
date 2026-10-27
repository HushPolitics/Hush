"use client";

import { useState, useTransition } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { resolveAddress } from "@/app/actions/location";

/**
 * Where you live -> which races you actually vote in.
 *
 * Asks for a street address rather than a ZIP, and that is the whole point.
 * ZIP codes are postal delivery routes; districts are drawn by legislatures
 * and counties. They cross each other constantly, so a ZIP lookup is right
 * often enough to look like it works and wrong often enough to hand somebody
 * a ballot that is not theirs. An address is either matched or it is not.
 *
 * The address is used to find districts and is not needed after that. It is
 * kept in this browser, and mirrored to the account only when one is signed
 * in, so that looking up your own ballot never requires making an account.
 */
export default function AddressLookup({
  compact = false,
  changeLabel = "Change or show all races",
}: {
  compact?: boolean;
  /** Text of the reset link; the Guide never shows "all races", so it passes its own. */
  changeLabel?: string;
}) {
  const { matchedAddress, districtIds, setResolvedLocation, clearResolvedLocation } = usePrefs();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const resolved = districtIds.length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const address = value.trim();
    if (!address) return;

    start(async () => {
      const res = await resolveAddress(address);
      if (res.ok) {
        setResolvedLocation({
          matchedAddress: res.matchedAddress,
          city: res.city ?? "",
          state: res.state ?? "",
          zip: res.zip ?? "",
          districtIds: res.districts.map((d) => d.id),
        });
        setValue("");
        return;
      }
      // Each failure means something different to the person reading it, so
      // they get different sentences rather than one generic "try again".
      setError(
        res.reason === "not_found"
          ? "We couldn't find that address. Check the street number and spelling, and include the city or ZIP."
          : res.reason === "no_districts"
            ? "We found that address, but we haven't loaded district boundaries for it yet. Right now that means Florida only."
            : "Address lookup isn't available right now.",
      );
    });
  }

  if (resolved) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          padding: compact ? "8px 12px" : "12px 16px",
          border: `1px solid ${C.line}`,
          borderRadius: 10,
          background: C.sand,
        }}
      >
        <span style={{ fontSize: 12, color: C.muted }}>Showing the ballot for</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{matchedAddress}</span>
        <button
          type="button"
          className="link-quiet"
          onClick={clearResolvedLocation}
          style={{ marginLeft: "auto", fontSize: 12, color: C.rust, background: "none", border: "none", cursor: "pointer" }}
        >
          {changeLabel}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: compact ? "10px 12px" : "14px 16px",
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        background: C.white,
      }}
    >
      <span style={{ fontFamily: cond, fontSize: 15 }}>See only what you can vote on</span>
      <span style={{ fontSize: 12.5, color: C.body, lineHeight: 1.5 }}>
        Enter your street address. We use it to find your districts and nothing else. A ZIP code
        isn&apos;t enough, because ZIP codes and voting districts don&apos;t share boundaries.
      </span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="855 Central Ave, St Petersburg, FL"
          aria-label="Your street address"
          style={{
            flex: "1 1 240px",
            minWidth: 0,
            padding: "10px 12px",
            border: `1px solid ${C.line}`,
            borderRadius: 8,
            background: C.sandDeep,
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={pending || !value.trim()}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: C.ink,
            color: C.white,
            fontSize: 13,
            cursor: pending || !value.trim() ? "default" : "pointer",
            opacity: pending || !value.trim() ? 0.55 : 1,
          }}
        >
          {pending ? "Looking up…" : "Find my ballot"}
        </button>
      </div>
      {error ? (
        <span role="alert" style={{ fontSize: 12.5, color: C.rust, lineHeight: 1.5 }}>
          {error}
        </span>
      ) : null}
    </form>
  );
}
