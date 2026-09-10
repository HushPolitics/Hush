"use client";

import Link from "next/link";
import { useState, type DragEvent } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { rankWeights } from "@/lib/scoring";
import { Card, Display, EmptyState, GhostButton, Kicker, Pill, RustButton } from "@/components/ui";
import type { IssueFinderAnswer } from "@/lib/types";

const MAX_TOP_ISSUES = 10;

/** Filename (under /public/images/issues/) for an issue's results-row photo -- just the issue name, lowercased and hyphenated. */
function issueImageSlug(issue: string): string {
  return issue.toLowerCase().replace(/\s+/g, "-");
}

/**
 * "Your Top Issues" — a standalone ranked-list editor (drag to reorder,
 * remove, add up to the cap). Reached from the avatar menu's "My issues"
 * item as the full-page view at /profile/top-issues, and used in `draft`
 * mode by Issue Finder's results step (see below).
 *
 * Also the same component HUSH Guide's own onboarding gate routes a
 * visitor with no ranked issues to (via Issue Finder) — see GuideView's
 * AddressStep onContinue — so "same drag-to-rank component, same data" for
 * that gate is this file, not a separate picker.
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
  resultsDetail,
}: {
  topicPool: string[];
  showEditLink?: boolean;
  id?: string;
  /**
   * Opt-in controlled mode: when set, every toggle/reorder edits
   * `draft.topics` through `draft.onChange` instead of writing straight to
   * the live `topics` in usePrefs(), and nothing reaches `prefs.topics`
   * until `draft.onSave` runs (plus an optional `draft.onDiscard` to back
   * out without saving). This is what Issue Finder's results
   * step uses to let its suggested order be edited locally before an
   * explicit Save commits it — same "review, then confirm" pattern as HUSH
   * Guide's issue picker requiring Continue rather than auto-saving each
   * toggle. Leave unset for the card's normal live-editing behavior (used
   * as-is at /profile/top-issues).
   */
  draft?: {
    topics: string[];
    onChange: (next: string[]) => void;
    onSave: () => void;
    onDiscard?: () => void;
    saveLabel?: string;
  };
  /**
   * Optional per-issue context for Issue Finder's results screen -- a real
   * importance label, a grounded "why" line, and where "Explore this
   * issue" goes. When set, each row renders the richer results treatment
   * instead of the plain compact row. Leave unset everywhere else; drag
   * reorder, remove, and add all keep working identically either way --
   * this only changes what a row looks like, never what it does.
   */
  resultsDetail?: Record<string, { importance: IssueFinderAnswer; why: string; href: string }>;
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
          {ranked.map((i, idx) => {
            const rd = resultsDetail?.[i.name];
            const dragProps = {
              draggable: true,
              onDragStart: () => setDragIndex(idx),
              onDragOver: (e: DragEvent) => e.preventDefault(),
              onDrop: () => dropOnto(idx),
              onDragEnd: () => setDragIndex(null),
            };

            if (rd) {
              return (
                <div
                  key={i.name}
                  {...dragProps}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "12px 10px",
                    borderRadius: 10,
                    border: `1px solid ${C.line}`,
                    background: dragIndex === idx ? C.hover : C.white,
                    opacity: dragIndex !== null && dragIndex !== idx ? 0.6 : 1,
                  }}
                >
                  <span
                    aria-hidden
                    style={{ color: C.faint, fontSize: 13, cursor: "grab", alignSelf: "flex-start", marginTop: 4 }}
                  >
                    ⠿
                  </span>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: C.sand,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: cond,
                      fontSize: 12,
                      color: C.body,
                      flex: "0 0 26px",
                    }}
                  >
                    {i.rank}
                  </span>
                  <span
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 24,
                      overflow: "hidden",
                      background: C.shell,
                      flex: "0 0 96px",
                    }}
                  >
                    <img
                      src={`/images/issues/${issueImageSlug(i.name)}.jpg`}
                      alt=""
                      aria-hidden
                      draggable={false}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: C.ink }}>{i.name}</span>
                      <Pill bg={C.shell} fg={C.body} style={{ fontSize: 11 }}>
                        {rd.importance}
                      </Pill>
                    </div>
                    <span style={{ fontSize: 12, color: C.body, lineHeight: 1.4 }}>{rd.why}</span>
                    <Link href={rd.href} style={{ fontSize: 12, color: C.rust, alignSelf: "flex-start" }}>
                      Explore this issue →
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(i.name)}
                    aria-label={`Remove ${i.name} from your top issues`}
                    style={{
                      border: 0,
                      background: "transparent",
                      color: C.faint,
                      fontSize: 16,
                      lineHeight: 1,
                      padding: "2px 4px",
                      cursor: "pointer",
                      alignSelf: "flex-start",
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            }

            return (
              <div
                key={i.name}
                {...dragProps}
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
            );
          })}
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
