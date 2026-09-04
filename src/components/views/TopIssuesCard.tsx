"use client";

import Link from "next/link";
import { useState, type DragEvent } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { rankWeights } from "@/lib/scoring";
import { Card, Display, EmptyState, GhostButton, Kicker, RustButton } from "@/components/ui";

const MAX_TOP_ISSUES = 10;

/**
 * "Your Top Issues" — a standalone ranked-list editor (drag to reorder,
 * remove, add up to the cap) used both as a Card on /profile and as the
 * full-page view at /profile/top-issues.
 *
 * Rank is communicated by list position and the rank number alone — no bar.
 * A per-row bar used to sit here (flat-colored, width from list position)
 * but was redundant with the rank number and was removed; don't reintroduce
 * one, least of all a threshold-colored bar, which would read as a score.
 */
export function TopIssuesCard({
  topicPool,
  showEditLink = true,
  id,
  draft,
}: {
  topicPool: string[];
  showEditLink?: boolean;
  id?: string;
  /**
   * Opt-in controlled mode: when set, every toggle/reorder edits
   * `draft.topics` through `draft.onChange` instead of writing straight to
   * the live `topics` in usePrefs(), and nothing reaches `prefs.topics`
   * until `draft.onSave` runs (plus an optional `draft.onDiscard` to back
   * out without saving). This is what the "My Top Issues" quiz's results
   * step uses to let its suggested order be edited locally before an
   * explicit Save commits it — same "review, then confirm" pattern as HUSH
   * Guide's issue picker requiring Continue rather than auto-saving each
   * toggle. Leave unset for the card's normal live-editing behavior (used
   * as-is on /profile and /profile/top-issues).
   */
  draft?: {
    topics: string[];
    onChange: (next: string[]) => void;
    onSave: () => void;
    onDiscard?: () => void;
    saveLabel?: string;
  };
}) {
  const live = usePrefs();
  const topics = draft ? draft.topics : live.topics;
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const ranked = rankWeights(topics);
  const atCap = topics.length >= MAX_TOP_ISSUES;
  const available = topicPool.filter((name) => !topics.includes(name));

  function toggle(name: string) {
    if (!draft) {
      live.toggleTopic(name);
      return;
    }
    const has = draft.topics.includes(name);
    if (!has && draft.topics.length >= MAX_TOP_ISSUES) return;
    draft.onChange(has ? draft.topics.filter((t) => t !== name) : draft.topics.concat(name));
  }

  function dropOnto(index: number) {
    if (dragIndex === null || dragIndex === index) return;
    if (draft) {
      const next = draft.topics.slice();
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      draft.onChange(next);
    } else {
      live.reorderTopic(dragIndex, index);
    }
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
              <button
                type="button"
                onClick={() => toggle(i.name)}
                aria-label={`Remove ${i.name} from your top issues`}
                style={{
                  marginLeft: "auto",
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
                    onClick={() => toggle(name)}
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

      {draft ? (
        <div style={{ display: "flex", gap: 10, paddingTop: 4, borderTop: `1px solid ${C.line}` }}>
          {draft.onDiscard ? (
            <GhostButton onClick={draft.onDiscard} style={{ padding: "10px 16px", fontSize: 13 }}>
              Discard
            </GhostButton>
          ) : null}
          <RustButton
            onClick={draft.onSave}
            style={{ flex: 1, padding: "11px 18px" }}
          >
            {draft.saveLabel ?? "Save my top issues"}
          </RustButton>
        </div>
      ) : null}
    </Card>
  );
}
