"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { C, PARTY, PARTY_LABEL, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { parseRaceTitle, stripPartySuffix } from "@/lib/guide";
import { jumpToSection } from "@/lib/sectionNav";
import type { FactCheck, Party, Politician, Race, StanceCheckAnswer, StanceCheckPosition } from "@/lib/types";
import { Card, Display, GhostButton, Kicker, Pill, RustButton } from "@/components/ui";
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
  whyItMatters,
  positions,
  checks,
}: {
  politicians: Politician[];
  races: Race[];
  topicPool: string[];
  statements: Record<string, string>;
  /** Optional per-issue "why this matters" context, keyed the same as
   * `statements` -- absent or missing an issue's key is normal (see
   * STANCE_WHY_MATTERS's own doc comment), and the block simply doesn't
   * render for that question. */
  whyItMatters?: Record<string, string>;
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
      <StanceCheckHero />

      {/* This header (kicker + "Question X of Y" / "Edit issues") is
          question-screen-only now -- on the completion screen it read as a
          third "Stance Check" label stacked right under the hero's own and
          right above StanceSummary's "Here's where you stand." headline.
          "Edit issues" isn't reachable directly from the results screen
          anymore as a result; "← Back to questions" (StanceSummary, below)
          gets you back to the question view, where this row -- and Edit
          issues with it -- is right there again. */}
      {done ? null : (
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <Kicker>Stance Check</Kicker>
          <span style={{ fontSize: 12.5, color: C.muted, letterSpacing: "0.02em" }}>
            Question {at + 1} of {total}
          </span>
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
      )}

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
            <Card style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  padding: "10px 16px",
                  background: C.slateFill,
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <Kicker color={C.muted}>{issue}</Kicker>
              </div>
              <div style={{ padding: "26px 24px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
                {/* 22 -> 26px is +18%, inside the requested 15-20% range, and
                    now clearly the largest text on the question screen */}
                <Display size={26} style={{ lineHeight: 1.3 }}>
                  {statements[issue!]}
                </Display>

                {whyItMatters?.[issue!] ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Kicker style={{ fontSize: 11 }}>Why this matters</Kicker>
                    <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
                      {whyItMatters[issue!]}
                    </span>
                  </div>
                ) : null}

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

/**
 * Stance Check's hero banner -- same shell/scrim device as Feed's FeedHero
 * and GuideView.tsx's GuideHero. Only rendered once the reader is past the
 * issue picker (see the `picking` gate above) -- that's a short setup
 * screen, same reasoning as skipping this on Guide's AddressStep/IssuesStep.
 */
function StanceCheckHero() {
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
        src="/images/stance-check-hero.jpg"
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
        <Kicker color={C.tan}>Stance Check</Kicker>
        <Display size={28} color={C.sand}>
          Same questions. Real positions. No spin.
        </Display>
      </div>
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
 * One row in the results screen's "Next steps" card -- a navigation row,
 * not a CTA button, per the spec: a small icon tile, a label, a one-line
 * description, and a trailing chevron. Either navigates directly (href) or
 * runs a handler (onClick, used for the in-page jump to "Your full
 * results").
 */
function NextActionRow({
  href,
  label,
  desc,
  onClick,
}: {
  href?: string;
  label: string;
  desc: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: C.shell,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 28px",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M4 2.5L11 8L4 13.5" stroke={C.navy} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13.5, fontWeight: 500, color: C.ink }}>{label}</span>
        <span style={{ fontSize: 11.5, color: C.muted }}>{desc}</span>
      </span>
      <span style={{ fontSize: 15, color: C.faint }} aria-hidden>
        ›
      </span>
    </>
  );
  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 4px",
    textDecoration: "none",
    color: "inherit",
    cursor: "pointer",
    border: 0,
    background: "transparent",
    width: "100%",
    textAlign: "left" as const,
  };
  return href ? (
    <Link href={href} style={rowStyle}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} style={rowStyle}>
      {content}
    </button>
  );
}

/**
 * Stance Check's end-of-run screen (see 1.5) -- the payoff for the whole
 * feature. Every number here is computed from the user's own answers and
 * the same sourced `STANCE_POSITIONS` the per-question breakdown already
 * used -- there is still no score anywhere on this screen, only findings:
 * overall alignment by party, the single strongest surprise, the issues
 * where nobody on the ballot matched, and a full breakdown for anyone who
 * wants it. app-layout-v2 phase 4: this is an editorial layout (headline,
 * then distinct cards, then a two-column body) rather than the phase 3
 * single-card-plus-rail treatment -- the old `StanceRail` jump list doesn't
 * carry over here, since a jump list between sections only earns its space
 * when the sections are long and undifferentiated, and every finding here
 * is now already its own clearly-labeled card. The rail is untouched on
 * the per-question screen above, where it's still doing real work.
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
  const { picks, setPicks } = usePrefs();
  const answeredTopics = topics.filter((t) => answers[t]);

  // Every (issue, candidate) pair where the candidate's sourced stance
  // matches what the user picked -- unchanged from before.
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
  // least overall, among parties matched at all.
  const leastMatchedParty = crossesParty
    ? partyCounts.reduce((min, p) => (p.count < min.count ? p : min))
    : null;
  const surprise = leastMatchedParty ? matches.find((m) => m.candidacy.party === leastMatchedParty.party) : undefined;

  const noMatchIssues = answeredTopics.filter((issue) => !matches.some((m) => m.issue === issue));

  // "Your Overall Alignment" always shows all three parties, zero-count
  // ones included -- a party you matched nobody in is itself a finding,
  // and dropping it would make the card's width jump around depending on
  // how many parties happened to match.
  const countByParty: Record<Party, number> = { D: 0, R: 0, I: 0 };
  for (const p of partyCounts) countByParty[p.party] = p.count;

  // Same pattern PoliticianView's own "Compare" link already uses --
  // load the surprise candidate into the existing compare-picks slots and
  // go straight to /compare, rather than a generic unfocused link there.
  function goToComparison(politicianId: string) {
    setPicks([politicianId, ...picks.filter((id) => id !== politicianId)].slice(0, 3));
    router.push("/compare");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <button
        type="button"
        className="link-quiet"
        onClick={onReviewFromStart}
        style={{ alignSelf: "flex-start", border: 0, background: "transparent", color: C.muted, fontSize: 12.5, cursor: "pointer", padding: 0 }}
      >
        ← Back to questions
      </button>

      {/* Headline block -- deliberately not inside a card, per the spec.
          Subhead is new copy, not the spec's suggested line: that exact
          line ("Same questions. Real positions. No spin.") is already on
          screen in the hero banner directly above this component. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Kicker>Stance Check</Kicker>
        <Display size={30} style={{ lineHeight: 1.15 }}>
          Here&apos;s where you stand.
        </Display>
        <span style={{ fontSize: 14, color: C.muted, maxWidth: 560, lineHeight: 1.5 }}>
          Based on your answers, here&apos;s where you and the candidates on your ballot actually
          agree — and where you don&apos;t.
        </span>
      </div>

      {/* Your Overall Alignment -- one wide card, three neutral columns.
          No party color anywhere in this card: no red/blue fills, no dots,
          no percentages, no "closest match" framing. */}
      <Card style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <Kicker>Your overall alignment</Kicker>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 24 }}>
          {(["D", "R", "I"] as Party[]).map((party) => {
            const count = countByParty[party];
            const plural = count === 1 ? PARTY_LABEL[party] : `${PARTY_LABEL[party]}s`;
            return (
              <div key={party} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Display size={34}>{count}</Display>
                <Kicker size={11}>{plural}</Kicker>
                <span style={{ fontSize: 12.5, color: C.body, lineHeight: 1.45 }}>
                  {count === 0
                    ? `You didn't match any ${plural} on the issues you answered.`
                    : `You aligned with ${count} ${plural.toLowerCase()} candidate${count === 1 ? "" : "s"}.`}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Two-column body: insight cards + full results on the left,
          "What this means" and "Next steps" on the right. */}
      <div className="stack-row" style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          {surprise || noMatchIssues.length > 0 ? (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {surprise ? (
                <Card style={{ flex: "1 1 300px", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                  <Kicker size={11}>Your strongest surprise</Kicker>
                  <span style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.5 }}>
                    On <strong>{surprise.issue}</strong>, you matched {PARTY_LABEL[surprise.candidacy.party]}{" "}
                    <Link href={`/politician/${surprise.candidacy.politicianId}`} style={{ color: C.navy }}>
                      {stripPartySuffix(surprise.candidacy.name)}
                    </Link>{" "}
                    — the party you matched with least overall.
                  </span>
                  <p style={{ margin: 0, fontSize: 12.5, color: C.body, lineHeight: 1.5, fontStyle: "italic" }}>
                    &ldquo;{surprise.position.excerpt}&rdquo;
                  </p>
                  <button
                    type="button"
                    className="link-quiet"
                    onClick={() => goToComparison(surprise.candidacy.politicianId)}
                    style={{ alignSelf: "flex-start", border: 0, background: "transparent", color: C.rust, fontSize: 12.5, cursor: "pointer", padding: 0, marginTop: 2 }}
                  >
                    See full comparison →
                  </button>
                </Card>
              ) : null}
              {noMatchIssues.length > 0 ? (
                <Card style={{ flex: "1 1 300px", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                  <Kicker size={11}>Where nobody on your ballot matched you</Kicker>
                  <span style={{ fontSize: 13.5, color: C.body, lineHeight: 1.5 }}>{noMatchIssues.join(", ")}</span>
                  <Link href="/hush-guide" style={{ fontSize: 12.5, color: C.rust }}>
                    Explore these issues →
                  </Link>
                </Card>
              ) : null}
            </div>
          ) : null}

          {/* New: a plain, complete breakdown -- every answered issue and
              who matched, built from the same `matches` array above. This
              is what "View your full results" (Next Steps, right) jumps
              to. */}
          <Card id="full-results" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <Kicker>Your full results</Kicker>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {answeredTopics.map((issueName, i) => {
                const issueMatches = matches.filter((m) => m.issue === issueName);
                return (
                  <div
                    key={issueName}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      paddingBottom: 12,
                      borderBottom: i < answeredTopics.length - 1 ? `1px solid ${C.line}` : "none",
                    }}
                  >
                    <span style={{ fontFamily: cond, fontSize: 14, color: C.ink }}>{issueName}</span>
                    {issueMatches.length === 0 ? (
                      <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>
                        No one on your ballot matched you here.
                      </span>
                    ) : (
                      <span style={{ fontSize: 12.5, color: C.body }}>
                        Matched {issueMatches.map((m) => stripPartySuffix(m.candidacy.name)).join(", ")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <aside style={{ width: 300, flex: "0 0 300px", display: "flex", flexDirection: "column", gap: 20 }}>
          <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <Kicker>What this means</Kicker>
            <p style={{ margin: 0, fontSize: 13, color: C.body, lineHeight: 1.6 }}>
              {crossesParty
                ? `Your answers matched candidates across more than one party — ${partyCountList(partyCounts)}. That's not a contradiction. It means your views don't map neatly onto either party's platform.`
                : partyCounts.length === 1
                ? `Every match you found came from ${PARTY_LABEL[partyCounts[0].party]} candidates on your ballot. That doesn't mean everyone else is wrong on everything — only that, on the issues you answered, their sourced positions didn't line up with yours.`
                : `None of your answers matched a sourced position from anyone on your ballot. That's a real finding, not a gap in the data — it means the candidates running haven't taken your side on these issues, at least not on the record.`}
            </p>
            <div>
              <p style={{ margin: "0 0 8px 0", fontFamily: cond, fontSize: 18, color: C.ink, lineHeight: 1.3 }}>
                &ldquo;Your views are yours. Know where they stand.&rdquo;
              </p>
              <span style={{ display: "block", width: 36, height: 2, background: C.rust }} />
            </div>
          </Card>

          <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 2 }}>
            <Kicker style={{ marginBottom: 8 }}>Next steps</Kicker>
            <NextActionRow href="/hush-guide" label="Go to HUSH Guide" desc="See the full picture, race by race" />
            <NextActionRow href="/compare" label="Compare candidates" desc="Put anyone on your ballot side by side" />
            <NextActionRow
              label="View your full results"
              desc="Every issue you answered, every match found"
              onClick={() => jumpToSection("full-results")}
            />
          </Card>
        </aside>
      </div>

      {/* Bottom, full-width -- the spec's "want to revisit your answers"
          section. Wired to the same onReviewFromStart as the top link:
          it's still the one real capability this screen has (jump back to
          question 1, every prior answer pre-filled so it reads as review,
          not a blank restart), not a second, different reset. */}
      <div
        style={{
          borderTop: `1px solid ${C.line}`,
          paddingTop: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Display size={16}>Want to revisit your answers?</Display>
          <span style={{ fontSize: 12, color: C.muted }}>
            You can update your answers anytime to see how your results change.
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <GhostButton onClick={onReviewFromStart}>Retake Stance Check</GhostButton>
          <RustButton onClick={() => router.push("/hush-guide")}>Go to HUSH Guide →</RustButton>
        </div>
      </div>
    </div>
  );
}
