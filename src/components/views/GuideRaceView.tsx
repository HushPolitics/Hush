"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { parseRaceTitle } from "@/lib/guide";
import type { IssuePosition, Politician, Race } from "@/lib/types";
import { Card, Display, EmptyState, Kicker, RustButton } from "@/components/ui";

/**
 * Election Comparison Page — one section per issue the user picked in HUSH
 * Guide's setup, each showing every candidate's sourced position side by
 * side. No score, no ranking, no "who matches you" — this page exists to
 * show what was said and where it came from, nothing more. `guideIssues` is
 * read live from prefs (not passed as a prop) so editing the issue list
 * elsewhere in HUSH Guide updates this page's sections without a reload.
 */
export default function GuideRaceView({
  race,
  politicians,
  positions,
}: {
  race: Race;
  politicians: Politician[];
  positions: Record<string, Record<string, IssuePosition>>;
}) {
  const router = useRouter();
  const { guideIssues } = usePrefs();
  const knownIds = new Set(politicians.map((p) => p.id));
  const { office, district } = parseRaceTitle(race.title);

  if (guideIssues.length === 0) {
    return (
      <div style={{ padding: "24px 28px" }}>
        <Card style={{ maxWidth: 520, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <Display size={21}>Set up HUSH Guide first</Display>
          <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
            Pick the issues you want researched before opening a comparison page.
          </span>
          <RustButton onClick={() => router.push("/hush-guide")} style={{ alignSelf: "flex-start" }}>
            Go to HUSH Guide
          </RustButton>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <button
        type="button"
        onClick={() => router.push("/hush-guide")}
        style={{
          alignSelf: "flex-start",
          border: 0,
          background: "transparent",
          color: C.navy,
          fontSize: 13,
          cursor: "pointer",
          padding: 0,
        }}
      >
        ← Back to HUSH Guide
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Kicker>{district ? `${office} · ${district}` : office}</Kicker>
        <Display size={28}>{race.title}</Display>
        <span style={{ fontSize: 13, color: C.muted }}>{race.meta}</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {race.candidates.map((c) =>
          knownIds.has(c.politicianId) ? (
            <Link
              key={c.politicianId}
              href={`/politician/${c.politicianId}`}
              style={{
                fontSize: 13,
                padding: "6px 12px",
                borderRadius: 20,
                border: `1px solid ${C.line}`,
                color: C.navy,
                background: C.white,
              }}
            >
              {c.name}
            </Link>
          ) : (
            <span
              key={c.politicianId}
              style={{
                fontSize: 13,
                padding: "6px 12px",
                borderRadius: 20,
                border: `1px solid ${C.line}`,
                color: C.body,
                background: C.white,
              }}
            >
              {c.name}
            </span>
          ),
        )}
      </div>

      {guideIssues.map((issue) => (
        <IssueSection key={issue} issue={issue} race={race} positions={positions} />
      ))}
    </div>
  );
}

function IssueSection({
  issue,
  race,
  positions,
}: {
  issue: string;
  race: Race;
  positions: Record<string, Record<string, IssuePosition>>;
}) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <Kicker>Issue</Kicker>
        <Display size={21}>{issue}</Display>
        <span style={{ height: 1, flex: 1, background: C.line }} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(race.candidates.length, 3)}, minmax(260px, 1fr))`,
          gap: 14,
          overflowX: "auto",
        }}
      >
        {race.candidates.map((c) => (
          <CandidatePositionCard
            key={c.politicianId}
            name={c.name}
            position={positions[c.politicianId]?.[issue]}
          />
        ))}
      </div>
    </section>
  );
}

function CandidatePositionCard({
  name,
  position,
}: {
  name: string;
  position?: IssuePosition;
}) {
  return (
    <Card
      style={{
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minWidth: 0,
      }}
    >
      <span style={{ fontFamily: cond, fontSize: 16, lineHeight: 1.2 }}>{name}</span>

      {position ? (
        <>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: C.body, fontStyle: "italic" }}>
            &ldquo;{position.excerpt}&rdquo;
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              paddingTop: 8,
              borderTop: `1px solid ${C.lineSoft}`,
            }}
          >
            <span style={{ fontSize: 12, color: C.ink }}>{position.sourceTitle}</span>
            <span style={{ fontSize: 11, color: C.muted }}>
              {position.sourceType}
              {position.date ? ` · ${position.date}` : ""}
            </span>
            <a
              href={position.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: C.navy, marginTop: 2 }}
            >
              View Original Source →
            </a>
          </div>
        </>
      ) : (
        <span style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>
          No official position found
        </span>
      )}
    </Card>
  );
}
