"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { C, STATUS_STYLE, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { useFeedScope } from "@/lib/feedScope";
import { initials } from "@/lib/scoring";
import {
  ballotPoliticianIds,
  buildFeedEvents,
  matchesIssues,
  type FactCheckFeedEvent,
  type FeedEvent,
  type PositionFeedEvent,
  type PromiseFeedEvent,
  type ScoreFeedEvent,
} from "@/lib/feed";
import type { FactCheck, IssuePosition, Politician, Race, StanceCheckPosition } from "@/lib/types";
import { Avatar, Card, Display, EmptyState, ExpandableQuote, Kicker, Pill } from "@/components/ui";
import { FactCheckCard } from "./FactCheckView";

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
  }
}

/**
 * The Feed, rebuilt for app IA restructure phase 4. What replaced the old
 * sortable directory table (every politician, every score, side by side) is
 * a reverse-chronological event list -- score changes, promise status
 * changes, fact-check verdicts, and new/updated positions -- scoped to the
 * user's ballot by default, with a toggle to Following. A HUSH. Score only
 * ever appears here as one politician's own change event, with its reason
 * attached; it is never shown next to anyone else's, matching the amendment's
 * standing rule enforced in CompareView/GuideView.
 *
 * The scope filter (My ballot / My issues / Following) used to render here
 * as horizontal chips; per the sidebar contextual-nav brief it now lives in
 * AppShell's sidebar as a vertical filter list instead (see `useFeedScope`)
 * -- this view just reads whatever scope the sidebar has set.
 */
export default function FeedView({
  politicians,
  factChecks,
  races,
  guide,
  stance,
}: {
  politicians: Politician[];
  factChecks: FactCheck[];
  races: Race[];
  guide: Record<string, Record<string, IssuePosition>>;
  stance: Record<string, Record<string, StanceCheckPosition>>;
}) {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const { saved, topics } = usePrefs();
  const [scope] = useFeedScope();

  const ballotIds = useMemo(() => ballotPoliticianIds(races), [races]);

  const allEvents = useMemo(
    () => buildFeedEvents(politicians, factChecks, guide, stance),
    [politicians, factChecks, guide, stance],
  );

  const events = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return allEvents.filter((e) => {
      const inScope =
        scope === "ballot"
          ? ballotIds.has(e.politician.id)
          : scope === "following"
            ? saved.includes(e.politician.id)
            : matchesIssues(e, topics);
      if (!inScope) return false;
      if (!needle) return true;
      const haystack = [e.politician.name, e.politician.office, ...e.politician.tags, eventText(e)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [allEvents, scope, ballotIds, saved, topics, q]);

  const followingEmpty = scope === "following" && saved.length === 0;
  const issuesEmpty = scope === "issues" && topics.length === 0;

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Kicker>Feed</Kicker>
        <Display size={25}>What&apos;s happened · {events.length}</Display>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {events.map((e) => (
          <FeedEventCard key={e.id} event={e} />
        ))}
        {events.length === 0 ? (
          <EmptyState>
            {followingEmpty
              ? "Nothing followed yet — open a profile and hit “Save to my list”."
              : issuesEmpty
                ? "You haven't ranked any issues yet — pick some from “My issues” in the account menu."
                : q.trim()
                  ? `Nothing matches "${q.trim()}".`
                  : "Nothing to show yet."}
          </EmptyState>
        ) : null}
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
  }
}

function EventShell({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <Card
      className="lift"
      style={{
        borderLeft: `3px solid ${accent}`,
        padding: "15px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {children}
    </Card>
  );
}

function EventHeader({
  politician,
  anchor,
  label,
  date,
}: {
  politician: Politician;
  anchor: string;
  label: string;
  date: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <Avatar text={initials(politician.name)} size={26} radius={7} font={11} />
      <Link href={`/politician/${politician.id}`} style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>
        {politician.name}
      </Link>
      <Link href={`/politician/${politician.id}#${anchor}`} style={{ fontSize: 12, color: C.muted }}>
        {label}
      </Link>
      <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>{date}</span>
    </div>
  );
}

function ScoreEventCard({ event }: { event: ScoreFeedEvent }) {
  const up = event.to >= event.from;
  const accent = up ? C.navy : C.rust;
  return (
    <EventShell accent={accent}>
      <EventHeader politician={event.politician} anchor="score" label="HUSH. Score" date={event.date} />
      <span style={{ fontFamily: cond, fontSize: 20, color: accent }}>
        {event.from} → {event.to}
      </span>
      <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{event.reason}</span>
    </EventShell>
  );
}

function PromiseEventCard({ event }: { event: PromiseFeedEvent }) {
  const s = STATUS_STYLE[event.status];
  return (
    <EventShell accent={s.fg}>
      <EventHeader politician={event.politician} anchor="ledger" label="Promise ledger" date={event.date} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Pill bg={s.bg} fg={s.fg}>
          {event.status}
        </Pill>
        <span style={{ fontSize: 14, lineHeight: 1.5 }}>{event.text}</span>
      </div>
    </EventShell>
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
  const label =
    event.kind === "guide" ? "HUSH Guide position" : `Stance Check · ${event.stance}`;
  return (
    <EventShell accent={C.tan}>
      <EventHeader politician={event.politician} anchor="positions" label={label} date={event.date} />
      <span style={{ fontSize: 12, color: C.muted }}>{event.issue}</span>
      <ExpandableQuote text={event.excerpt} style={{ fontSize: 14 }} />
      <a
        href={event.sourceUrl}
        target="_blank"
        rel="noreferrer"
        style={{ fontSize: 12, color: C.rust, alignSelf: "flex-start" }}
      >
        {event.sourceTitle}
      </a>
    </EventShell>
  );
}
