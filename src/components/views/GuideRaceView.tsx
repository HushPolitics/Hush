"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { C, positionNotice } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { hasRaceInfo, parseRaceTitle, splitHeadToHead, stripPartySuffix } from "@/lib/guide";
import type { IssuePosition, Party, Race, RaceCandidate } from "@/lib/types";
import { Card, Display, EmptyState, GhostButton, Kicker, PositionNotice, RustButton } from "@/components/ui";

/**
 * Election Comparison Page — one section per issue the user picked in HUSH
 * Guide's setup, each showing every candidate's sourced position side by
 * side. No score, no ranking, no "who matches you" — this page exists to
 * show what was said and where it came from, nothing more. `topics` is read
 * live from prefs (not passed as a prop) so editing the issue list elsewhere
 * in HUSH Guide, Stance Check, or Profile updates this page's sections
 * without a reload.
 */
export default function GuideRaceView({
  race,
  knownPoliticianIds,
  positions,
}: {
  race: Race;
  knownPoliticianIds: string[];
  positions: Record<string, Record<string, IssuePosition>>;
}) {
  const router = useRouter();
  const { topics } = usePrefs();
  const knownIds = new Set(knownPoliticianIds);
  const { office, district } = parseRaceTitle(race.title);
  // Governor, U.S. Senate and U.S. House compare the Democrat and the
  // Republican only; everyone else is behind a button below (see
  // splitHeadToHead in guide.ts). Any other race: main is everyone, others
  // is empty, and nothing below changes.
  const { main, others } = splitHeadToHead(race);
  const [showOthers, setShowOthers] = useState(false);

  // No candidate has a sourced position on the issues this voter picked (or,
  // with no issues picked, on any issue): one short note instead of the same
  // "No official position found" box under every issue.
  const noInfo = !hasRaceInfo(race, topics, positions);

  // One "submit your positions" link per candidate, under the first picked
  // issue where they have nothing, rather than under every empty box.
  const submitLinkIssue = new Map<string, string>();
  for (const c of main) {
    const first = topics.find((issue) => !positions[c.politicianId]?.[issue]);
    if (first) submitLinkIssue.set(c.politicianId, first);
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
          color: C.rust,
          fontSize: 13,
          cursor: "pointer",
          padding: 0,
        }}
      >
        ← Back to HUSH. Guide
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Kicker>{district ? `${office} · ${district}` : office}</Kicker>
        <Display size={28}>{race.title}</Display>
        <span style={{ fontSize: 13, color: C.muted }}>{race.meta}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Kicker>Candidates</Kicker>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {main.map((c) =>
          knownIds.has(c.politicianId) ? (
            <Link
              key={c.politicianId}
              href={`/politician/${c.politicianId}`}
              style={{
                fontSize: 13,
                padding: "6px 12px",
                borderRadius: 20,
                border: `1px solid ${C.line}`,
                color: C.rust,
                background: C.white,
              }}
            >
              {stripPartySuffix(c.name)}
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
              {stripPartySuffix(c.name)}
            </span>
          ),
        )}
        {others.length > 0 ? (
          <a href="#other-candidates" style={{ fontSize: 13, color: C.muted, alignSelf: "center" }}>
            + {others.length} other {others.length === 1 ? "candidate" : "candidates"} on the ballot ↓
          </a>
        ) : null}
        </div>
      </div>

      {noInfo ? (
        <NoPositionsCard
          race={race}
          hasOtherInfo={hasRaceInfo(race, [], positions)}
          onEditIssues={() => router.push("/hush-guide")}
        />
      ) : topics.length > 0 ? (
        topics.map((issue) => (
          <IssueSection
            key={issue}
            issue={issue}
            candidates={main}
            positions={positions}
            raceTitle={race.title}
            submitLinkIssue={submitLinkIssue}
          />
        ))
      ) : (
        // Who is running is the baseline fact of a race and shows regardless.
        // Positions are the layer on top, which needs the reader's issues, so
        // without them this invites them to rank issues instead of blocking.
        <Card style={{ maxWidth: 520, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <Display size={19}>See where they stand on your issues</Display>
          <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
            Rank the issues that matter to you in HUSH. Guide and this page will show each candidate&apos;s position on
            them, side by side, with the source.
          </span>
          <RustButton onClick={() => router.push("/hush-guide")} style={{ alignSelf: "flex-start" }}>
            Rank my issues
          </RustButton>
        </Card>
      )}

      {others.length > 0 ? (
        <OtherCandidates
          others={others}
          knownIds={knownIds}
          open={showOthers}
          onToggle={() => setShowOthers((v) => !v)}
        />
      ) : null}
    </div>
  );
}

function IssueSection({
  issue,
  candidates,
  positions,
  raceTitle,
  submitLinkIssue,
}: {
  issue: string;
  candidates: RaceCandidate[];
  positions: Record<string, Record<string, IssuePosition>>;
  raceTitle: string;
  submitLinkIssue: Map<string, string>;
}) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <Kicker>Issue</Kicker>
        <Display size={21}>{issue}</Display>
        <span style={{ height: 1, flex: 1, background: C.line }} />
      </div>

      <div
        className={candidates.length === 2 ? "guide-compare-h2h" : undefined}
        style={{
          display: "grid",
          // Exactly two candidates (the Democrat and the Republican): two equal
          // columns that always fit the screen, so they stay side by side on
          // a phone instead of scrolling sideways. Any other count keeps the
          // existing layout.
          gridTemplateColumns:
            candidates.length === 2
              ? "repeat(2, minmax(0, 1fr))"
              : `repeat(${Math.min(candidates.length, 3)}, minmax(260px, 1fr))`,
          gap: 14,
          overflowX: "auto",
        }}
      >
        {candidates.map((c) => (
          <CandidatePositionCard
            key={c.politicianId}
            name={stripPartySuffix(c.name)}
            position={positions[c.politicianId]?.[issue]}
            submitHref={
              submitLinkIssue.get(c.politicianId) === issue
                ? `/contact?topic=candidate&race=${encodeURIComponent(raceTitle)}&candidate=${encodeURIComponent(stripPartySuffix(c.name))}`
                : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}

function CandidatePositionCard({
  name,
  position,
  submitHref,
}: {
  name: string;
  position?: IssuePosition;
  submitHref?: string;
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
      <span style={{ fontSize: 16, lineHeight: 1.2 }}>{name}</span>

      {position ? (
        <>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: C.body, fontStyle: "italic" }}>
            &ldquo;{position.excerpt}&rdquo;
          </p>
          <PositionNotice notice={positionNotice(position.sourceType, position.sourceTitle)} />
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
              style={{ fontSize: 12, color: C.rust, marginTop: 2 }}
            >
              View Original Source →
            </a>
          </div>
        </>
      ) : (
        <>
          <span style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>
            No official position found
          </span>
          {submitHref ? (
            <Link href={submitHref} style={{ fontSize: 12, color: C.rust, lineHeight: 1.4 }}>
              Are you this candidate? Submit your positions →
            </Link>
          ) : null}
        </>
      )}
    </Card>
  );
}

const PARTY_LABEL: Record<Party, string> = {
  D: "Democrat",
  R: "Republican",
  I: "Independent",
  NPA: "No party affiliation",
  Other: "Other party",
};

/**
 * The button under a head-to-head comparison, and the list it opens: every
 * other candidate on the ballot, each a card that goes to their profile page.
 * Candidates with no profile record (their id starts "candidacy:") show as
 * plain cards that say so, same rule the "Candidates" chips above use.
 */
function OtherCandidates({
  others,
  knownIds,
  open,
  onToggle,
}: {
  others: RaceCandidate[];
  knownIds: Set<string>;
  open: boolean;
  onToggle: () => void;
}) {
  const n = others.length;
  const box = {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minHeight: 48,
    padding: "12px 14px",
    borderRadius: 10,
    border: `1px solid ${C.line}`,
    background: C.white,
  } as const;

  return (
    <section
      id="other-candidates"
      style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 20, borderTop: `1px solid ${C.line}` }}
    >
      <span style={{ fontSize: 14, color: C.body, lineHeight: 1.5 }}>
        This comparison shows the Democratic and Republican candidates. {n} other{" "}
        {n === 1 ? "candidate is" : "candidates are"} also on the ballot.
      </span>
      <GhostButton onClick={onToggle} style={{ alignSelf: "flex-start" }}>
        {open ? "Hide other candidates" : `Look at the other ${n} ${n === 1 ? "candidate" : "candidates"} on the ballot`}
      </GhostButton>

      {open ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))", gap: 10 }}>
          {others.map((c) => {
            const name = stripPartySuffix(c.name);
            const party = PARTY_LABEL[c.party];
            return knownIds.has(c.politicianId) ? (
              <Link
                key={c.politicianId}
                href={`/politician/${c.politicianId}`}
                style={{ ...box, color: C.ink, textDecoration: "none" }}
              >
                <span style={{ fontSize: 15 }}>{name}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{party}</span>
                <span style={{ fontSize: 12, color: C.rust }}>View profile →</span>
              </Link>
            ) : (
              <div key={c.politicianId} style={box}>
                <span style={{ fontSize: 15, color: C.body }}>{name}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{party}</span>
                <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>No profile page yet</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

/**
 * Shown instead of the per-issue sections when nobody in the race has a
 * sourced position on the voter's picked issues. Same rule as everywhere else
 * on HUSH.: a position appears only when it can be quoted word for word and
 * linked to where it was said, so the honest answer here is "not yet" plus a
 * way for the candidates to change that.
 */
function NoPositionsCard({
  race,
  hasOtherInfo,
  onEditIssues,
}: {
  race: Race;
  hasOtherInfo: boolean;
  onEditIssues: () => void;
}) {
  const router = useRouter();
  return (
    <Card style={{ maxWidth: 560, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <Display size={19}>We haven&apos;t found candidate positions for this race yet</Display>
      <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
        HUSH. only shows a position when we can quote it word for word and link to where it was said. For the
        issues you picked, we haven&apos;t found that from anyone in this race. The candidates are listed above, and
        their profile pages have everything we do have.
      </span>
      {hasOtherInfo ? (
        <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
          We do have positions on other issues in this race.{" "}
          <button
            type="button"
            className="link-quiet"
            onClick={onEditIssues}
            style={{ border: 0, background: "transparent", color: C.rust, fontSize: 13, cursor: "pointer", padding: 0 }}
          >
            Change my issues →
          </button>
        </span>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 12, borderTop: `1px solid ${C.lineSoft}` }}>
        <span style={{ fontSize: 14, color: C.ink }}>Are you a candidate in this race?</span>
        <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
          Send us a link to where you&apos;ve said it publicly (your website, a speech, an interview or a filing), or
          a direct quote you want on the record. We add a position only with a source anyone can check.
        </span>
        <GhostButton
          onClick={() => router.push(`/contact?topic=candidate&race=${encodeURIComponent(race.title)}`)}
          style={{ alignSelf: "flex-start" }}
        >
          Submit your positions
        </GhostButton>
      </div>
    </Card>
  );
}
