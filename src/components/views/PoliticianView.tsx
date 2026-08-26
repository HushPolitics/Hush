"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { C, PARTY_LABEL, cond, trustBand } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { promiseSplit } from "@/lib/scoring";
import type { FactCheck, Politician } from "@/lib/types";
import { Card, EmptyState, GhostButton, InkButton, Kicker } from "@/components/ui";
import { FactCheckCard } from "./FactCheckView";

const TABS = [
  { key: "policies", label: "Policies" },
  { key: "news", label: "News & fact-checks" },
  { key: "bio", label: "Bio & timeline" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function PoliticianView({
  politician: p,
  checks,
}: {
  politician: Politician;
  checks: FactCheck[];
}) {
  const router = useRouter();
  const { saved, toggleSaved, picks, setPicks } = usePrefs();
  const [tab, setTab] = useState<TabKey>("policies");

  const band = trustBand(p.trust);
  const split = promiseSplit(p);
  const isSaved = saved.includes(p.id);

  function compareWith() {
    setPicks([p.id, ...picks.filter((x) => x !== p.id)].slice(0, 3));
    router.push("/compare");
  }

  return (
    <div className="split" style={{ display: "flex", minHeight: "100%" }}>
      {/* Identity rail */}
      <div
        style={{
          width: 348,
          flex: "0 0 348px",
          borderRight: `1px solid ${C.line}`,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          background: C.sandDeep,
        }}
      >
        <div
          style={{
            height: 200,
            borderRadius: 10,
            background: C.tan,
            display: "flex",
            alignItems: "flex-end",
            padding: 14,
          }}
        >
          <span
            style={{
              fontFamily: cond,
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              background: C.sand,
              padding: "4px 8px",
              borderRadius: 4,
            }}
          >
            Official portrait
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: cond, fontSize: 28, lineHeight: 1.05 }}>{p.name}</span>
          <span style={{ fontSize: 13, color: C.body }}>
            {p.office}, {p.district} · {PARTY_LABEL[p.party]}
          </span>
          <span style={{ fontSize: 13, color: C.muted }}>
            In office since {p.since} · next election Nov 2026
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {p.tags.map((t) => (
            <span
              key={t}
              style={{
                padding: "5px 10px",
                borderRadius: 16,
                background: C.shell,
                fontSize: 12,
                color: C.body,
                whiteSpace: "nowrap",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.body, textWrap: "pretty" }}>
          {p.bio}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
          <InkButton type="button" onClick={() => toggleSaved(p.id)}>
            {isSaved ? "Remove from my list" : "Save to my list"}
          </InkButton>
          <GhostButton onClick={compareWith}>Compare with…</GhostButton>
        </div>
      </div>

      {/* Detail */}
      <div
        style={{
          flex: 1,
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Card
            style={{
              flex: "0 0 210px",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <Kicker>Trust score</Kicker>
            <span style={{ fontFamily: cond, fontSize: 56, lineHeight: 1, color: band.color }}>
              {p.trust}
            </span>
            <span style={{ fontSize: 12, color: C.muted }}>
              {band.label} · {split.total} promises tracked
            </span>
          </Card>

          <Card
            style={{
              flex: 1,
              minWidth: 300,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontFamily: cond, fontSize: 18 }}>Promise breakdown</span>
              <button
                type="button"
                className="link-quiet"
                onClick={() => router.push(`/politician/${p.id}/trust`)}
                style={{
                  marginLeft: "auto",
                  border: 0,
                  background: "transparent",
                  color: C.rust,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                See full promise ledger →
              </button>
            </div>

            <div
              style={{
                display: "flex",
                height: 12,
                borderRadius: 6,
                overflow: "hidden",
                background: C.shell,
              }}
            >
              <span style={{ width: `${split.keptPct}%`, background: C.navy }} />
              <span style={{ width: `${split.progPct}%`, background: C.tan }} />
              <span style={{ width: `${split.brokenPct}%`, background: C.rust }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[
                { label: "Delivered", value: p.kept, color: C.navy },
                { label: "In progress", value: p.prog, color: C.tan },
                { label: "No movement", value: p.broken, color: C.rust },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: C.muted,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                    {s.label}
                  </span>
                  <span style={{ fontFamily: cond, fontSize: 26 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", gap: 24, borderBottom: `1px solid ${C.line}` }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className="tab"
              onClick={() => setTab(t.key)}
              style={{
                border: 0,
                background: "transparent",
                padding: "0 2px 11px",
                fontFamily: cond,
                fontSize: 16,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                color: tab === t.key ? C.ink : C.muted,
                borderBottom: `2px solid ${tab === t.key ? C.rust : "transparent"}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "policies" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {p.policies.map((pol) => (
              <div
                key={pol.issue}
                className="card-hover"
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr 140px",
                  gap: 16,
                  alignItems: "center",
                  padding: "14px 16px",
                  border: `1px solid ${C.line}`,
                  borderRadius: 10,
                  background: C.white,
                }}
              >
                <span
                  style={{
                    fontFamily: cond,
                    fontSize: 15,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {pol.issue}
                </span>
                <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{pol.stance}</span>
                <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontSize: 11, color: C.muted }}>
                    Aligns with you {pol.align}%
                  </span>
                  <span
                    style={{
                      height: 5,
                      borderRadius: 3,
                      background: C.shell,
                      display: "block",
                      overflow: "hidden",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        height: 5,
                        borderRadius: 3,
                        width: `${pol.align}%`,
                        background:
                          pol.align >= 80 ? C.navy : pol.align >= 55 ? C.olive : C.rust,
                      }}
                    />
                  </span>
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "news" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {checks.map((c) => (
              <FactCheckCard key={c.id} check={c} showSources={false} />
            ))}
            {checks.length === 0 ? (
              <EmptyState>No fact-checks filed for this official yet.</EmptyState>
            ) : null}
          </div>
        ) : null}

        {tab === "bio" ? (
          <div style={{ display: "flex", flexDirection: "column", paddingLeft: 6 }}>
            {p.career.map((c, i) => (
              <div key={c.year} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    alignSelf: "stretch",
                    paddingTop: 4,
                  }}
                >
                  <span
                    style={{ width: 11, height: 11, borderRadius: "50%", background: C.navy, flex: "0 0 11px" }}
                  />
                  {i < p.career.length - 1 ? (
                    <span style={{ flex: 1, width: 2, background: C.shell }} />
                  ) : null}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingBottom: 20 }}>
                  <Kicker size={13} style={{ letterSpacing: "0.1em" }}>
                    {c.year}
                  </Kicker>
                  <span style={{ fontSize: 14 }}>{c.what}</span>
                  <span style={{ fontSize: 12, color: C.muted }}>{c.detail}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
