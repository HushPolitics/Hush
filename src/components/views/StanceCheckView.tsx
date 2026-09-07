"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { C, PARTY, PARTY_LABEL, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { parseRaceTitle, stripPartySuffix } from "@/lib/guide";
import { jumpToSection } from "@/lib/sectionNav";
import type { FactCheck, Party, Politician, Race, StanceCheckAnswer, StanceCheckPosition } from "@/lib/types";
import { Card, Display, Kicker, Pill, RustButton } from "@/components/ui";
import { FactCheckCard } from "./FactCheckView";
import { IssuesStep } from "./GuideView";

type Bucket = StanceCheckAnswer | "No record";
const BUCKETS: Bucket[] = ["Agree", "Neutral", "Disagree", "No record"];

/**
 * One identical neutral treatment for every bucket -- Agree, Neutral and
 * Disagree all get the same ink/body/shell styling in the per-question
 * results grid below, whichever bucket it is. Coloring *politicians'*
 * Agree/Neutral/Disagree would read as the UI signaling who's "right" --
 * exactly what the no-score requirement says this feature must not do.
 * "No record" keeps its own, more muted treatment -- that's a
 * presence/absence distinction (nothing sourced to link to), not a verdict.
 * Which group matters more is carried by column order (see `orderedBuckets`)
 * and label wording (see `bucketHeader`), never by color.
 */
const RESULT_STYLE: Record<Bucket, { bg: string; fg: string; dot: string }> = {
  Agree: { bg: C.shell, fg: C.ink, dot: C.body },
  Neutral: { bg: C.shell, fg: C.ink, dot: C.body },
  Disagree: { bg: C.shell, fg: C.ink, dot: C.body },
  "No record": { bg: C.shell, fg: C.muted, dot: C.muted },
};

/**
 * The answer picker (Disagree/Neutral/Agree, in the question box) --
 * app-layout-v2 phase 3 redesign. All three render identically at rest,
 * Neutral included: the earlier "tertiary" demoted treatment for Neutral
 * (smaller, lower-contrast, visually subordinate) is gone, since a picker
 * shouldn't visually pre-judge which of the three answers is the normal
 * one before the reader picks. No icon on the button either -- the earlier
 * ring/dot is gone too. Selection is carried entirely by a navy fill, a
 * cream label, and a rust rule along the top edge, identical for whichever
 * of the three is picked; this is still deliberately not the shared `Chip`
 * from ui.tsx, whose selected state (solid ink fill) doesn't carry a rule
 * accent and reads as a generic filter toggle rather than a picked answer.
 */
function AnswerChip({ on, onClick, children }: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: "1 1 0",
        minWidth: 110,
        padding: "12px 16px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: on ? 600 : 500,
        textAlign: "center",
        cursor: "pointer",
        background: on ? C.navy : C.white,
        color: on ? C.cream : C.ink,
        borderLeft: `1px solid ${on ? C.navy : "rgba(21,21,21,0.16)"}`,
        borderRight: `1px solid ${on ? C.navy : "rgba(21,21,21,0.16)"}`,
        borderBottom: `1px solid ${on ? C.navy : "rgba(21,21,21,0.16)"}`,
        borderTop: `3px solid ${on ? C.rust : "rgba(21,21,21,0.16)"}`,
      }}
    >
      {children}
    </button>
  );
}

type RailStatus = "done" | "current" | "upcoming";

/**
 * Flat, single-stroke status glyphs for the progress rail below -- the same
 * no-filled-shapes convention as the rest of the app's icons. "Done" and
 * "current" both draw in navy; "upcoming" draws in the same muted tone "No
 * record" gets elsewhere -- not-yet-reached is a state of the reader's own
 * progress, not a judgment, so it doesn't get the navy treatment.
 */
function RailIcon({ status }: { status: RailStatus }) {
  if (status === "done") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden style={{ flex: "0 0 14px" }}>
        <path d="M3 7.2 L6 10.2 L11 4" stroke={C.navy} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "current") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden style={{ flex: "0 0 14px" }}>
        <circle cx="7" cy="7" r="5.4" stroke={C.navy} strokeWidth="1.6" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden style={{ flex: "0 0 14px" }}>
      <circle cx="7" cy="7" r="5.4" stroke={C.faint} strokeWidth="1.4" />
    </svg>
  );
}

interface RailRow {
  id: string;
  label: string;
  status: RailStatus;
  onClick: () => void;
}

// Matches AppShell's own contextual-rail width (RAIL_WIDTH) -- kept as its
// own constant here rather than imported, since this rail is page-local
// (see StanceRail's doc comment) and not actually driven by that mechanism.
const STANCE_RAIL_WIDTH = 200;

/**
 * Stance Check's progress rail -- app-layout-v2 phase 3, page-local rather
 * than routed through AppShell's contextual rail, the same call FeedView's
 * Type filter rail made in phase 1 (see TYPE_RAIL_WIDTH's doc comment
 * there): that rail is built for scroll-spy jump links across a long page,
 * and this is a linear stepper through a fixed set of rows -- questions
 * while answering, findings on the completion screen -- with its own
 * done/current/upcoming status per row that `SectionJumpList` doesn't
 * model. One shared component so both screens present the same visual
 * language; see the two call sites below for how each builds its rows.
 */
function StanceRail({ rows }: { rows: RailRow[] }) {
  return (
    <nav aria-label="Progress" style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {rows.map((row) => (
        <button
          key={row.id}
          type="button"
          onClick={row.onClick}
          aria-current={row.status === "current" ? "true" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            width: "100%",
            textAlign: "left",
            padding: "8px 10px",
            borderRadius: 7,
            border: 0,
            background: row.status === "current" ? C.hover : "transparent",
            color: row.status === "upcoming" ? C.muted : C.ink,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          <RailIcon status={row.status} />
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.label}
          </span>
        </button>
      ))}
    </nav>
  );
}

/**
 * Column order for one question's results, driven by the user's own answer:
 * whichever bucket matches the user's pick leads, then the true opposite of
 * that pick, then the remaining stance, so answering Agree surfaces Agree,
 * Disagree, Neutral -- not Agree, Neutral, Disagree, which buried the actual
 * opposite behind the least interesting bucket. A Neutral answer has no
 * true opposite (Agree and Disagree are equally "not neutral"), so it keeps
 * its own bucket first and leaves Agree/Disagree in their natural order.
 * "No record" is never a grid column (see 1.3's collapsed line) so it isn't
 * part of this ordering at all.
 */
function orderedBuckets(userAnswer: StanceCheckAnswer): StanceCheckAnswer[] {
  if (userAnswer === "Neutral") return ["Neutral", "Agree", "Disagree"];
  const opposite: StanceCheckAnswer = userAnswer === "Agree" ? "Disagree" : "Agree";
  return [userAnswer, opposite, "Neutral"];
}

/**
 * Second-person column headers so the grid reads as a finding about the
 * user rather than a sorting bucket. Only meaningful relative to the user's
 * own answer: the bucket that matches it is framed as agreement, its true
 * opposite (only defined for an Agree/Disagree answer) as difference, and
 * the third bucket keeps its plain stance name.
 */
function bucketHeader(bucket: StanceCheckAnswer, userAnswer: StanceCheckAnswer): string {
  if (bucket === userAnswer) return "Where you match";
  const opposite: StanceCheckAnswer | null = userAnswer === "Agree" ? "Disagree" : userAnswer === "Disagree" ? "Agree" : null;
  if (bucket === opposite) return "Where you differ";
  return bucket;
}

interface Candidacy {
  politicianId: string;
  name: string;
  party: Party;
  office: string;
  district?: string;
}

/**
 * Stance Check — a short series of statements built from the same shared
 * `topics` list HUSH Guide's own setup step fills in (and "My Top Issues" in
 * the account menu ranks) -- not to be confused with Issue Finder, the
 * separate instrument that produces `topics` in the first place. Each issue
 * becomes one specific statement; the user answers Agree / Neutral /
 * Disagree directly, for immediately seeing which politicians actually
 * running in their races (the same
 * candidate set `Race`/`RACES` already defines for Your Ballot, HUSH Guide
 * and Compare) recorded the same stance, sourced. There is deliberately no
 * rolled-up score anywhere on this page — each question's breakdown stands
 * on its own, and the progress rail (see `StanceRail`) is a review index
 * letting you jump back to any question, not a result in itself. Three
 * points, not five: an earlier pass here briefly
 * offered Strongly disagree/Disagree/Unsure/Agree/Strongly agree and
 * collapsed that to Agree/Neutral/Disagree at read time, matching the
 * marketing site's spec. The app has since deliberately reverted to storing
 * the three-value answer directly -- a sourced candidate stance is binary
 * to begin with, so a five-point pick on the user's side implied a
 * precision the underlying data never had. This is a standing divergence
 * from the marketing site, not a pending fix.
 */
export default function StanceCheckView({
  politicians,
  races,
  topicPool,
  statements,
  positions,
  checks,
}: {
  politicians: Politician[];
  races: Race[];
  topicPool: string[];
  statements: Record<string, string>;
  positions: Record<string, Record<string, StanceCheckPosition>>;
  /** Published fact-checks, so a candidate's quote in the reveal can carry
   * its verdict when one exists for that exact quote — see CandidateCard. */
  checks: FactCheck[];
}) {
  const { topics } = usePrefs();
  // Mirrors GuideView's own `manualStep` pattern: once the picker is shown
  // or dismissed on purpose, stay on that choice rather than reacting to
  // every `topics` toggle — otherwise the picker would vanish out from
  // under the user the instant they check the first box.
  const [showPicker, setShowPicker] = useState<boolean | null>(null);
  const picking = showPicker ?? topics.length === 0;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StanceCheckAnswer>>({});

  const knownIds = new Set(politicians.map((p) => p.id));

  // Every candidate across every seeded race, with the office/district they
  // are actually running for — the same candidate set Your Ballot, HUSH
  // Guide and Compare already use, not a generic national list.
  const candidacies: Candidacy[] = races.flatMap((race) => {
    const { office, district } = parseRaceTitle(race.title);
    return race.candidates.map((c) => ({
      politicianId: c.politicianId,
      name: c.name,
      party: c.party,
      office,
      district,
    }));
  });

  if (picking) {
    return (
      <div style={{ padding: "24px 28px" }}>
        <IssuesStep
          topicPool={topicPool}
          hasGuide={false}
          onContinue={() => setShowPicker(false)}
          kicker="Stance Check"
          title="Pick the issues you want to check"
          description={
            <>
              Stance Check turns each issue you pick into one specific statement and shows you
              which politicians on your ballot agree or disagree — up to 10 statements, one per
              issue. This is the same list as HUSH Guide and &quot;My Top Issues&quot; in your
              account menu, so picking issues here updates them too, and vice versa.
            </>
          }
          continueLabel="Start Stance Check"
        />
      </div>
    );
  }

  const total = topics.length;
  // Clamped rather than stored: if the user edits the issue list down to
  // fewer entries mid-run, this keeps the view in bounds without a
  // separate effect just to re-sync `index`.
  const at = Math.min(index, total);
  const done = at >= total;
  const issue = done ? undefined : topics[at];
  const answer = issue ? answers[issue] : undefined;

  function pickAnswer(a: StanceCheckAnswer) {
    if (!issue) return;
    setAnswers((prev) => ({ ...prev, [issue]: a }));
  }

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <Kicker>Stance Check</Kicker>
        <Display size={25}>
          {done ? `You've gone through your ${total} issue${total === 1 ? "" : "s"}` : `Question ${at + 1} of ${total}`}
        </Display>
        <button
          type="button"
          className="link-quiet"
          onClick={() => setShowPicker(true)}
          style={{
            marginLeft: "auto",
            border: 0,
            background: "transparent",
            color: C.navy,
            fontSize: 12,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: "pointer",
            padding: 6,
          }}
        >
          Edit issues
        </button>
      </div>

      {done ? (
        <StanceSummary
          topics={topics}
          answers={answers}
          candidacies={candidacies}
          positions={positions}
          onReviewFromStart={() => setIndex(0)}
        />
      ) : (
        // Three columns (app-layout-v2 phase 3): the progress rail (one row
        // per issue, done/current/upcoming -- replaces the old "Your
        // answers" strip that used to sit at the page bottom rather than
        // duplicating it), the question itself in the center, and the
        // candidate breakdown beside it on the right instead of stacked
        // below -- it collapses to one column on its own inside a rail-width
        // aside (see StatementBreakdown's `minmax(260px,1fr)` grid), so no
        // layout change was needed there, only where it's rendered.
        <div className="stack-row" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <aside style={{ width: STANCE_RAIL_WIDTH, flex: `0 0 ${STANCE_RAIL_WIDTH}px` }}>
            <StanceRail
              rows={topics.map((q, i) => ({
                id: q,
                label: q,
                status: answers[q] ? "done" : i === at ? "current" : "upcoming",
                onClick: () => setIndex(i),
              }))}
            />
          </aside>

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <Card style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <Kicker color={C.muted}>{issue}</Kicker>
              <Display size={22} style={{ lineHeight: 1.3 }}>
                {statements[issue!]}
              </Display>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <AnswerChip on={answer === "Disagree"} onClick={() => pickAnswer("Disagree")}>
                  Disagree
                </AnswerChip>
                <AnswerChip on={answer === "Neutral"} onClick={() => pickAnswer("Neutral")}>
                  Neutral
                </AnswerChip>
                <AnswerChip on={answer === "Agree"} onClick={() => pickAnswer("Agree")}>
                  Agree
                </AnswerChip>
              </div>
            </Card>

            {answer ? (
              <RustButton
                onClick={() => setIndex(at + 1)}
                style={{ alignSelf: "flex-start", padding: "11px 18px" }}
              >
                {at + 1 === total ? "Finish" : "Next question →"}
              </RustButton>
            ) : null}
          </div>

          <aside style={{ width: 280, flex: "0 0 280px", minWidth: 260 }}>
            {answer ? (
              <StatementBreakdown
                issue={issue!}
                candidacies={candidacies}
                positions={positions}
                knownIds={knownIds}
                userAnswer={answer}
                checks={checks}
              />
            ) : (
              <Card style={{ padding: 16 }}>
                <span style={{ fontSize: 12.5, color: C.muted, fontStyle: "italic" }}>
                  Pick an answer to see where candidates on your ballot stand.
                </span>
              </Card>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function StatementBreakdown({
  issue,
  candidacies,
  positions,
  knownIds,
  userAnswer,
  checks,
}: {
  issue: string;
  candidacies: Candidacy[];
  positions: Record<string, Record<string, StanceCheckPosition>>;
  knownIds: Set<string>;
  userAnswer: StanceCheckAnswer;
  checks: FactCheck[];
}) {
  const grouped = new Map<Bucket, { candidacy: Candidacy; position?: StanceCheckPosition }[]>(
    BUCKETS.map((b) => [b, []]),
  );
  for (const candidacy of candidacies) {
    const position = positions[candidacy.politicianId]?.[issue];
    const bucket: Bucket = position?.stance ?? "No record";
    grouped.get(bucket)!.push({ candidacy, position });
  }
  const noRecord = grouped.get("No record")!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          gap: 14,
        }}
      >
        {orderedBuckets(userAnswer).map((bucket) => {
          const entries = grouped.get(bucket)!;
          const style = RESULT_STYLE[bucket];
          const header = bucketHeader(bucket, userAnswer);
          return (
            <Card key={bucket} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: style.dot }} />
                <span style={{ fontFamily: cond, fontSize: 15, letterSpacing: "0.04em" }}>{header}</span>
                <Pill bg={style.bg} fg={style.fg} style={{ marginLeft: "auto" }}>
                  {entries.length}
                </Pill>
              </div>

              {entries.length === 0 ? (
                <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>Nobody on your ballot, so far.</span>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {entries.map(({ candidacy, position }) => (
                    <CandidateCard
                      key={candidacy.politicianId}
                      candidacy={candidacy}
                      position={position}
                      known={knownIds.has(candidacy.politicianId)}
                      checks={checks}
                    />
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* "No record" (see 1.3) is deliberately not a fourth grid column --
          six-plus of thirteen candidates having no public position on a
          given statement is honest and worth saying, but it doesn't deserve
          the same prime real estate as an actual stance. It collapses to
          one line instead, expandable on demand. */}
      {noRecord.length > 0 ? <NoRecordDisclosure entries={noRecord} knownIds={knownIds} /> : null}
    </div>
  );
}

function NoRecordDisclosure({
  entries,
  knownIds,
}: {
  entries: { candidacy: Candidacy; position?: StanceCheckPosition }[];
  knownIds: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          border: 0,
          background: "transparent",
          padding: 0,
          fontSize: 12.5,
          color: C.muted,
          cursor: "pointer",
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        {entries.length} candidate{entries.length === 1 ? "" : "s"} have no public position on this.{" "}
        {open ? "Hide them." : "Show them."}
      </button>

      {open ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {entries.map(({ candidacy }) => {
            const name = stripPartySuffix(candidacy.name);
            const label = `${name}, ${candidacy.office}${candidacy.district ? `, ${candidacy.district}` : ""}`;
            const inner = (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  borderRadius: 14,
                  background: C.shell,
                  fontSize: 12,
                  color: C.body,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: PARTY[candidacy.party] }} />
                {name}
              </span>
            );
            return knownIds.has(candidacy.politicianId) ? (
              <Link
                key={candidacy.politicianId}
                href={`/politician/${candidacy.politicianId}`}
                aria-label={label}
                style={{ textDecoration: "none" }}
              >
                {inner}
              </Link>
            ) : (
              <span key={candidacy.politicianId} aria-label={label}>
                {inner}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/**
 * One candidate's card in a results column -- 1.1's delayed party reveal.
 * Name, office, district, quote, source, and date all render immediately;
 * party is the one thing that's held back and animated in, after a short
 * delay or on hover/tap/keyboard focus of the card, whichever comes first.
 * That's a genuine transparency delay, not a transparency gap: the party
 * dot and label stay in the DOM (opacity only, never `display: none` or
 * `aria-hidden`) from first render, so a screen reader announces them
 * immediately even while they're still visually faded out for a sighted
 * user. Nothing else on the card animates.
 */
function CandidateCard({
  candidacy,
  position,
  known,
  checks,
}: {
  candidacy: Candidacy;
  position?: StanceCheckPosition;
  known: boolean;
  checks: FactCheck[];
}) {
  const [revealed, setRevealed] = useState(false);
  // Attached only when a published verdict checks this exact quote, not just
  // this candidate on this topic — see phase 3.2: "do not surface unrelated
  // verdicts for that person here." A candidate can have an unrelated
  // fact-check on the same issue with nothing to do with this specific
  // statement, so the match has to be on the quote itself.
  const check = position ? checks.find(
    (c) => c.politicianId === candidacy.politicianId && c.claim === position.excerpt,
  ) : undefined;
  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 1200);
    return () => clearTimeout(timer);
  }, []);
  const reveal = () => setRevealed(true);
  const name = stripPartySuffix(candidacy.name);

  const partyBadge = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        color: C.muted,
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateX(0)" : "translateX(-4px)",
        transition: "opacity 260ms ease, transform 260ms ease",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: PARTY[candidacy.party] }} />
      {PARTY_LABEL[candidacy.party]}
    </span>
  );

  return (
    <div
      onMouseEnter={reveal}
      onFocus={reveal}
      onTouchStart={reveal}
      onClick={reveal}
      style={{ display: "flex", flexDirection: "column", gap: 3 }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
        {known ? (
          <Link
            href={`/politician/${candidacy.politicianId}`}
            style={{ fontFamily: cond, fontSize: 14, color: C.ink, textDecoration: "none" }}
          >
            {name}
          </Link>
        ) : (
          <span style={{ fontFamily: cond, fontSize: 14, color: C.body }}>{name}</span>
        )}
        {partyBadge}
      </div>
      <span style={{ fontSize: 11, color: C.muted }}>
        {candidacy.office}
        {candidacy.district ? ` · ${candidacy.district}` : ""}
      </span>
      {position ? (
        <>
          <p style={{ margin: 0, fontSize: 12, color: C.body, lineHeight: 1.5, fontStyle: "italic" }}>
            &ldquo;{position.excerpt}&rdquo;
          </p>
          <span style={{ fontSize: 11, color: C.muted }}>
            {position.sourceTitle} · {position.sourceType}
            {position.date ? ` · ${position.date}` : ""}
          </span>
          <a
            href={position.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: C.navy }}
          >
            View Original Source →
          </a>
          {check ? (
            <div style={{ paddingTop: 4 }}>
              <FactCheckCard check={check} showSources={false} />
            </div>
          ) : null}
        </>
      ) : (
        <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>No official position found</span>
      )}
    </div>
  );
}

/** One (issue, candidate) pair where the user's answer matched a candidate's
 * sourced stance -- the atomic unit `StanceSummary` below rolls up into the
 * cross-party headline and the "strongest surprise." */
interface Match {
  issue: string;
  candidacy: Candidacy;
  position: StanceCheckPosition;
}

function partyCountList(counts: { party: Party; count: number }[]): string {
  const parts = counts.map(({ party, count }) => `${count} ${count === 1 ? PARTY_LABEL[party] : `${PARTY_LABEL[party]}s`}`);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

/**
 * Stance Check's end-of-run screen (see 1.5) -- the payoff for the whole
 * feature, so it leads with the finding rather than a generic wrap-up.
 * Every number here is computed from the user's own answers and the same
 * sourced `STANCE_POSITIONS` the per-question breakdown already used; there
 * is still no score anywhere on this screen, only findings, in priority
 * order: the cross-party headline (if the data actually produced one), the
 * single strongest surprise, the issues where nobody on the ballot matched,
 * and one way back into HUSH Guide.
 */
function StanceSummary({
  topics,
  answers,
  candidacies,
  positions,
  onReviewFromStart,
}: {
  topics: string[];
  answers: Record<string, StanceCheckAnswer>;
  candidacies: Candidacy[];
  positions: Record<string, Record<string, StanceCheckPosition>>;
  onReviewFromStart: () => void;
}) {
  const router = useRouter();
  const answeredTopics = topics.filter((t) => answers[t]);

  // Every (issue, candidate) pair where the candidate's sourced stance
  // matches what the user picked -- "matched" means the same stance, not
  // just an Agree/Agree pair, since a shared Disagree or Neutral is just as
  // much a real match.
  const matches: Match[] = [];
  for (const issue of answeredTopics) {
    for (const candidacy of candidacies) {
      const position = positions[candidacy.politicianId]?.[issue];
      if (position && position.stance === answers[issue]) {
        matches.push({ issue, candidacy, position });
      }
    }
  }

  const matchedIdsByParty: Record<Party, Set<string>> = { D: new Set(), R: new Set(), I: new Set() };
  for (const m of matches) matchedIdsByParty[m.candidacy.party].add(m.candidacy.politicianId);
  const partyCounts = (["D", "R", "I"] as Party[])
    .map((party) => ({ party, count: matchedIdsByParty[party].size }))
    .filter((p) => p.count > 0);
  const crossesParty = partyCounts.length >= 2;

  // The strongest surprise: a match against the party the user matched with
  // *least* overall -- among parties matched at all, never a party with
  // zero matches, since there's nothing to surprise the user with there.
  const leastMatchedParty = crossesParty
    ? partyCounts.reduce((min, p) => (p.count < min.count ? p : min))
    : null;
  const surprise = leastMatchedParty ? matches.find((m) => m.candidacy.party === leastMatchedParty.party) : undefined;

  const noMatchIssues = answeredTopics.filter((issue) => !matches.some((m) => m.issue === issue));

  // The completion screen's own progress rail (app-layout-v2 phase 3) --
  // "surprise" and "no-match" are both conditional on the data, same as
  // before. Every row shows as done: unlike the question rail, there's no
  // remaining "current" or "upcoming" row here -- everything on this screen
  // is already rendered and available the moment it mounts, so "done" is
  // just an honest way to say "here, already found" rather than implying a
  // sequence still in progress. Clicking a row scrolls to it (`jumpToSection`)
  // rather than changing which question is showing, since these are findings
  // within one card, not separate questions to answer.
  const summaryRows: RailRow[] = [
    { id: "overview", label: "Overview", status: "done", onClick: () => jumpToSection("overview") },
  ];
  if (surprise) {
    summaryRows.push({ id: "surprise", label: "Strongest surprise", status: "done", onClick: () => jumpToSection("surprise") });
  }
  if (noMatchIssues.length > 0) {
    summaryRows.push({ id: "no-match", label: "No match", status: "done", onClick: () => jumpToSection("no-match") });
  }

  return (
    <div className="stack-row" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      <aside style={{ width: STANCE_RAIL_WIDTH, flex: `0 0 ${STANCE_RAIL_WIDTH}px` }}>
        <StanceRail rows={summaryRows} />
      </aside>

      <Card style={{ flex: 1, minWidth: 0, maxWidth: 640, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
        <div id="overview" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Kicker color={C.muted}>Your Stance Check, so far</Kicker>

        {crossesParty ? (
          <Display size={22} style={{ lineHeight: 1.3 }}>
            You agreed with {partyCountList(partyCounts)}.
          </Display>
        ) : partyCounts.length === 1 ? (
          <Display size={22} style={{ lineHeight: 1.3 }}>
            You agreed with {partyCountList(partyCounts)} — no matches outside that party yet.
          </Display>
        ) : (
          <Display size={22} style={{ lineHeight: 1.3 }}>
            You didn&apos;t match with anyone on your ballot on the issues you answered.
          </Display>
        )}
        </div>

        {surprise ? (
          <div id="surprise" style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4, borderTop: `1px solid ${C.line}` }}>
            <Kicker size={11}>Your strongest surprise</Kicker>
            <span style={{ fontSize: 13, color: C.ink, lineHeight: 1.5 }}>
              On <strong>{surprise.issue}</strong>, you matched {PARTY_LABEL[surprise.candidacy.party]}{" "}
              <Link href={`/politician/${surprise.candidacy.politicianId}`} style={{ color: C.navy }}>
                {stripPartySuffix(surprise.candidacy.name)}
              </Link>{" "}
              — the party you matched with least overall.
            </span>
            <p style={{ margin: 0, fontSize: 12, color: C.body, lineHeight: 1.5, fontStyle: "italic" }}>
              &ldquo;{surprise.position.excerpt}&rdquo;
            </p>
          </div>
        ) : null}

        {noMatchIssues.length > 0 ? (
          <div id="no-match" style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4, borderTop: `1px solid ${C.line}` }}>
            <Kicker size={11}>Where nobody on your ballot matched you</Kicker>
            <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{noMatchIssues.join(", ")}</span>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 4 }}>
          <RustButton onClick={() => router.push("/hush-guide")} style={{ padding: "11px 18px" }}>
            Go to HUSH Guide →
          </RustButton>
          <button
            type="button"
            className="link-quiet"
            onClick={onReviewFromStart}
            style={{
              border: 0,
              background: "transparent",
              color: C.navy,
              fontSize: 13,
              cursor: "pointer",
              padding: "11px 4px",
            }}
          >
            Review from the start
          </button>
        </div>
      </Card>
    </div>
  );
}
