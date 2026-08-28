"use client";

import Link from "next/link";
import { useState, type DragEvent } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { rankWeights } from "@/lib/scoring";
import { Bar, Card, Display, EmptyState, GhostButton, Kicker } from "@/components/ui";

const MAX_TOP_ISSUES = 10;

/**
 * "Your Top Issues" — a standalone ranked-list editor (drag to reorder,
 * remove, add up to the cap) used both as a Card on /profile and as the
 * full-page view at /profile/top-issues.
 *
 * The bars below only communicate relative rank within this list — width is
 * the only signal, and every bar uses the same color, deliberately, so it
 * never reads as a political-alignment or candidate-match score the way a
 * threshold-colored bar elsewhere in the app (e.g. Compare's match bars)
 * does.
 */
export function TopIssuesCard({
  topicPool,
  showEditLink = true,
  id,
}: {
  topicPool: string[];
  showEditLink?: boolean;
  id?: string;
}) {
  const { topics, toggleTopic, reorderTopic } = usePrefs();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const ranked = rankWeights(topics);
  const atCap = topics.length >= MAX_TOP_ISSUES;
  const available = topicPool.filter((name) => !topics.includes(name));

  function dropOnto(index: number) {
    if (dragIndex === null || dragIndex === index) return;
    reorderTopic(dragIndex, index);
    setDragIndex(null);
  }

  return (
    <Card id={id} style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Kicker>Ranked</Kicker>
        <Display size={25}>Your Top Issues</Display>
        <span style={{ fontSize: 13, color: C.body }}>What matters most to you.</span>
      </div>

      {ranked.length === 0 ? (
        <EmptyState>Add a few issues below and they&apos;ll show up here, ranked.</EmptyState>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {ranked.map((i, idx) => (
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
                gap: 10,
                padding: "7px 8px",
                borderRadius: 8,
                background: dragIndex === idx ? C.hover : "transparent",
                opacity: dragIndex !== null && dragIndex !== idx ? 0.6 : 1,
              }}
            >
              <span aria-hidden style={{ color: C.faint, fontSize: 13, letterSpacing: -1, cursor: "grab" }}>
                ⠿
              </span>
              <span style={{ fontFamily: cond, fontSize: 14, color: C.muted, width: 16 }}>{i.rank}</span>
              <span
                style={{
                  fontSize: 13,
                  color: C.ink,
                  width: 140,
                  flex: "0 0 140px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {i.name}
              </span>
              <Bar pct={Math.min(100, i.pct)} height={5} color={C.ink} />
              <button
                type="button"
                onClick={() => toggleTopic(i.name)}
                aria-label={`Remove ${i.name} from your top issues`}
                style={{
                  border: 0,
                  background: "transparent",
                  color: C.faint,
                  fontSize: 16,
                  lineHeight: 1,
                  padding: "2px 4px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <GhostButton
            onClick={() => setAdding((a) => !a)}
            style={{ padding: "8px 14px", fontSize: 12.5 }}
          >
            {adding ? "Done adding" : "+ Add an issue"}
          </GhostButton>
          <span style={{ fontSize: 12, color: C.muted }}>
            {topics.length}/{MAX_TOP_ISSUES} selected
          </span>
          {showEditLink ? (
            <Link
              href="/profile/top-issues"
              style={{ marginLeft: "auto", fontFamily: cond, fontSize: 13, color: C.navy, letterSpacing: "0.02em" }}
            >
              Edit Issues →
            </Link>
          ) : null}
        </div>

        {adding ? (
          available.length === 0 ? (
            <span style={{ fontSize: 12, color: C.muted }}>
              Every issue in Hush&apos;s pool is already on your list.
            </span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {atCap ? (
                <span style={{ fontSize: 12, color: C.rust }}>
                  You&apos;ve hit the {MAX_TOP_ISSUES}-issue cap — remove one above to add another.
                </span>
              ) : null}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {available.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="chip"
                    onClick={() => toggleTopic(name)}
                    disabled={atCap}
                    style={{
                      padding: "7px 13px",
                      borderRadius: 20,
                      fontSize: 12.5,
                      background: "transparent",
                      color: atCap ? C.faint : C.body,
                      border: `1px solid ${atCap ? C.line : "rgba(21,21,21,0.18)"}`,
                      cursor: atCap ? "not-allowed" : "pointer",
                    }}
                  >
                    + {name}
                  </button>
                ))}
              </div>
            </div>
          )
        ) : null}
      </div>
    </Card>
  );
}
