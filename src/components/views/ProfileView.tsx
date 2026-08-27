"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { C, cond, trustBand } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { computeMatch, initials, rankWeights } from "@/lib/scoring";
import type { Politician } from "@/lib/types";
import { Avatar, Bar, Card, Chip, Display, EmptyState, Kicker } from "@/components/ui";

const SORTS = ["Seniority", "A–Z", "Trust score"] as const;
type Sort = (typeof SORTS)[number];

/**
 * The "you" surface. Renders the same two panels in both routes; /saved just
 * scrolls the saved grid into focus. Topic order here drives value match
 * everywhere else in the app.
 */
export default function ProfileView({
  politicians,
  topicPool,
}: {
  politicians: Politician[];
  topicPool: string[];
}) {
  const { topics, toggleTopic, moveTopic, saved } = usePrefs();
  const [sort, setSort] = useState<Sort>("Seniority");

  const ranked = rankWeights(topics).slice(0, 6);

  const savedCards = useMemo(() => {
    const list = politicians.filter((p) => saved.includes(p.id));
    return list
      .slice()
      .sort((a, b) =>
        sort === "A–Z"
          ? a.name.localeCompare(b.name)
          : sort === "Trust score"
            ? b.trust - a.trust
            : a.since - b.since,
      )
      .map((p) => ({ ...p, match: computeMatch(p, topics) }));
  }, [politicians, saved, sort, topics]);

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="stack-row" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card
          style={{
            flex: 1,
            minWidth: 380,
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <Kicker>Topics</Kicker>
            <Display size={19}>What matters to you</Display>
            <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>
              tap to add or remove
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {topicPool.map((name) => (
              <Chip key={name} on={topics.includes(name)} onClick={() => toggleTopic(name)}>
                {name}
              </Chip>
            ))}
          </div>
        </Card>

        <Card
          style={{
            width: 400,
            flex: "0 0 400px",
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <Kicker>Ranked</Kicker>
            <Display size={19}>Your top issues</Display>
          </div>
          {ranked.length === 0 ? (
            <span style={{ fontSize: 13, color: C.muted }}>
              Pick a few topics and they show up here, weighted by rank.
            </span>
          ) : null}
          {ranked.map((i, idx) => (
            <div key={i.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: cond, fontSize: 14, color: C.tan, width: 14 }}>
                {i.rank}
              </span>
              <span
                style={{
                  fontSize: 13,
                  width: 120,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {i.name}
              </span>
              <Bar pct={Math.min(100, i.pct)} color={C.navy} />
              <button
                type="button"
                className="link-quiet"
                onClick={() => moveTopic(idx, -1)}
                aria-label={`Move ${i.name} up`}
                style={{ border: 0, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 13, padding: 8 }}
              >
                ↑
              </button>
              <button
                type="button"
                className="link-quiet"
                onClick={() => moveTopic(idx, 1)}
                aria-label={`Move ${i.name} down`}
                style={{ border: 0, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 13, padding: 8 }}
              >
                ↓
              </button>
            </div>
          ))}
        </Card>
      </div>

      <div id="saved" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Display size={21}>Saved politicians · {saved.length}</Display>
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>Sort</span>
        {SORTS.map((s) => (
          <Chip key={s} on={sort === s} onClick={() => setSort(s)}>
            {s}
          </Chip>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
          gap: 14,
        }}
      >
        {savedCards.map((s) => (
          <Link
            key={s.id}
            href={`/politician/${s.id}`}
            className="lift"
            style={{
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              background: C.white,
              padding: 16,
              display: "flex",
              gap: 13,
              color: C.ink,
            }}
          >
            <Avatar text={initials(s.name)} size={46} radius={9} font={15} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              <span style={{ fontFamily: cond, fontSize: 19, lineHeight: 1.1 }}>{s.name}</span>
              <span style={{ fontSize: 12, color: C.muted }}>
                {s.office} · since {s.since}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 2 }}>
                <span style={{ fontFamily: cond, fontSize: 15, color: trustBand(s.trust).color }}>
                  Trust {s.trust}
                </span>
                <span style={{ fontSize: 12, color: C.body }}>Match {s.match}%</span>
              </span>
            </div>
          </Link>
        ))}
        {savedCards.length === 0 ? (
          <EmptyState>Nothing saved yet — open a profile and hit “Save to my list”.</EmptyState>
        ) : null}
      </div>
    </div>
  );
}
