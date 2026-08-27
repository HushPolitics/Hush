"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type DragEvent } from "react";
import { C, cond, trustBand } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { computeMatch, initials, lastNameOf, rankWeights } from "@/lib/scoring";
import type { Politician } from "@/lib/types";
import { Avatar, Bar, Card, Chip, Display, EmptyState, Kicker, RustButton } from "@/components/ui";

const SORTS = ["Seniority", "A–Z", "Trust score"] as const;
type Sort = (typeof SORTS)[number];

// Placeholder display name for the signed-in user — matches the title
// AppShell is given on /profile (src/app/profile/page.tsx). There's no
// account system yet, so this is hardcoded in both places.
const USER_NAME = "Jordan Reyes";

const heroSecondaryBtn = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 7,
  border: "1px solid rgba(243,239,228,0.32)",
  background: "transparent",
  color: C.sand,
  fontFamily: cond,
  fontSize: 14,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  cursor: "pointer",
};

/**
 * The "you" surface, rendered at /profile. (/saved redirects here — see
 * next.config.ts.) Topic order here drives value match everywhere else in
 * the app.
 */
export default function ProfileView({
  politicians,
  topicPool,
}: {
  politicians: Politician[];
  topicPool: string[];
}) {
  const router = useRouter();
  const { topics, toggleTopic, moveTopic, reorderTopic, saved, party, city, state, invited } =
    usePrefs();
  const [sort, setSort] = useState<Sort>("Seniority");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const ranked = rankWeights(topics).slice(0, 6);
  // Hero panel shows the top 5 of the same ranked list the lower "Your top
  // issues" Card shows the top 6 of — same source, same order, just fewer
  // slots up top where space is tighter.
  const heroRanked = ranked.slice(0, 5);

  function dropOnto(index: number) {
    if (dragIndex === null || dragIndex === index) return;
    reorderTopic(dragIndex, index);
    setDragIndex(null);
  }

  const savedCards = useMemo(() => {
    const list = politicians.filter((p) => saved.includes(p.id));
    return list
      .slice()
      .sort((a, b) =>
        sort === "A–Z"
          ? lastNameOf(a.name).localeCompare(lastNameOf(b.name))
          : sort === "Trust score"
            ? b.trust - a.trust
            : a.since - b.since,
      )
      .map((p) => ({ ...p, match: computeMatch(p, topics) }));
  }, [politicians, saved, sort, topics]);

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Your Hush profile — same hero treatment as FeedView's top-match card,
          adapted for the signed-in user instead of a politician. */}
      <section
        className="split"
        style={{ display: "flex", background: C.ink, borderRadius: 12, overflow: "hidden" }}
      >
        <div
          style={{
            flex: 1,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Kicker color={C.tan} style={{ letterSpacing: "0.16em" }}>
              Your Hush profile
            </Kicker>
            <span style={{ height: 1, flex: 1, background: "rgba(243,239,228,0.2)" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Avatar text={initials(USER_NAME)} size={66} bg={C.tan} fg={C.ink} radius={12} font={23} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontFamily: cond, fontSize: 32, color: C.sand, lineHeight: 1.05 }}>
                {USER_NAME}
              </span>
              <span style={{ fontSize: 13, color: C.tan }}>
                {party} · {city}, {state} · {invited} invited
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <RustButton
              onClick={() => router.push("/voters-guide")}
              style={{ padding: "10px 16px", borderRadius: 7, fontSize: 13 }}
            >
              My Voter Guide
            </RustButton>
            <button
              type="button"
              onClick={() => router.push("/profile/settings")}
              style={{ ...heroSecondaryBtn, width: "auto", padding: "10px 16px", fontSize: 13 }}
            >
              Profile Settings
            </button>
            <button
              type="button"
              onClick={() => router.push("/profile/top-issues")}
              style={{ ...heroSecondaryBtn, width: "auto", padding: "10px 16px", fontSize: 13 }}
            >
              My Top Issues
            </button>
          </div>
        </div>

        <div
          style={{
            width: 310,
            flex: "0 0 310px",
            borderLeft: "1px solid rgba(243,239,228,0.18)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            background: C.inkSoft,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <Kicker color={C.tan} style={{ letterSpacing: "0.16em" }}>
              Ranked
            </Kicker>
            <Display size={17} color={C.sand}>
              Your top issues
            </Display>
          </div>

          {heroRanked.length === 0 ? (
            <span style={{ fontSize: 12, color: C.tan, lineHeight: 1.5 }}>
              Pick a few topics below and your top issues will show up here.
            </span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {heroRanked.map((i, idx) => (
                <div
                  key={i.name}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e: DragEvent) => e.preventDefault()}
                  onDrop={() => dropOnto(idx)}
                  onDragEnd={() => setDragIndex(null)}
                  title="Drag to reorder"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 6px",
                    borderRadius: 7,
                    background: dragIndex === idx ? "rgba(243,239,228,0.14)" : "transparent",
                    opacity: dragIndex !== null && dragIndex !== idx ? 0.6 : 1,
                    cursor: "grab",
                  }}
                >
                  <span aria-hidden style={{ color: C.tan, fontSize: 12, letterSpacing: -1 }}>
                    ⠿
                  </span>
                  <span style={{ fontFamily: cond, fontSize: 13, color: C.tan, width: 14 }}>
                    {i.rank}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: C.sand,
                      width: 100,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {i.name}
                  </span>
                  <Bar
                    pct={Math.min(100, i.pct)}
                    height={4}
                    track="rgba(243,239,228,0.16)"
                    color={i.pct >= 85 ? C.sand : i.pct >= 60 ? C.tan : C.rust}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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
