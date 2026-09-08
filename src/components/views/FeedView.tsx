"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { C, STATUS_STYLE, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { useMounted } from "@/lib/hooks";
import { ELECTION_ISO } from "@/lib/seed-data";
import { FEED_SCOPES, useFeedScope } from "@/lib/feedScope";
import { initials } from "@/lib/scoring";
import {
  ballotPoliticianIds,
  buildFeedEvents,
  eventInScope,
  eventPolitician,
  type ArticleFeedEvent,
  type BillFeedEvent,
  type ElectionUpdateFeedEvent,
  type FactCheckFeedEvent,
  type FeedEvent,
  type PositionFeedEvent,
  type PromiseFeedEvent,
  type ScoreFeedEvent,
  type VoteFeedEvent,
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
import { Avatar, Card, Chip, Display, EmptyState, ExpandableQuote, Kicker, Pill } from "@/components/ui";
import RepresentativesCard from "@/components/RepresentativesCard";
import { FactCheckCard } from "./FactCheckView";

type TypeFilter = "all" | FeedEvent["type"];

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All Updates" },
  { value: "vote", label: "Votes" },
  { value: "bill", label: "Bills & Legislation" },
  { value: "factcheck", label: "Fact Check" },
  { value: "electionUpdate", label: "Election Updates" },
  { value: "article", label: "Articles" },
  { value: "position", label: "Positions" },
];

// Sized for "Bills & Legislation," the longest row label, plus the icon and
// count columns. Local to the Feed rather than AppShell's shared RAIL_WIDTH
// -- see the Phase 1 findings note on why this rail is page-local JSX
// rather than a route AppShell's contextual-rail mechanism knows about.
const TYPE_RAIL_WIDTH = 210;

/**
 * Category color per event type -- rust for the legislative record (what
 * officials actually did), faded blue for sourced/evidentiary material
 * (anything traced to a document), faded green for civic logistics (dates
 * and deadlines, not a record or a source). `score` and `promise` are
 * deliberately absent -- those stay neutral, same as STATUS_STYLE.
 */
const TYPE_COLOR: Partial<Record<FeedEvent["type"], string>> = {
  vote: C.rust,
  bill: C.rust,
  factcheck: C.slate,
  position: C.slate,
  article: C.slate,
  electionUpdate: C.independent,
};
const TYPE_FILL: Partial<Record<FeedEvent["type"], string>> = {
  vote: C.rustFill,
  bill: C.rustFill,
  factcheck: C.slateFill,
  position: C.slateFill,
  article: C.slateFill,
  electionUpdate: C.independentFill,
};

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
 * Flat single-stroke navy line glyphs, one per Feed event type -- no per-
 * category color, per the standing rule. Deliberately plain geometric
 * shapes rather than a pulled-in icon library: nothing else in this
 * codebase renders an icon, so there was no existing set to match.
 */
function TypeIcon({
  type,
  size = 15,
  color = C.slate,
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
 * The Feed, restructured for app-layout-v2 phase 1. Three additions sit on
 * top of the existing reverse-chronological event list:
 *
 *   1. An orientation strip (Your Election / Your Top Issues / Your
 *      Representatives) so a reader lands somewhere useful before scrolling
 *      into the list itself.
 *   2. A Type filter rail, page-local to the Feed (see TYPE_RAIL_WIDTH's
 *      doc comment) rather than routed through AppShell's contextual rail,
 *      which is built for scroll-spy jump links, not click-to-filter.
 *   3. Four new event types -- Votes, Bills & Legislation, Election
 *      Updates, Articles -- alongside the original four. `score` and
 *      `promise` events have no dedicated filter row (they're not named in
 *      the Type rail's seven categories) but still appear under "All
 *      Updates."
 *
 * The scope chips (My Ballot / My Issues / Following) are unchanged from
 * phase 0 -- `useFeedScope` still drives them, just relabeled to title case.
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
  const { saved, topics } = usePrefs();
  const [scope, setScope] = useFeedScope();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const mounted = useMounted();

  const ballotIds = useMemo(() => ballotPoliticianIds(races), [races]);
  const ballotPoliticians = useMemo(
    () => politicians.filter((p) => ballotIds.has(p.id)),
    [politicians, ballotIds],
  );

  const allEvents = useMemo(
    () => buildFeedEvents(politicians, factChecks, guide, stance, votes, bills, electionUpdates, articles),
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

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: scopedEvents.length };
    for (const e of scopedEvents) counts[e.type] = (counts[e.type] ?? 0) + 1;
    return counts;
  }, [scopedEvents]);

  const events = useMemo(
    () => (typeFilter === "all" ? scopedEvents : scopedEvents.filter((e) => e.type === typeFilter)),
    [scopedEvents, typeFilter],
  );

  const followingEmpty = scope === "following" && saved.length === 0;
  const issuesEmpty = scope === "issues" && topics.length === 0;
  const days = mounted
    ? Math.max(0, Math.floor((new Date(ELECTION_ISO).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <FeedHero count={events.length} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Kicker>Feed</Kicker>
        <Display size={25}>What&apos;s happened · {events.length}</Display>
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
        <RepresentativesCard politicians={ballotPoliticians} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {FEED_SCOPES.map((s) => (
          <Chip key={s.value} on={scope === s.value} onClick={() => setScope(s.value)}>
            {s.label}
          </Chip>
        ))}
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <aside
          style={{
            width: TYPE_RAIL_WIDTH,
            flex: `0 0 ${TYPE_RAIL_WIDTH}px`,
            position: "sticky",
            // AppShell's top bar (66px) and PersonalizeBanner both sit outside
            // the scrolling pane (`main.scroll` in AppShell.tsx) as flex
            // siblings above it, not inside it -- so this sticky offset is
            // relative to the top of the scroll container itself, which
            // already starts below the top bar. 16 just matches the page's
            // own top padding, same as the rest of this layout's breathing
            // room, rather than needing to clear the nav's height on top of it.
            top: 16,
          }}
        >
          <TypeFilterRail value={typeFilter} onChange={setTypeFilter} counts={typeCounts} />
        </aside>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          <TodayStrip events={events} />

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events.map((e) => (
              <FeedEventCard key={e.id} event={e} />
            ))}
            {events.length === 0 ? (
              <EmptyState>
                {followingEmpty ? (
                  "Nothing followed yet — open a profile and hit “Save to my list”."
                ) : issuesEmpty ? (
                  <>
                    You haven&apos;t ranked any issues yet — pick some from &ldquo;My issues&rdquo; in
                    the account menu, or{" "}
                    <Link href="/profile/top-issues/issue-finder?next=/feed" style={{ color: C.rust }}>
                      answer a few questions with Issue Finder
                    </Link>
                    .
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
        </div>
      </div>
    </div>
  );
}

/**
 * Feed's hero banner -- modeled directly on GuideView.tsx's GuideHero(),
 * same shell and scrim treatment, so it reads as the same device rather
 * than a new one. Purely additive above the existing Kicker/Display title
 * row, which stays exactly where it is (the functional page title; this is
 * the branded banner above it, not a replacement).
 */
function FeedHero({ count }: { count: number }) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        background: C.ink,
        minHeight: 260,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <img
        src="/images/feed-hero.jpg"
        alt=""
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(11,10,8,0.85), rgba(11,10,8,0.35))",
        }}
      />
      <div style={{ position: "relative", padding: "22px 26px", display: "flex", flexDirection: "column", gap: 6 }}>
        <Kicker color={C.tan}>Feed</Kicker>
        <Display size={28} color={C.sand}>
          The record, not{" "}
          <span
            style={{
              display: "inline-block",
              backgroundImage:
                "linear-gradient(to bottom,rgba(255,109,0,0) 0 5%,rgba(255,126,22,0.88) 5% 18%,rgba(255,122,14,1) 18% 52%,rgba(236,96,0,1) 52% 84%,rgba(255,109,0,0.72) 84% 95%,rgba(255,109,0,0.3) 95% 100%),linear-gradient(96deg,rgba(255,109,0,0.5) 0 1.5%,rgba(255,109,0,1) 4% 92%,rgba(255,109,0,0.45) 99% 100%)",
              clipPath:
                "polygon(0.6% 8%,2.2% 2%,48% 0.3%,96.8% 2.4%,99.6% 9%,100% 86%,97.4% 98%,44% 100%,2% 97.4%,0.2% 88%)",
              transform: "rotate(-0.55deg)",
              padding: "2px 8px 4px",
              color: "#000000",
              fontWeight: 700,
            }}
          >
            the spin
          </span>
          .
        </Display>
        <span style={{ fontSize: 13, color: C.tan }}>{count} update{count === 1 ? "" : "s"}</span>
      </div>
    </div>
  );
}

/**
 * Your Election. Compact by design -- the full ticking countdown with key
 * dates lives on Your Ballot / HUSH Guide's ElectionCountdownBanner; this is
 * just enough to orient before scrolling into the list.
 */
function ElectionCard({ days, raceCount }: { days: number | null; raceCount: number }) {
  return (
    <Card style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
      <Kicker>Your Election</Kicker>
      <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
        <span style={{ fontFamily: cond, fontSize: 30, lineHeight: 1, color: C.slate }}>
          {days === null ? "—" : days}
        </span>
        <span style={{ fontSize: 13, color: C.body }}>days until Election Day</span>
      </div>
      <span style={{ fontSize: 12, color: C.muted }}>{raceCount} races on your ballot</span>
      <Link href="/your-ballot" style={{ fontSize: 12, color: C.rust, alignSelf: "flex-start" }}>
        View your ballot →
      </Link>
    </Card>
  );
}

function TopIssuesCard({ topics }: { topics: string[] }) {
  return (
    <Card style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
      <Kicker>Your Top Issues</Kicker>
      {topics.length === 0 ? (
        <span style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>
          Nothing ranked yet —{" "}
          <Link href="/profile/top-issues/issue-finder?next=/feed" style={{ color: C.rust }}>
            answer a few questions
          </Link>{" "}
          to personalize your feed.
        </span>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {topics.slice(0, 4).map((t, i) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.ink }}>
              <span style={{ fontFamily: cond, fontSize: 12, color: C.muted, width: 14, flex: "0 0 14px" }}>
                {i + 1}
              </span>
              {t}
            </div>
          ))}
        </div>
      )}
      <Link href="/profile/top-issues" style={{ fontSize: 12, color: C.rust, alignSelf: "flex-start" }}>
        Manage issues →
      </Link>
    </Card>
  );
}

function TypeFilterRail({
  value,
  onChange,
  counts,
}: {
  value: TypeFilter;
  onChange: (v: TypeFilter) => void;
  counts: Record<string, number>;
}) {
  return (
    <nav aria-label="Filter by type" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {TYPE_FILTERS.map((f) => {
        const on = value === f.value;
        return (
          <button
            key={f.value}
            type="button"
            onClick={() => onChange(f.value)}
            aria-current={on ? "true" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              width: "100%",
              textAlign: "left",
              padding: "9px 10px 9px 11px",
              borderRadius: 7,
              border: 0,
              borderLeft: `3px solid ${on ? C.rust : "transparent"}`,
              background: on ? C.shell : "transparent",
              color: on ? C.ink : C.body,
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            <TypeIcon type={f.value} />
            <span style={{ flex: 1 }}>{f.label}</span>
            <span style={{ fontSize: 11, color: C.muted }}>{counts[f.value] ?? 0}</span>
          </button>
        );
      })}
    </nav>
  );
}

function TodayStrip({ events }: { events: FeedEvent[] }) {
  if (events.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Kicker>Today&apos;s Updates</Kicker>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {events.slice(0, 6).map((e) => {
          const politician = eventPolitician(e);
          return (
            <Card key={e.id} style={{ flex: "0 0 220px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TypeIcon type={e.type} size={13} color={TYPE_COLOR[e.type] ?? C.slate} />
                <Pill
                  bg={TYPE_FILL[e.type] ?? C.shell}
                  fg={TYPE_COLOR[e.type] ?? C.muted}
                  style={{ fontFamily: cond, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 8px" }}
                >
                  {typeLabel(e.type)}
                </Pill>
              </div>
              <span style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.4 }}>{eventHeadline(e)}</span>
              {politician ? <span style={{ fontSize: 11, color: C.muted }}>{politician.name}</span> : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function FeedEventCard({ event }: { event: FeedEvent }) {
  switch (event.type) {
    case "score":
      return <ScoreEventCard event={event} />;
    case "promise":
      return <PromiseEventCard event={event} />;
    case "factcheck":
      return <FactCheckEventCard event={event} />;
    case "position":
      return <PositionEventCard event={event} />;
    case "vote":
      return <VoteEventCard event={event} />;
    case "bill":
      return <BillEventCard event={event} />;
    case "electionUpdate":
      return <ElectionUpdateEventCard event={event} />;
    case "article":
      return <ArticleEventCard event={event} />;
  }
}

/**
 * Shared card shell -- the flat tinted header panel (navy glyph + condensed
 * type label + date) app-layout-v2 calls for, wrapping whatever body the
 * specific event type renders below it. FactCheckEventCard is the one
 * exception (see its own doc comment): it keeps delegating to the shared
 * FactCheckCard rather than being wrapped in a second header, since that
 * component also renders on the politician page and Stance Check's reveal
 * and shouldn't grow a Feed-only header treatment.
 */
function EventCard({ event, children }: { event: FeedEvent; children: ReactNode }) {
  return (
    <Card className="lift" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "8px 14px",
          background: C.slateFill,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <TypeIcon type={event.type} color={TYPE_COLOR[event.type] ?? C.slate} />
        <span
          style={{
            fontFamily: cond,
            fontSize: 12.5,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: TYPE_COLOR[event.type] ?? C.ink,
          }}
        >
          {typeLabel(event.type)}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>{event.date}</span>
      </div>
      <div style={{ padding: "11px 14px", display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </Card>
  );
}

function PoliticianRow({ politician, anchor }: { politician: Politician; anchor?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
      <Avatar text={initials(politician.name)} size={24} radius={6} font={10} />
      <Link
        href={anchor ? `/politician/${politician.id}#${anchor}` : `/politician/${politician.id}`}
        style={{ fontSize: 13, fontWeight: 500, color: C.ink }}
      >
        {politician.name}
      </Link>
      <span style={{ fontSize: 12, color: C.muted }}>{politician.office}</span>
    </div>
  );
}

function ScoreEventCard({ event }: { event: ScoreFeedEvent }) {
  return (
    <EventCard event={event}>
      <PoliticianRow politician={event.politician} anchor="score" />
      <span style={{ fontFamily: cond, fontSize: 20, color: C.ink }}>
        {event.from} → {event.to}
      </span>
      <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{event.reason}</span>
    </EventCard>
  );
}

function PromiseEventCard({ event }: { event: PromiseFeedEvent }) {
  const s = STATUS_STYLE[event.status];
  return (
    <EventCard event={event}>
      <PoliticianRow politician={event.politician} anchor="ledger" />
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Pill bg={s.bg} fg={s.fg}>
          {event.status}
        </Pill>
        <span style={{ fontSize: 14, lineHeight: 1.5 }}>{event.text}</span>
      </div>
    </EventCard>
  );
}

function FactCheckEventCard({ event }: { event: FactCheckFeedEvent }) {
  return (
    <FactCheckCard
      check={event.check}
      who={event.politician.name}
      href={`/politician/${event.politician.id}#claims-checked`}
      showSources={false}
    />
  );
}

function PositionEventCard({ event }: { event: PositionFeedEvent }) {
  const sub = event.kind === "guide" ? "HUSH Guide position" : `Stance Check · ${event.stance}`;
  return (
    <EventCard event={event}>
      <PoliticianRow politician={event.politician} anchor="positions" />
      <span style={{ fontSize: 12, color: C.muted }}>
        {sub} · {event.issue}
      </span>
      <ExpandableQuote text={event.excerpt} style={{ fontSize: 14 }} />
      <a
        href={event.sourceUrl}
        target="_blank"
        rel="noreferrer"
        style={{ fontSize: 12, color: C.rust, alignSelf: "flex-start" }}
      >
        {event.sourceTitle}
      </a>
    </EventCard>
  );
}

function VoteEventCard({ event }: { event: VoteFeedEvent }) {
  const v = event.vote;
  return (
    <EventCard event={event}>
      <PoliticianRow politician={event.politician} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Pill bg={C.shell} fg={C.ink}>
          {v.vote}
        </Pill>
        <span style={{ fontFamily: cond, fontSize: 14, color: C.ink }}>{v.billNumber}</span>
        <span style={{ fontSize: 13, color: C.body }}>{v.billTitle}</span>
      </div>
      <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{v.note}</span>
      <span style={{ fontSize: 11, color: C.muted }}>{v.chamber}</span>
    </EventCard>
  );
}

function BillEventCard({ event }: { event: BillFeedEvent }) {
  const b = event.bill;
  return (
    <EventCard event={event}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontFamily: cond, fontSize: 15, color: C.ink }}>{b.number}</span>
        <span style={{ fontSize: 13, color: C.body }}>{b.title}</span>
      </div>
      <span style={{ fontSize: 12, color: C.muted }}>
        {b.chamber}
        {b.voteStage ? ` · ${b.voteStage}` : ""}
      </span>
      {b.description ? <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{b.description}</span> : null}
      <Link href="/hush-guide#bills" style={{ fontSize: 12, color: C.rust, alignSelf: "flex-start" }}>
        See HUSH&apos;s plain-English breakdown
      </Link>
    </EventCard>
  );
}

function ElectionUpdateEventCard({ event }: { event: ElectionUpdateFeedEvent }) {
  const u = event.update;
  return (
    <EventCard event={event}>
      <span style={{ fontFamily: cond, fontSize: 16, color: C.ink }}>{u.headline}</span>
      <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{u.detail}</span>
      <a
        href={u.sourceUrl}
        target="_blank"
        rel="noreferrer"
        style={{ fontSize: 12, color: C.rust, alignSelf: "flex-start" }}
      >
        {u.sourceName}
      </a>
    </EventCard>
  );
}

function ArticleEventCard({ event }: { event: ArticleFeedEvent }) {
  const a = event.article;
  return (
    <EventCard event={event}>
      <PoliticianRow politician={event.politician} />
      <span style={{ fontFamily: cond, fontSize: 15, color: C.ink }}>{a.headline}</span>
      <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{a.dek}</span>
      <a
        href={a.sourceUrl}
        target="_blank"
        rel="noreferrer"
        style={{ fontSize: 12, color: C.rust, alignSelf: "flex-start" }}
      >
        {a.sourceName}
      </a>
    </EventCard>
  );
}
