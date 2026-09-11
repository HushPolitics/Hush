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
 * Short, neutral, informational one-liners for the editorial "Your Top
 * Issues" layout (feature cards + compact grid cards) at /profile/top-issues.
 * Deliberately non-persuasive -- what the issue covers, not a position on it.
 * Not used by Issue Finder's results screen, which has its own grounded
 * per-user "why" line via `resultsDetail`.
 */
const ISSUE_DESCRIPTIONS: Record<string, string> = {
  Healthcare: "Coverage, prescription costs, insurance protections, and access to care.",
  Housing: "Home prices, rent, affordability, supply, and property costs.",
  "Voting rights": "Ballot access, election administration, voter ID, and registration rules.",
  Climate: "Energy policy, emissions, extreme weather response, and environmental regulation.",
  Labor: "Wages, workplace rights, unions, and job protections.",
  Education: "School funding, curriculum, teacher policy, and student outcomes.",
  Economy: "Jobs, inflation, wages, taxes, and the cost of living.",
  Immigration: "Border policy, legal immigration, enforcement, and pathways to citizenship.",
  "Criminal justice": "Policing, sentencing, incarceration, courts, and criminal justice reform.",
  Guns: "Gun ownership, background checks, firearm restrictions, and public safety.",
  "Reproductive rights": "Abortion access, contraception, fertility care, and reproductive healthcare.",
  Transit: "Public transportation, roads, traffic, and transportation investment.",
  Water: "Water quality, infrastructure, supply, and flood management.",
  Veterans: "Veterans' healthcare, benefits, housing, employment, and military support.",
};

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
 *
 * Two visual modes, chosen automatically and never mixed:
 *  - `resultsDetail` set (Issue Finder's results step): every row renders
 *    the rich results treatment below (96×96 image, importance Pill, "why"
 *    line, Explore link) exactly as before this change — untouched.
 *  - `resultsDetail` unset (the plain /profile/top-issues page, the only
 *    other caller): the "editorial" layout — the top two ranked issues as
 *    large feature cards, the rest as a compact two-column grid, plus a
 *    3-zone bottom action row (add issue / progress / Issue Finder callout).
 */
export function TopIssuesCard({
  topicPool,
  showEditLink = true,
  id,
  draft,
  resultsDetail,
  issueFinderHref,
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
  /**
   * Link to Issue Finder for the bottom-row callout in the editorial layout
   * (see below). Only rendered when set; leave unset to omit the callout
   * (e.g. from within Issue Finder's own results screen, which wouldn't
   * link back to itself).
   */
  issueFinderHref?: string;
}) {
  const live = usePrefs();
  const topics = draft ? draft.topics : live.topics;
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const ranked = rankWeights(topics);
  const atCap = topics.length >= MAX_TOP_ISSUES;
  const available = topicPool.filter((name) => !topics.includes(name));

  // Editorial (feature cards + grid) layout applies only where there's no
  // per-issue results context -- i.e. only at /profile/top-issues.
  const editorial = !resultsDetail;
  const featured = editorial ? ranked.slice(0, 2) : [];
  const rest = editorial ? ranked.slice(2) : [];

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
        <span style={{ fontSize: 13, color: C.body }}>
          {editorial
            ? "What matters most to you. Drag to reorder, remove, or add new issues."
            : "What matters most to you."}
        </span>
      </div>

      {ranked.length === 0 ? (
        <EmptyState>Add a few issues below and they&apos;ll show up here, ranked.</EmptyState>
      ) : editorial ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {featured.length > 0 ? (
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {featured.map((i, idx) => (
                <IssueFeatureCard
                  key={i.name}
                  name={i.name}
                  rank={i.rank}
                  tier={idx === 0 ? "rust" : "slate"}
                  dimmed={dragIndex !== null && dragIndex !== idx}
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => dropOnto(idx)}
                  onDragEnd={() => setDragIndex(null)}
                  onRemove={() => toggle(i.name)}
                />
              ))}
            </div>
          ) : null}

          {rest.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              {rest.map((i, restIdx) => {
                const idx = restIdx + 2;
                return (
                  <IssueGridCard
                    key={i.name}
                    name={i.name}
                    rank={i.rank}
                    active={dragIndex === idx}
                    dimmed={dragIndex !== null && dragIndex !== idx}
                    onDragStart={() => setDragIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => dropOnto(idx)}
                    onDragEnd={() => setDragIndex(null)}
                    onRemove={() => toggle(i.name)}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
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
        {editorial ? (
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <GhostButton
              onClick={() => setAdding((a) => !a)}
              style={{ padding: "8px 14px", fontSize: 12.5 }}
            >
              {adding ? "Done adding" : "+ Add an issue"}
            </GhostButton>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 160px", minWidth: 140 }}>
              <span style={{ fontSize: 12, color: C.muted }}>
                {topics.length}/{MAX_TOP_ISSUES} selected
              </span>
              <div style={{ height: 4, borderRadius: 2, background: C.line, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(topics.length / MAX_TOP_ISSUES) * 100}%`,
                    background: C.rust,
                  }}
                />
              </div>
            </div>

            {issueFinderHref ? (
              <Link
                href={issueFinderHref}
                style={{
                  flex: "1 1 260px",
                  minWidth: 240,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: C.slateFill,
                  border: `1px solid ${C.slate}`,
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>Want help choosing your issues?</span>
                <span style={{ fontSize: 11.5, color: C.body, lineHeight: 1.35 }}>
                  Answer a few questions and we&apos;ll help identify your priorities.
                </span>
                <span style={{ fontSize: 12, color: C.rust, fontWeight: 600 }}>Try Issue Finder →</span>
              </Link>
            ) : null}

            {showEditLink ? (
              <Link
                href="/profile/top-issues"
                style={{ fontFamily: cond, fontSize: 13, color: C.navy, letterSpacing: "0.02em" }}
              >
                Edit Issues →
              </Link>
            ) : null}
          </div>
        ) : (
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
        )}

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

/** Large feature-card treatment for rank #1 and #2 in the editorial layout. */
function IssueFeatureCard({
  name,
  rank,
  tier,
  dimmed,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
}: {
  name: string;
  rank: number;
  tier: "rust" | "slate";
  dimmed: boolean;
  onDragStart: () => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onRemove: () => void;
}) {
  const accent = tier === "rust" ? C.rust : C.slate;
  const fill = tier === "rust" ? C.rustFill : C.slateFill;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      title="Drag to reorder"
      style={{
        flex: "1 1 280px",
        minWidth: 260,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        borderRadius: 14,
        border: `1px solid ${accent}`,
        background: fill,
        opacity: dimmed ? 0.6 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <span aria-hidden style={{ color: C.faint, fontSize: 13, cursor: "grab" }}>
          ⠿
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name} from your top issues`}
          style={{ border: 0, background: "transparent", color: C.faint, fontSize: 16, lineHeight: 1, padding: "2px 4px", cursor: "pointer" }}
        >
          ×
        </button>
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <span style={{ width: 120, height: 120, borderRadius: 18, overflow: "hidden", background: C.shell, flex: "0 0 120px" }}>
          <img
            src={`/images/issues/${issueImageSlug(name)}.jpg`}
            alt=""
            aria-hidden
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <span style={{ fontFamily: cond, fontSize: 40, lineHeight: 1, color: accent }}>
            {String(rank).padStart(2, "0")}
          </span>
          <span style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{name}</span>
          <span style={{ fontSize: 12.5, color: C.body, lineHeight: 1.45 }}>
            {ISSUE_DESCRIPTIONS[name] ?? ""}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Compact horizontal-card treatment for ranks #3-#10 in the editorial layout. */
function IssueGridCard({
  name,
  rank,
  active,
  dimmed,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
}: {
  name: string;
  rank: number;
  active: boolean;
  dimmed: boolean;
  onDragStart: () => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      title="Drag to reorder"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 10,
        border: `1px solid ${C.line}`,
        background: active ? C.hover : C.white,
        opacity: dimmed ? 0.6 : 1,
      }}
    >
      <span style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", background: C.shell, flex: "0 0 56px" }}>
        <img
          src={`/images/issues/${issueImageSlug(name)}.jpg`}
          alt=""
          aria-hidden
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </span>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: C.slateFill,
          color: C.slate,
          fontFamily: cond,
          fontSize: 11,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 22px",
        }}
      >
        {rank}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>{name}</span>
        <span style={{ fontSize: 11.5, color: C.body, lineHeight: 1.35 }}>
          {ISSUE_DESCRIPTIONS[name] ?? ""}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto", color: C.faint }}>
        <span aria-hidden style={{ fontSize: 13, cursor: "grab" }}>
          ⠿
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name} from your top issues`}
          style={{ border: 0, background: "transparent", color: C.faint, fontSize: 16, lineHeight: 1, padding: "2px 4px", cursor: "pointer" }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
