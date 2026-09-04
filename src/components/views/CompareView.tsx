"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { C, PARTY, TAG_STYLE, cond, trustBand } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { DEFAULT_DISTRICT } from "@/lib/seed-data";
import { initials } from "@/lib/scoring";
import type { Politician, Race, StanceCell } from "@/lib/types";
import { Avatar, Display, Kicker, RustButton } from "@/components/ui";
import { HushScoreInfoIcon } from "@/components/HushScoreInfo";

export default function CompareView({
  politicians,
  races,
  stances,
}: {
  politicians: Politician[];
  races: Race[];
  stances: Record<string, Record<string, StanceCell>>;
}) {
  const router = useRouter();
  const { zip, setZip, picks, setPicks, topics } = usePrefs();
  const [zipDraft, setZipDraft] = useState(zip);

  const byId = useMemo(
    () => new Map(politicians.map((p) => [p.id, p])),
    [politicians],
  );

  const heads = picks.map((id) => {
    const p = byId.get(id) ?? politicians[0];
    return { ...p, band: trustBand(p.trust) };
  });

  const gridCols = `150px ${picks.map(() => "1fr").join(" ")}`;

  return (
    <div className="split" style={{ display: "flex", minHeight: "100%" }}>
      {/* Ballot lookup */}
      <div
        style={{
          width: 452,
          flex: "0 0 452px",
          borderRight: `1px solid ${C.line}`,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          background: C.sandDeep,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Kicker>Vote compare</Kicker>
          <Display size={25}>Pull up your ballot</Display>
          <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
            Enter a ZIP and we load every race you can vote in, scored against your ranked issues.
          </span>
        </div>

        <form
          style={{ display: "flex", gap: 8 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (zipDraft.length === 5) setZip(zipDraft);
          }}
        >
          <input
            value={zipDraft}
            onChange={(e) => setZipDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
            maxLength={5}
            inputMode="numeric"
            aria-label="ZIP code"
            style={{
              flex: 1,
              padding: "11px 14px",
              border: "1px solid rgba(21,21,21,0.2)",
              borderRadius: 8,
              background: C.white,
              fontFamily: cond,
              fontSize: 19,
              letterSpacing: "0.1em",
              outline: "none",
            }}
          />
          <RustButton type="submit">Look up</RustButton>
        </form>

        <span style={{ fontSize: 12, color: C.muted }}>
          {DEFAULT_DISTRICT.raceCount} races found{zip !== DEFAULT_DISTRICT.zip ? ` for ${zip}` : ""} ·
          matched to {Math.min(topics.length, 5)} ranked issues
        </span>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {races.map((race) => (
            <div
              key={race.id}
              className="card-hover"
              style={{
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                background: C.white,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 9,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
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
                <span
                  style={{ marginLeft: "auto", fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}
                >
                  {race.meta}
                </span>
              </div>

              {race.candidates.map((c) => {
                const known = byId.has(c.politicianId);
                return (
                  <button
                    key={c.politicianId}
                    type="button"
                    className="fade"
                    onClick={() => known && router.push(`/politician/${c.politicianId}`)}
                    disabled={!known}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      border: 0,
                      background: "transparent",
                      padding: "2px 0",
                      cursor: known ? "pointer" : "default",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: PARTY[c.party],
                        flex: "0 0 8px",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Stance grid */}
      <div
        style={{
          flex: 1,
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Kicker>Side by side</Kicker>
            <Display size={25}>Stance grid</Display>
          </div>
          {picks.length < 3 ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                const next = politicians.find((p) => !picks.includes(p.id));
                if (next) setPicks(picks.concat(next.id));
              }}
              style={{
                marginLeft: "auto",
                padding: "10px 15px",
                border: "1px dashed rgba(21,21,21,0.3)",
                borderRadius: 8,
                background: "transparent",
                fontSize: 13,
                color: C.muted,
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              + Add a third politician
            </button>
          ) : null}
        </div>

        <div style={{ overflowX: "auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridCols,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              background: C.white,
              overflow: "hidden",
              minWidth: 560,
            }}
          >
            <span style={{ background: C.sand, borderBottom: `1px solid ${C.line}` }} />
            {heads.map((h, i) => (
              <div
                key={`${h.id}-${i}`}
                style={{
                  background: C.sand,
                  borderBottom: `1px solid ${C.line}`,
                  borderLeft: "1px solid rgba(21,21,21,0.08)",
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar
                    text={initials(h.name)}
                    size={30}
                    radius={7}
                    bg={PARTY[h.party]}
                    fg={C.sand}
                    font={12}
                  />
                  <button
                    type="button"
                    onClick={() => setPicks(picks.filter((_, j) => j !== i))}
                    aria-label={`Remove ${h.name} from comparison`}
                    style={{
                      marginLeft: "auto",
                      border: 0,
                      background: "transparent",
                      color: C.muted,
                      fontSize: 14,
                      cursor: "pointer",
                      padding: 8,
                    }}
                  >
                    ✕
                  </button>
                </div>
                <select
                  value={h.id}
                  onChange={(e) => {
                    const next = picks.slice();
                    next[i] = e.target.value;
                    setPicks(next);
                  }}
                  aria-label={`Comparison slot ${i + 1}`}
                  style={{
                    border: "1px solid rgba(21,21,21,0.18)",
                    borderRadius: 6,
                    background: C.white,
                    padding: "5px 6px",
                    fontFamily: cond,
                    fontSize: 15,
                    color: C.ink,
                  }}
                >
                  {politicians.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: 11, color: C.muted }}>
                  {h.office} · {h.district}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: h.band.color }}>
                  HUSH. {h.trust}
                  <HushScoreInfoIcon politicianId={h.id} />
                </span>
              </div>
            ))}

            {Object.keys(stances).map((issue) => (
              <Row key={issue} issue={issue} picks={picks} stances={stances} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  issue,
  picks,
  stances,
}: {
  issue: string;
  picks: string[];
  stances: Record<string, Record<string, StanceCell>>;
}) {
  return (
    <>
      <span
        style={{
          padding: "11px 12px",
          borderBottom: `1px solid ${C.lineSoft}`,
          background: C.hover,
          fontFamily: cond,
          fontSize: 14,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {issue}
      </span>
      {picks.map((id, i) => {
        const fallback: StanceCell = ["No record", "Not tracked for this office"];
        const cell = stances[issue]?.[id] ?? fallback;
        const [tag, blurb, sourceUrl] = cell;
        const style = TAG_STYLE[tag];
        // "No record" has nothing sourced to link to; the other three tags
        // are link bubbles that will deep-link to the sourced passage once
        // sourceUrl is populated (see StanceCell) — until then they're
        // link-styled but inert rather than pointing somewhere fake.
        const isLinkable = tag !== "No record";
        const bubbleStyle = {
          alignSelf: "flex-start" as const,
          padding: "3px 8px",
          borderRadius: 12,
          fontSize: 11,
          whiteSpace: "nowrap" as const,
          background: style.bg,
          color: style.fg,
        };
        return (
          <div
            key={`${issue}-${id}-${i}`}
            style={{
              padding: "11px 12px",
              borderBottom: `1px solid ${C.lineSoft}`,
              borderLeft: "1px solid rgba(21,21,21,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 12, color: C.body, lineHeight: 1.45 }}>{blurb}</span>
            {isLinkable ? (
              sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="stance-tag-link"
                  style={{ ...bubbleStyle, textDecoration: "none", cursor: "pointer" }}
                >
                  Source
                </a>
              ) : (
                <span
                  className="stance-tag-link"
                  title="Source link coming soon"
                  style={{ ...bubbleStyle, cursor: "pointer" }}
                >
                  Source
                </span>
              )
            ) : (
              <span style={bubbleStyle}>{tag}</span>
            )}
          </div>
        );
      })}
    </>
  );
}
