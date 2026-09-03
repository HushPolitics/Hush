"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { parseRaceTitle } from "@/lib/guide";
import type { Politician, Race, StanceCheckAnswer, StanceCheckPosition } from "@/lib/types";
import { Card, Display, Kicker, Pill, RustButton } from "@/components/ui";
import { IssuesStep } from "./GuideView";

type Bucket = StanceCheckAnswer | "No record";
const BUCKETS: Bucket[] = ["Agree", "Neutral", "Disagree", "No record"];

/**
 * Same navy/tan/rust vocabulary `VERDICT_STYLE` uses for True/Misleading/
 * False (see theme.ts) — reused here rather than invented fresh, so a
 * candidate's stance reads with the same visual weight as a fact-check
 * verdict elsewhere in the app. "No record" reuses the neutral shell/muted
 * treatment `GUIDE_POSITIONS`' own gaps already use.
 */
const BUCKET_STYLE: Record<Bucket, { bg: string; fg: string; dot: string }> = {
  Agree: { bg: "rgba(37,55,70,0.10)", fg: C.navy, dot: C.navy },
  Neutral: { bg: "rgba(181,168,138,0.35)", fg: C.oliveDeep, dot: C.tan },
  Disagree: { bg: "rgba(156,63,50,0.10)", fg: C.rust, dot: C.rust },
  "No record": { bg: C.shell, fg: C.muted, dot: C.muted },
};

/**
 * The per-question results grid (StatementBreakdown) deliberately does NOT
 * use `BUCKET_STYLE`'s navy/tan/rust: that vocabulary is fine for the user's
 * own answer above (their own pick, no comparison implied), but coloring
 * *politicians'* Agree/Neutral/Disagree here would read as the UI signaling
 * who's "right" -- exactly what the no-score requirement says this feature
 * must not do. Agree/Neutral/Disagree all get one identical neutral ink/body
 * treatment; "No record" keeps the same muted/shell treatment the rest of
 * the app uses for "nothing sourced." Which group matters more is carried by
 * column order (see `orderedBuckets`), never by color.
 */
const RESULT_STYLE: Record<Bucket, { bg: string; fg: string; dot: string }> = {
  Agree: { bg: C.shell, fg: C.ink, dot: C.body },
  Neutral: { bg: C.shell, fg: C.ink, dot: C.body },
  Disagree: { bg: C.shell, fg: C.ink, dot: C.body },
  "No record": { bg: C.shell, fg: C.muted, dot: C.muted },
};

/**
 * The answer picker itself (Agree/Neutral/Disagree, in the question box)
 * gets the same no-color-coding treatment as the results grid below, and for
 * the same reason: a per-choice color there would still read as the UI
 * hinting which answer is "normal" before the user even picks. This is
 * deliberately not the shared `Chip` from ui.tsx -- Chip's selected state
 * inverts to a solid ink background, which would swallow a same-toned dot
 * into invisibility, so selection here is instead carried by the ring
 * (hollow outline -> solid navy fill) plus a bolder ink label, identical for
 * whichever of the three is picked. The "Your answers" review strip below
 * keeps its existing per-answer accent color -- it's reviewing the user's
 * own past picks, not a live choice between them, and the ask here is scoped
 * to the picker.
 */
function AnswerChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 20,
        fontSize: 13,
        fontWeight: on ? 600 : 500,
        whiteSpace: "nowrap",
        cursor: "pointer",
        background: on ? C.shell : "transparent",
        color: on ? C.ink : C.body,
        border: `1px solid ${on ? C.ink : "rgba(21,21,21,0.18)"}`,
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          boxSizing: "border-box",
          border: `1.5px solid ${on ? C.navy : C.faint}`,
          background: on ? C.navy : "transparent",
        }}
      />
      {children}
    </button>
  );
}

const ANSWER_RANK: Record<StanceCheckAnswer, number> = { Agree: 0, Neutral: 1, Disagree: 2 };

/**
 * Column order for one question's results, driven by the user's own answer
 * rather than a fixed Agree/Neutral/Disagree order: whichever bucket
 * matches the user's pick leads, then Neutral, then the opposing bucket --
 * so picking "Disagree" surfaces the politicians who also picked Disagree
 * first, not last, regardless of which answer was picked. "No record" has
 * no agreement signal to rank, so it always trails the other three.
 */
function orderedBuckets(userAnswer: StanceCheckAnswer): Bucket[] {
  const distance = (b: StanceCheckAnswer) => Math.abs(ANSWER_RANK[b] - ANSWER_RANK[userAnswer]);
  const comparison: StanceCheckAnswer[] = ["Agree", "Neutral", "Disagree"];
  return [...comparison.sort((a, b) => distance(a) - distance(b)), "No record"];
}

interface Candidacy {
  politicianId: string;
  name: string;
  office: string;
  district?: string;
}

/**
 * Stance Check — a short quiz built from the same `guideIssues` list HUSH
 * Guide's own setup step fills in. Each issue becomes one specific
 * statement; the user answers Agree / Neutral / Disagree and immediately
 * sees which politicians actually running in their races (the same
 * candidate set `Race`/`RACES` already defines for Your Ballot, HUSH Guide
 * and Compare) recorded the same stance, sourced. There is deliberately no
 * rolled-up score anywhere on this page — each question's breakdown stands
 * on its own, and the "Your answers" strip at the bottom is a review index,
 * not a result.
 */
export default function StanceCheckView({
  politicians,
  races,
  topicPool,
  statements,
  positions,
}: {
  politicians: Politician[];
  races: Race[];
  topicPool: string[];
  statements: Record<string, string>;
  positions: Record<string, Record<string, StanceCheckPosition>>;
}) {
  const { guideIssues } = usePrefs();
  // Mirrors GuideView's own `manualStep` pattern: once the picker is shown
  // or dismissed on purpose, stay on that choice rather than reacting to
  // every `guideIssues` toggle — otherwise the picker would vanish out from
  // under the user the instant they check the first box.
  const [showPicker, setShowPicker] = useState<boolean | null>(null);
  const picking = showPicker ?? guideIssues.length === 0;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StanceCheckAnswer>>({});

  const knownIds = new Set(politicians.map((p) => p.id));

  // Every candidate across every seeded race, with the office/district they
  // are actually running for — the same candidate set Your Ballot, HUSH
  // Guide and Compare already use, not a generic national list.
  const candidacies: Candidacy[] = races.flatMap((race) => {
    const { office, district } = parseRaceTitle(race.title);
    return race.candidates.map((c) => ({ politicianId: c.politicianId, name: c.name, office, district }));
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
              issue. This is the exact same list HUSH Guide uses, so picking issues here updates
              it there too, and vice versa.
            </>
          }
          continueLabel="Start Stance Check"
        />
      </div>
    );
  }

  const total = guideIssues.length;
  // Clamped rather than stored: if the user edits the issue list down to
  // fewer entries mid-quiz, this keeps the view in bounds without a
  // separate effect just to re-sync `index`.
  const at = Math.min(index, total);
  const done = at >= total;
  const issue = done ? undefined : guideIssues[at];
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
        <Card style={{ maxWidth: 640, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
            No score, no match percentage — just what you said next to who&apos;s on record saying
            the same or the opposite. Pick any question below to see its breakdown again.
          </span>
          <RustButton
            onClick={() => setIndex(0)}
            style={{ alignSelf: "flex-start", padding: "10px 16px", fontSize: 13 }}
          >
            Review from the start
          </RustButton>
        </Card>
      ) : (
        <Card style={{ maxWidth: 640, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <Kicker color={C.muted}>{issue}</Kicker>
          <Display size={22} style={{ lineHeight: 1.3 }}>
            {statements[issue!]}
          </Display>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["Agree", "Neutral", "Disagree"] as StanceCheckAnswer[]).map((a) => (
              <AnswerChip key={a} on={answer === a} onClick={() => pickAnswer(a)}>
                {a}
              </AnswerChip>
            ))}
          </div>
        </Card>
      )}

      {/* Breakdown: shown once the current question is answered, or for every
          answered question while reviewing from the completion state. */}
      {!done && issue && answer ? (
        <StatementBreakdown
          issue={issue}
          candidacies={candidacies}
          positions={positions}
          knownIds={knownIds}
          userAnswer={answer}
        />
      ) : null}

      {!done && issue && answer ? (
        <RustButton
          onClick={() => setIndex(at + 1)}
          style={{ alignSelf: "flex-start", padding: "11px 18px" }}
        >
          {at + 1 === total ? "Finish" : "Next question →"}
        </RustButton>
      ) : null}

      {total > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
          <Kicker color={C.muted}>Your answers</Kicker>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {guideIssues.map((q, i) => {
              const a = answers[q];
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => setIndex(i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 11px",
                    borderRadius: 16,
                    fontSize: 12,
                    border: `1px solid ${!done && i === at ? C.ink : C.line}`,
                    background: a ? BUCKET_STYLE[a].bg : C.white,
                    color: a ? BUCKET_STYLE[a].fg : C.muted,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: a ? BUCKET_STYLE[a].dot : C.muted }} />
                  {q}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatementBreakdown({
  issue,
  candidacies,
  positions,
  knownIds,
  userAnswer,
}: {
  issue: string;
  candidacies: Candidacy[];
  positions: Record<string, Record<string, StanceCheckPosition>>;
  knownIds: Set<string>;
  userAnswer: StanceCheckAnswer;
}) {
  const grouped = new Map<Bucket, { candidacy: Candidacy; position?: StanceCheckPosition }[]>(
    BUCKETS.map((b) => [b, []]),
  );
  for (const candidacy of candidacies) {
    const position = positions[candidacy.politicianId]?.[issue];
    const bucket: Bucket = position?.stance ?? "No record";
    grouped.get(bucket)!.push({ candidacy, position });
  }

  return (
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
        return (
          <Card key={bucket} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: style.dot }} />
              <span style={{ fontFamily: cond, fontSize: 15, letterSpacing: "0.04em" }}>{bucket}</span>
              <Pill bg={style.bg} fg={style.fg} style={{ marginLeft: "auto" }}>
                {entries.length}
              </Pill>
            </div>

            {entries.length === 0 ? (
              <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>Nobody on your ballot, so far.</span>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {entries.map(({ candidacy, position }) => (
                  <div key={candidacy.politicianId} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {knownIds.has(candidacy.politicianId) ? (
                      <Link
                        href={`/politician/${candidacy.politicianId}`}
                        style={{ fontFamily: cond, fontSize: 14, color: C.ink, textDecoration: "none" }}
                      >
                        {candidacy.name}
                      </Link>
                    ) : (
                      <span style={{ fontFamily: cond, fontSize: 14, color: C.body }}>{candidacy.name}</span>
                    )}
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
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>
                        No official position found
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
