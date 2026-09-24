"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { C, VERDICT_STYLE, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { useMounted } from "@/lib/hooks";
import { ELECTION_ISO, KEY_DATES } from "@/lib/seed-data";
import { FEED_SCOPES, useFeedScope } from "@/lib/feedScope";
import {
  ballotPoliticianIds,
  buildFeedEvents,
  eventInScope,
  eventPolitician,
  isWorthKnowing,
  type FeedEvent,
} from "@/lib/feed";
import type {
  ArticleRecord,
  Bill,
  ElectionUpdate,
  FactCheck,
  IssuePosition,
  Politician,
  Race,
  StanceCheckPosition,
  VoteRecord,
} from "@/lib/types";
import { Card, Chip, Display, EmptyState, IssueIcon, Kicker, Pill } from "@/components/ui";
import RepresentativesCard from "@/components/RepresentativesCard";
import { isRedactVerdict, VERDICT_DEFINITION } from "./FactCheckView";

type TypeFilter = "all" | FeedEvent["type"];

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All Updates" },
  { value: "vote", label: "Votes" },
  { value: "bill", label: "Bills & Legislation" },
  { value: "factcheck", label: "Fact Check" },
  { value: "article", label: "Articles" },
];

/** Recent Updates' page-size choices -- 10 by default, with room to see more at once. */
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function typeLabel(t: FeedEvent["type"]): string {
  switch (t) {
    case "score":
      return "HUSH. Score";
    case "promise":
      return "Promise Ledger";
    case "factcheck":
      return "Fact Check";
    case "position":
      return "Position";
    case "vote":
      return "Vote";
    case "bill":
      return "Bills & Legislation";
    case "electionUpdate":
      return "Election Update";
    case "article":
      return "Article";
  }
}

function eventHeadline(e: FeedEvent): string {
  switch (e.type) {
    case "score":
      return `HUSH. Score moved ${e.from} → ${e.to}`;
    case "promise":
      return e.text;
    case "factcheck":
      return e.check.claim;
    case "position":
      return e.issue;
    case "vote":
      return `Voted ${e.vote.vote} on ${e.vote.billNumber}`;
    case "bill":
      return e.bill.title;
    case "electionUpdate":
      return e.update.headline;
    case "article":
      return e.article.headline;
  }
}

function eventText(e: FeedEvent): string {
  switch (e.type) {
    case "score":
      return e.reason;
    case "promise":
      return e.text;
    case "factcheck":
      return `${e.check.claim} ${e.check.finding} ${e.check.topic}`;
    case "position":
      return `${e.issue} ${e.excerpt}`;
    case "vote":
      return `${e.vote.billNumber} ${e.vote.billTitle} ${e.vote.note}`;
    case "bill":
      return `${e.bill.number} ${e.bill.title} ${e.bill.description ?? ""}`;
    case "electionUpdate":
      return `${e.update.headline} ${e.update.detail}`;
    case "article":
      return `${e.article.headline} ${e.article.dek}`;
  }
}

/**
 * Flat single-stroke ink line glyphs, one per Feed event type -- no per-
 * category color, per the standing rule. Deliberately plain geometric
 * shapes rather than a pulled-in icon library: nothing else in this
 * codebase renders an icon, so there was no existing set to match. (Was
 * navy before brand-tokens-v2 Phase 2 retired blue from general UI.)
 */
function TypeIcon({
  type,
  size = 15,
  color = C.ink,
}: {
  type: TypeFilter;
  size?: number;
  color?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: color,
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (type) {
    case "all":
      return (
        <svg {...common} aria-hidden>
          <line x1="3" y1="4.5" x2="13" y2="4.5" />
          <line x1="3" y1="8" x2="13" y2="8" />
          <line x1="3" y1="11.5" x2="13" y2="11.5" />
        </svg>
      );
    case "vote":
      return (
        <svg {...common} aria-hidden>
          <rect x="2.75" y="2.75" width="10.5" height="10.5" rx="1.5" />
          <path d="M5.5 8.2L7.1 9.8L10.5 6" />
        </svg>
      );
    case "bill":
      return (
        <svg {...common} aria-hidden>
          <rect x="4" y="2" width="8" height="12" rx="1" />
          <line x1="6" y1="5.5" x2="10" y2="5.5" />
          <line x1="6" y1="8" x2="10" y2="8" />
          <line x1="6" y1="10.5" x2="9" y2="10.5" />
        </svg>
      );
    case "factcheck":
      return (
        <svg {...common} aria-hidden>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M5.5 8.2L7.1 9.8L10.5 6" />
        </svg>
      );
    case "electionUpdate":
      return (
        <svg {...common} aria-hidden>
          <rect x="2.25" y="3.25" width="11.5" height="10.5" rx="1" />
          <line x1="2.25" y1="6.25" x2="13.75" y2="6.25" />
          <line x1="5.25" y1="1.5" x2="5.25" y2="3.75" />
          <line x1="10.75" y1="1.5" x2="10.75" y2="3.75" />
        </svg>
      );
    case "article":
      return (
        <svg {...common} aria-hidden>
          <rect x="2.25" y="3.5" width="11.5" height="9" rx="1" />
          <line x1="4.5" y1="6" x2="7.5" y2="6" />
          <line x1="4.5" y1="8" x2="7.5" y2="8" />
          <line x1="4.5" y1="10" x2="6.5" y2="10" />
          <line x1="9.5" y1="6" x2="11.5" y2="6" />
          <line x1="9.5" y1="8" x2="11.5" y2="8" />
          <line x1="9.5" y1="10" x2="11.5" y2="10" />
        </svg>
      );
    case "position":
      return (
        <svg {...common} aria-hidden>
          <path d="M3 3.5h10a1 1 0 011 1V9a1 1 0 01-1 1H7.5L5 12.5V10H3a1 1 0 01-1-1V4.5a1 1 0 011-1z" />
        </svg>
      );
    case "score":
      return (
        <svg {...common} aria-hidden>
          <path d="M3 11.5L7 7L9.5 9.5L13 5" />
          <path d="M9.5 5H13V8.5" />
        </svg>
      );
    case "promise":
      return (
        <svg {...common} aria-hidden>
          <path d="M4 2.5h6l2 2V13.5H4z" />
          <line x1="6" y1="6" x2="10" y2="6" />
          <line x1="6" y1="8.5" x2="10" y2="8.5" />
        </svg>
      );
  }
}

/**
 * The Feed, rebuilt around three pieces sitting on top of the same
 * reverse-chronological event list app-layout-v2 phase 1 assembled:
 *
 *   1. An orientation strip (Your Election / Your Top Issues / Your
 *      Representatives) so a reader lands somewhere useful before scrolling
 *      into the list itself.
 *   2. Worth Knowing -- up to 3 personally-relevant highlights (saved
 *      politicians or ranked issues, see `isWorthKnowing`) pulled from the
 *      front of the list, with a per-reader unread dot (`readEventIds` in
 *      prefs.tsx) -- then the full list below it, filterable by a
 *      horizontal type bar (replacing the old sidebar rail, which forced a
 *      two-column layout this content didn't need) and sortable
 *      newest/oldest.
 *   3. Explore HUSH -- static navigation into HUSH Guide, Compare, Stance
 *      Check, and Follow the Money (the new campaign-finance hub; see
 *      FollowTheMoneyView.tsx) below the list.
 *
 * The list itself is paginated (PAGE_SIZE_OPTIONS: 10 by default, up to
 * 100) rather than rendering every scoped/filtered event at once -- Prev/
 * Next plus a page-size picker sit under the list, and the page resets to 1
 * whenever scope, type filter, sort, page size, or the search query changes
 * so a reader is never silently stranded on a now-empty page.
 *
 * The scope chips (My Ballot / My Issues / Following) are unchanged from
 * phase 0 -- `useFeedScope` still drives them, just relabeled to title case.
 *
 * Election Update and Position events are excluded from the Feed outright
 * (filtered out of `allEvents` below) -- no filter chip, no row, not
 * eligible for Worth Knowing. `guide`/`stance`/`electionUpdates` are still
 * threaded through to `buildFeedEvents` since it needs them to build the
 * rest of the list; only the two event types are dropped.
 */
export default function FeedView({
  politicians,
  factChecks,
  races,
  guide,
  stance,
  votes,
  bills,
  electionUpdates,
  articles,
}: {
  politicians: Politician[];
  factChecks: FactCheck[];
  races: Race[];
  guide: Record<string, Record<string, IssuePosition>>;
  stance: Record<string, Record<string, StanceCheckPosition>>;
  votes: Record<string, VoteRecord[]>;
  bills: Bill[];
  electionUpdates: ElectionUpdate[];
  articles: ArticleRecord[];
}) {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const { saved, topics, markEventRead, isEventRead } = usePrefs();
  const [scope, setScope] = useFeedScope();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<"recent" | "oldest">("recent");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const mounted = useMounted();

  const ballotIds = useMemo(() => ballotPoliticianIds(races), [races]);
  const ballotPoliticians = useMemo(
    () => politicians.filter((p) => ballotIds.has(p.id)),
    [politicians, ballotIds],
  );

  // Election Update and Position events are excluded from the Feed entirely
  // -- not just unfiltered by default -- per request: no filter chip, no row
  // in Recent Updates, and (since WorthKnowingSection reads off of
  // scopedEvents, which derives from this) not eligible for Worth Knowing
  // either. Filtered here rather than in buildFeedEvents() itself since that
  // helper is Feed-page-only today, but keeping the exclusion at this single
  // call site (rather than, say, inside isWorthKnowing) is what guarantees
  // every downstream list agrees.
  const allEvents = useMemo(
    () =>
      buildFeedEvents(politicians, factChecks, guide, stance, votes, bills, electionUpdates, articles).filter(
        (e) => e.type !== "electionUpdate" && e.type !== "position",
      ),
    [politicians, factChecks, guide, stance, votes, bills, electionUpdates, articles],
  );

  const scopedEvents = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return allEvents.filter((e) => {
      if (!eventInScope(e, scope, ballotIds, saved, topics)) return false;
      if (!needle) return true;
      const politician = eventPolitician(e);
      const haystack = [politician?.name, politician?.office, ...(politician?.tags ?? []), eventText(e)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [allEvents, scope, ballotIds, saved, topics, q]);

  const events = useMemo(
    () => (typeFilter === "all" ? scopedEvents : scopedEvents.filter((e) => e.type === typeFilter)),
    [scopedEvents, typeFilter],
  );

  const sortedEvents = useMemo(
    () => (sort === "oldest" ? events.slice().reverse() : events),
    [events, sort],
  );

  // Jump back to page 1 whenever the underlying list could have changed
  // shape -- staying on, say, page 3 after switching scope or type would
  // usually just show an empty page.
  useEffect(() => {
    setPage(1);
  }, [scope, typeFilter, sort, pageSize, q]);

  const pageCount = Math.max(1, Math.ceil(sortedEvents.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedEvents = useMemo(
    () => sortedEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sortedEvents, currentPage, pageSize],
  );

  const followingEmpty = scope === "following" && saved.length === 0;
  const issuesEmpty = scope === "issues" && topics.length === 0;
  const days = mounted
    ? Math.max(0, Math.floor((new Date(ELECTION_ISO).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <FeedHero />

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Kicker>Feed</Kicker>
        <Display size={25}>What&apos;s happened</Display>
        <span style={{ fontSize: 13, color: C.body, maxWidth: 640, lineHeight: 1.5 }}>
          Votes, bills, and fact checks as they happen — filter by type, or narrow to My Ballot, My
          Issues, or Following below.
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        <ElectionCard days={days} raceCount={races.length} />
        <TopIssuesCard topics={topics} />
        <RepresentativesCard politicians={ballotPoliticians} header="display" />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {FEED_SCOPES.map((s) => (
          <Chip key={s.value} on={scope === s.value} onClick={() => setScope(s.value)}>
            {s.label}
          </Chip>
        ))}
      </div>

      <WorthKnowingSection
        events={scopedEvents}
        saved={saved}
        topics={topics}
        isEventRead={isEventRead}
        markEventRead={markEventRead}
      />

      <div id="recent-updates" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Display size={20}>Recent Updates</Display>
          <TypeFilterBar value={typeFilter} onChange={setTypeFilter} />
          <label
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              color: C.muted,
            }}
          >
            Sort by
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "recent" | "oldest")}
              style={{
                border: `1px solid ${C.lineHard}`,
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 12.5,
                color: C.ink,
                background: C.sand,
              }}
            >
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: C.muted }}>
            Show
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{
                border: `1px solid ${C.lineHard}`,
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 12.5,
                color: C.ink,
                background: C.sand,
              }}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} per page
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {pagedEvents.map((e) => (
            <FeedListRow key={e.id} event={e} unread={!isEventRead(e.id)} onOpen={() => markEventRead(e.id)} />
          ))}
          {events.length === 0 ? (
            <EmptyState>
              {followingEmpty ? (
                "Nothing followed yet — open a profile and hit “Save to my list”."
              ) : issuesEmpty ? (
                <>
                  You haven&apos;t ranked any issues yet —{" "}
                  <Link href="/profile/top-issues/start?next=/feed" style={{ color: C.rust }}>
                    pick your top issues
                  </Link>{" "}
                  to personalize your feed.
                </>
              ) : q.trim() ? (
                `Nothing matches "${q.trim()}".`
              ) : typeFilter !== "all" ? (
                "Nothing in this category yet."
              ) : (
                "Nothing to show yet."
              )}
            </EmptyState>
          ) : null}
        </div>

        {events.length > 0 && pageCount > 1 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              style={{
                border: `1px solid ${C.lineHard}`,
                borderRadius: 6,
                padding: "5px 12px",
                fontSize: 12.5,
                background: "transparent",
                color: currentPage <= 1 ? C.muted : C.ink,
                cursor: currentPage <= 1 ? "default" : "pointer",
              }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 12.5, color: C.muted }}>
              Page {currentPage} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage >= pageCount}
              style={{
                border: `1px solid ${C.lineHard}`,
                borderRadius: 6,
                padding: "5px 12px",
                fontSize: 12.5,
                background: "transparent",
                color: currentPage >= pageCount ? C.muted : C.ink,
                cursor: currentPage >= pageCount ? "default" : "pointer",
              }}
            >
              Next →
            </button>
          </div>
        ) : null}
      </div>

      <ExploreHushSection />
    </div>
  );
}

/**
 * Feed's hero banner -- just the image now. The "Feed" kicker and "The
 * record, not the spin." tagline that used to sit overlaid on it (with a
 * scrim behind them for legibility) moved down into the page's own
 * Kicker/Display title row below the image instead, so no scrim is needed
 * here anymore either.
 */
function FeedHero() {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        background: C.ink,
        minHeight: 260,
      }}
    >
      <img
        src="/images/feed-hero.jpg"
        alt=""
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

/**
 * Your Election. Still short of the full ticking countdown on Your Ballot /
 * HUSH Guide's ElectionCountdownBanner -- this shows both KEY_DATES entries
 * that actually require the reader to act before Election Day (Register by,
 * Early voting), not the full three-item spread that banner has room for.
 */
function ElectionCard({ days, raceCount }: { days: number | null; raceCount: number }) {
  const registerBy = KEY_DATES.find((k) => k.label === "Register by") ?? KEY_DATES[0];
  const earlyVoting = KEY_DATES.find((k) => k.label === "Early voting");
  return (
    <Card style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
      <Display size={16} color={C.rust}>Your Election</Display>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: cond, fontSize: 34, lineHeight: 1, color: C.ink }}>
          {days === null ? "—" : days}
        </span>
        <span style={{ fontSize: 14, color: C.body }}>days until Election Day</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: cond, fontSize: 20, color: C.ink }}>{raceCount}</span>
        <span style={{ fontSize: 13, color: C.body }}>races on your ballot</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {registerBy ? (
          <span style={{ fontSize: 13, color: C.body }}>
            <span style={{ color: C.muted }}>{registerBy.label}:</span>{" "}
            <span style={{ color: C.ink }}>{registerBy.value}</span>
          </span>
        ) : null}
        {earlyVoting ? (
          <span style={{ fontSize: 13, color: C.body }}>
            <span style={{ color: C.muted }}>{earlyVoting.label}:</span>{" "}
            <span style={{ color: C.ink }}>{earlyVoting.value}</span>
          </span>
        ) : null}
      </div>
      <Link href="/your-ballot" style={{ fontSize: 13, color: C.rust, alignSelf: "flex-start" }}>
        View your ballot →
      </Link>
    </Card>
  );
}

function TopIssuesCard({ topics }: { topics: string[] }) {
  const shown = topics.slice(0, 3);
  return (
    <Card style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
      <Display size={16} color={C.rust}>Your Top Issues</Display>
      {topics.length === 0 ? (
        <span style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>
          Nothing ranked yet —{" "}
          <Link href="/profile/top-issues/start?next=/feed" style={{ color: C.rust }}>
            pick your top issues
          </Link>{" "}
          to personalize your feed.
        </span>
      ) : (
        // flex: 1 + a centered column here is what vertically centers the
        // icon row in whatever height this card is stretched to (it matches
        // ElectionCard's height as a CSS Grid row sibling). The row itself
        // is a grid with one equal-width column per issue -- not a flex row
        // -- so each icon sits at its column's center regardless of how
        // long that issue's label is; a flex row's gap alone would let a
        // long label like "Reproductive rights" push its neighbors further
        // apart than a short one like "Guns" does.
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${shown.length}, 1fr)`,
              alignItems: "start",
              justifyItems: "center",
            }}
          >
            {shown.map((t) => (
              <div key={t} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    width: 44,
                    height: 44,
                    flex: "0 0 44px",
                    borderRadius: 11,
                    background: C.shell,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IssueIcon topic={t} size={23} />
                </span>
                <span style={{ fontSize: 11, color: C.ink, textAlign: "center", lineHeight: 1.25, whiteSpace: "nowrap" }}>
                  {t}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <Link href="/profile/top-issues" style={{ fontSize: 12, color: C.rust, alignSelf: "flex-start" }}>
        Manage issues →
      </Link>
    </Card>
  );
}

function TypeFilterBar({
  value,
  onChange,
}: {
  value: TypeFilter;
  onChange: (v: TypeFilter) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {TYPE_FILTERS.map((f) => (
        <Chip key={f.value} on={value === f.value} onClick={() => onChange(f.value)}>
          {f.label}
        </Chip>
      ))}
    </div>
  );
}

// Tall enough for the header row + a 2-line clamped headline + the context
// line + the date, at this section's font sizes -- see the height comment
// on the Card below for why this is fixed rather than content-driven.
const WORTH_KNOWING_CARD_HEIGHT = 148;

/**
 * Personally-relevant highlights -- up to 3 events matching `isWorthKnowing`
 * (a saved politician or a ranked issue), pulled from the front of `events`
 * (already reverse-chronological), so this stays "the 3 most recent
 * eligible" as new events show up with no extra refresh logic. A solid rust
 * dot plus a thin rust card border mark an event unread; both clear on the
 * next render once `markEventRead` fires from a click. Every card is a
 * fixed size (WORTH_KNOWING_CARD_HEIGHT, plus the grid's equal-width
 * columns) rather than sized to its own content, so a short headline and a
 * long one still produce identically-sized boxes.
 */
function WorthKnowingSection({
  events,
  saved,
  topics,
  isEventRead,
  markEventRead,
}: {
  events: FeedEvent[];
  saved: string[];
  topics: string[];
  isEventRead: (id: string) => boolean;
  markEventRead: (id: string) => void;
}) {
  const eligible = useMemo(
    () => events.filter((e) => isWorthKnowing(e, saved, topics)),
    [events, saved, topics],
  );
  if (eligible.length === 0) return null;

  const unreadCount = eligible.filter((e) => !isEventRead(e.id)).length;
  const shown = eligible.slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Kicker>Worth Knowing</Kicker>
        {unreadCount > 0 ? (
          <Pill bg={C.rustFill} fg={C.rust}>
            {unreadCount} new update{unreadCount === 1 ? "" : "s"}
          </Pill>
        ) : null}
        <a href="#recent-updates" style={{ marginLeft: "auto", fontSize: 12.5, color: C.rust }}>
          View all →
        </a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        {shown.map((e) => {
          const unread = !isEventRead(e.id);
          const href = eventHref(e);
          const politician = eventPolitician(e);
          const body = (
            <Card
              style={{
                // Fixed height (rather than letting content decide) is what
                // keeps all 3 boxes the same size regardless of headline
                // length -- WORTH_KNOWING_CARD_HEIGHT below, plus the
                // headline's own 2-line clamp, are the two halves of that.
                height: WORTH_KNOWING_CARD_HEIGHT,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                border: unread ? `1px solid ${C.rust}` : undefined,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TypeIcon type={e.type} size={13} color={C.ink} />
                <Pill
                  bg={C.shell}
                  fg={C.ink}
                  style={{
                    fontWeight: 600,
                    fontSize: 10.5,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "2px 8px",
                  }}
                >
                  {typeLabel(e.type)}
                </Pill>
                {unread ? (
                  <span aria-hidden style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: C.rust }} />
                ) : null}
              </div>
              <span
                style={{
                  fontFamily: cond,
                  fontSize: 14,
                  color: C.ink,
                  lineHeight: 1.3,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {eventHeadline(e)}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: C.body,
                  lineHeight: 1.4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {politician ? politician.name : eventText(e)}
              </span>
              {/* marginTop: auto pins the date to the same spot at the
                  bottom of the fixed-height card whether the headline above
                  it clamped to one line or two. */}
              <span style={{ fontSize: 11, color: C.muted, marginTop: "auto" }}>{e.date}</span>
            </Card>
          );
          if (!href) {
            return (
              <a
                key={e.id}
                href={eventExternalUrl(e) ?? "#"}
                target="_blank"
                rel="noreferrer"
                onClick={() => markEventRead(e.id)}
                style={{ textDecoration: "none", color: "inherit", minWidth: 0 }}
              >
                {body}
              </a>
            );
          }
          return (
            <Link
              key={e.id}
              href={href}
              onClick={() => markEventRead(e.id)}
              style={{ textDecoration: "none", color: "inherit", minWidth: 0 }}
            >
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** Where a Feed event's row links to -- each type's own page section. Bills have no per-candidate page, so they go to HUSH Guide's; electionUpdate has no internal page at all (see eventExternalUrl). */
function eventHref(e: FeedEvent): string | null {
  switch (e.type) {
    case "score":
      return `/politician/${e.politician.id}#score`;
    case "promise":
      return `/politician/${e.politician.id}#ledger`;
    case "factcheck":
      return `/politician/${e.politician.id}#claims-checked`;
    case "position":
      return `/politician/${e.politician.id}#positions`;
    case "vote":
    case "article":
      return `/politician/${e.politician.id}`;
    case "bill":
      return "/hush-guide#bills";
    case "electionUpdate":
      return null;
  }
}

/** electionUpdate is the one type with no internal page -- it links straight to its own source instead. */
function eventExternalUrl(e: FeedEvent): string | null {
  return e.type === "electionUpdate" ? e.update.sourceUrl : null;
}

/**
 * One compact row per event -- dot, icon, type pill, headline, one line of
 * context, date, chevron -- replacing the old per-type bordered cards
 * (quote, byline, and inline source link now live one click away, on the
 * politician's own page or HUSH Guide, rather than in the Feed itself).
 *
 * A factcheck row is the one exception to "one line of context": it carries
 * its own verdict pill next to the FACT CHECK type pill, and for Needs
 * Context/Unsupported verdicts applies the same "Redact & Highlight"
 * treatment FactCheckCard uses (see isRedactVerdict) -- struck-through claim
 * as the headline, the finding highlighted as the context line -- so the
 * verdict and its correction read right here in the list, not only after
 * clicking through to the politician's page.
 */
function FeedListRow({
  event,
  unread,
  onOpen,
}: {
  event: FeedEvent;
  unread: boolean;
  onOpen: () => void;
}) {
  const politician = eventPolitician(event);
  const href = eventHref(event);
  const external = eventExternalUrl(event);

  const row = (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 4px",
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          marginTop: 6,
          flex: "0 0 7px",
          background: unread ? C.rust : "transparent",
          border: unread ? "none" : `1.5px solid ${C.line}`,
        }}
      />
      <span style={{ marginTop: 2, flex: "0 0 auto" }}>
        <TypeIcon type={event.type} size={15} color={C.ink} />
      </span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Pill
            bg={C.shell}
            fg={C.ink}
            style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 8px" }}
          >
            {typeLabel(event.type)}
          </Pill>
          {event.type === "factcheck" ? (
            <Pill
              bg={VERDICT_STYLE[event.check.verdict].bg}
              fg={VERDICT_STYLE[event.check.verdict].fg}
              title={VERDICT_DEFINITION[event.check.verdict]}
              style={{
                fontWeight: 600,
                fontSize: 10.5,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "2px 8px",
                border: `1px solid ${C.line}`,
              }}
            >
              {event.check.verdict}
            </Pill>
          ) : null}
          <span
            style={{
              fontFamily: cond,
              fontSize: 15,
              lineHeight: 1.3,
              color: C.ink,
              ...(event.type === "factcheck" && isRedactVerdict(event.check.verdict)
                ? { textDecoration: "line-through", textDecorationThickness: 2, textDecorationColor: C.ink, color: C.muted }
                : {}),
            }}
          >
            {eventHeadline(event)}
          </span>
        </div>
        {event.type === "factcheck" && isRedactVerdict(event.check.verdict) ? (
          <span
            style={{
              display: "inline-block",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              background: C.rust,
              color: C.ink,
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: 2,
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {event.check.finding}
          </span>
        ) : (
          <span
            style={{
              fontSize: 12.5,
              color: C.body,
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {event.type === "factcheck" ? event.check.finding : eventText(event)}
          </span>
        )}
        {politician ? <span style={{ fontSize: 11.5, color: C.muted }}>{politician.name}</span> : null}
      </div>
      <span style={{ fontSize: 12, color: C.muted, flex: "0 0 auto", whiteSpace: "nowrap" }}>{event.date}</span>
      <span aria-hidden style={{ color: C.muted, flex: "0 0 auto" }}>
        ›
      </span>
    </div>
  );

  if (external) {
    return (
      <a href={external} target="_blank" rel="noreferrer" onClick={onOpen} style={{ textDecoration: "none", color: "inherit" }}>
        {row}
      </a>
    );
  }
  if (!href) return row;
  return (
    <Link href={href} onClick={onOpen} style={{ textDecoration: "none", color: "inherit" }}>
      {row}
    </Link>
  );
}

const EXPLORE_TILES = [
  {
    href: "/hush-guide",
    icon: "guide" as const,
    kicker: "Research your ballot",
    title: "HUSH. Guide",
    body: "See every race and ballot measure with clear, sourced candidate positions on the issues you care about.",
    cta: "Go to HUSH. Guide →",
  },
  {
    href: "/stance-check",
    icon: "stance" as const,
    kicker: "Explore a politician",
    title: "Stance Check",
    body: "See what a politician has said about the issues, with direct quotes and sources.",
    cta: "Search a politician →",
  },
  {
    href: "/compare",
    icon: "compare" as const,
    kicker: "Compare candidates",
    title: "Politicians",
    body: "See candidates side by side on the issues that matter to you.",
    cta: "Start a comparison →",
  },
  {
    href: "/follow-the-money",
    icon: "money" as const,
    kicker: "Campaign finance",
    title: "Follow the Money",
    body: "See who funds the politicians on your ballot — FEC-filed totals and committee contributions, sourced and dated.",
    cta: "Explore campaign finance →",
  },
];

function ExploreIcon({ kind }: { kind: "guide" | "compare" | "stance" | "money" }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: C.ink,
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "guide":
      return (
        <svg {...common} aria-hidden>
          <path d="M2 3.2c1.6-.9 3.4-.9 5 0v9.6c-1.6-.9-3.4-.9-5 0z" />
          <path d="M13 3.2c-1.6-.9-3.4-.9-5 0v9.6c1.6-.9 3.4-.9 5 0z" />
        </svg>
      );
    case "compare":
      return (
        <svg {...common} aria-hidden>
          <path d="M2.5 5.5h9M9 3l2.5 2.5L9 8" />
          <path d="M13.5 10.5h-9M7 8l-2.5 2.5L7 13" />
        </svg>
      );
    case "stance":
      return (
        <svg {...common} aria-hidden>
          <rect x="2.25" y="2.25" width="9" height="11.5" rx="1" />
          <line x1="4.25" y1="5.25" x2="9.25" y2="5.25" />
          <line x1="4.25" y1="7.75" x2="9.25" y2="7.75" />
          <circle cx="11.75" cy="11" r="2.25" />
        </svg>
      );
    case "money":
      return (
        <svg {...common} aria-hidden>
          <rect x="1.5" y="4" width="13" height="8.5" rx="1.25" />
          <circle cx="8" cy="8.25" r="2" />
          <line x1="3.5" y1="6" x2="3.5" y2="6" />
          <line x1="12.5" y1="10.5" x2="12.5" y2="10.5" />
        </svg>
      );
  }
}

/**
 * Static navigation into HUSH's other surfaces -- three of four go to real,
 * working pages today; Follow the Money is new (see FollowTheMoneyView.tsx).
 * Icons follow TypeIcon's own convention (flat single-stroke ink line
 * glyphs, 16x16 viewBox, no per-category color) rather than a second icon
 * style for this one section.
 */
function ExploreHushSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Kicker>Explore HUSH</Kicker>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
        {EXPLORE_TILES.map((t) => (
          <Card key={t.href} style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
            <ExploreIcon kind={t.icon} />
            {/* Fixed 2-line height (lineHeight * minHeight, both in em on
                this span) rather than letting the kicker's own length decide
                -- a short kicker like "Campaign finance" would otherwise stay
                on one line while a longer one like "Research your ballot"
                wraps to two, pushing that card's title down and leaving the
                row of titles across all 4 tiles misaligned. */}
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: C.muted,
                lineHeight: 1.4,
                minHeight: "2.8em",
                display: "block",
              }}
            >
              {t.kicker}
            </span>
            {/* Same fixed-height idea as the kicker above, this time on the
                title -- "Follow the Money" is long enough to wrap to a
                second line at this column width while the other three stay
                on one, which was enough on its own to knock the paragraph
                below out of alignment even with the kicker and paragraph
                heights already pinned. Reserving 2 lines here regardless of
                actual wrap is what makes every paragraph start at the same
                height, not just end at the same height. */}
            <Display size={18} style={{ lineHeight: 1.15, minHeight: "2.3em", display: "block" }}>
              {t.title}
            </Display>
            {/* Same fixed-height treatment as the kicker above -- 3 lines'
                worth, sized for the longest body copy (Follow the Money's) --
                rather than `flex: 1`, which sized each paragraph's own box to
                match card height but left the actual text sitting at
                different heights depending on how many lines it wrapped to. */}
            <span
              style={{
                fontSize: 12.5,
                color: C.body,
                lineHeight: 1.5,
                minHeight: "4.5em",
                display: "block",
              }}
            >
              {t.body}
            </span>
            {/* marginTop: auto pins the CTA to the bottom of the card --
                Card is a flex column, and every card in the row is already
                stretched to the same height by the grid above it, so this
                is what makes the link flush with the bottom edge of every
                box rather than trailing right behind whatever the fixed-
                height kicker/title/paragraph reservations above added up to
                for that one tile. */}
            <Link href={t.href} style={{ fontSize: 12.5, color: C.rust, marginTop: "auto" }}>
              {t.cta}
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
