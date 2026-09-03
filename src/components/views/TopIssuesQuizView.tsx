"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { QUIZ_DEPTHS, quizStats, scoreQuiz, selectQuizQuestions, sittingTotal, type QuizQuestion } from "@/lib/quiz";
import type { QuizDepth, TopIssuesQuizAnswer } from "@/lib/types";
import { Card, Display, Kicker } from "@/components/ui";
import { TopIssuesCard } from "./TopIssuesCard";

const ANSWERS: TopIssuesQuizAnswer[] = ["Not important", "Somewhat important", "Very important"];
const DEPTH_ORDER: QuizDepth[] = ["quick", "standard", "thorough"];

type Step = "depth" | "quiz" | "results";

/**
 * The quiz entry point into "My Top Issues" (see TopIssuesCard) — not a new
 * top-level nav tab, just a route Profile links into. Depth pick -> one
 * specific policy-detail question at a time -> a suggested ranked order,
 * landed on the same TopIssuesCard editor in its draft mode so the
 * suggestion can be reordered, added to, or trimmed before an explicit Save
 * writes it to `topics` — nothing here auto-saves as the user answers,
 * mirroring HUSH Guide's issue picker requiring Continue rather than
 * committing each toggle live.
 *
 * Per-question answers are a different matter: those record immediately via
 * `recordQuizAnswer` as the user goes, because they're this feature's raw
 * input, not `topics` itself — persisting them is what lets a retake pull
 * fresh questions (`selectQuizQuestions`) and lets `scoreQuiz` rank issues
 * from every answer on file rather than just the current sitting. Retaking
 * sharpens the suggested order; it never resets it.
 */
export default function TopIssuesQuizView({
  topicPool,
  quizBank,
}: {
  topicPool: string[];
  quizBank: Record<string, string[]>;
}) {
  const router = useRouter();
  const { quizAnswers, recordQuizAnswer, setTopics } = usePrefs();
  const [step, setStep] = useState<Step>("depth");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [at, setAt] = useState(0);
  const [draftTopics, setDraftTopics] = useState<string[]>([]);

  const stats = useMemo(() => quizStats(topicPool, quizAnswers), [topicPool, quizAnswers]);

  function startQuiz(depth: QuizDepth) {
    setQuestions(selectQuizQuestions(topicPool, quizBank, depth, quizAnswers));
    setAt(0);
    setStep("quiz");
  }

  function answer(value: TopIssuesQuizAnswer) {
    const q = questions[at];
    recordQuizAnswer(q.id, value);

    if (at + 1 < questions.length) {
      setAt(at + 1);
      return;
    }

    // Last question of the sitting: score from `quizAnswers` plus this one
    // answer merged in locally. usePrefs() hasn't re-rendered this component
    // with the just-recorded answer yet within this same click handler, so
    // reading `quizAnswers` alone here would miss it.
    const finalAnswers = {
      ...quizAnswers,
      [q.id]: { value, answeredAt: Date.now() },
    };
    const suggested = scoreQuiz(topicPool, finalAnswers);
    setDraftTopics(suggested);
    setStep("results");
  }

  if (step === "depth") {
    return (
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <Kicker>My Top Issues</Kicker>
          <Display size={25}>Find your top issues with a quiz</Display>
          <span style={{ fontSize: 13, color: C.body, maxWidth: 580, lineHeight: 1.5 }}>
            Every question is one specific policy detail, not a broad topic label — how you answer
            says how much that detail matters to you, not which side you&apos;re on. Take it as many
            times as you like; each round asks fresh questions where it can. At the end you&apos;ll
            get a suggested order to edit before anything is actually saved.
          </span>
          {stats.totalAnswered > 0 ? (
            <span style={{ fontSize: 12, color: C.muted }}>
              You&apos;ve answered {stats.totalAnswered} question{stats.totalAnswered === 1 ? "" : "s"} across{" "}
              {stats.issuesAnswered} issue{stats.issuesAnswered === 1 ? "" : "s"} so far — another round
              adds more signal.
            </span>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {DEPTH_ORDER.map((depth) => {
            const cfg = QUIZ_DEPTHS[depth];
            return (
              <Card
                key={depth}
                onClick={() => startQuiz(depth)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") startQuiz(depth);
                }}
                aria-label={`Start the ${cfg.label} quiz — ${sittingTotal(depth, topicPool)} questions`}
                style={{
                  flex: "1 1 220px",
                  minWidth: 200,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <span style={{ fontFamily: cond, fontSize: 21 }}>{cfg.label}</span>
                <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{cfg.blurb}</span>
                <span style={{ fontSize: 12, color: C.muted, marginTop: "auto" }}>
                  {sittingTotal(depth, topicPool)} questions
                </span>
              </Card>
            );
          })}
        </div>

        <Link href="/profile" style={{ fontSize: 13, color: C.navy, textDecoration: "underline" }}>
          Back to Profile
        </Link>
      </div>
    );
  }

  if (step === "quiz") {
    const q = questions[at];
    return (
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <Kicker>
            Question {at + 1} of {questions.length}
          </Kicker>
          <span style={{ height: 1, flex: 1, background: C.line }} />
          <button
            type="button"
            className="link-quiet"
            onClick={() => router.push("/profile")}
            style={{
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
            Exit quiz
          </button>
        </div>

        <Card style={{ maxWidth: 640, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <Kicker color={C.muted}>{q.issue}</Kicker>
          <Display size={22} style={{ lineHeight: 1.35 }}>
            How important is it to you that {q.text}?
          </Display>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ANSWERS.map((a) => (
              <ImportanceChip key={a} onClick={() => answer(a)}>
                {a}
              </ImportanceChip>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // step === "results"
  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <Kicker>Suggested order</Kicker>
        <Display size={25}>Here&apos;s what your answers suggest</Display>
        <span style={{ fontSize: 13, color: C.body, maxWidth: 580, lineHeight: 1.5 }}>
          Ranked from your quiz answers, most important first. Drag to reorder, add or remove
          issues below, then save — nothing changes your actual Top Issues until you do.
        </span>
      </div>

      <TopIssuesCard
        topicPool={topicPool}
        showEditLink={false}
        draft={{
          topics: draftTopics,
          onChange: setDraftTopics,
          onSave: () => {
            setTopics(draftTopics);
            router.push("/profile/top-issues");
          },
          onDiscard: () => router.push("/profile"),
          saveLabel: "Save my top issues",
        }}
      />
    </div>
  );
}

/**
 * Same no-color-coding, ring-fill vocabulary as Stance Check's own answer
 * picker (`AnswerChip` in StanceCheckView.tsx) — a per-choice color here
 * would read as the UI hinting which answer is "normal" before the person
 * even picks, same reasoning, just not shared as one component since the
 * two features' picker state differs (Stance Check's stays selected and
 * shows a breakdown; this one answers and immediately advances).
 */
function ImportanceChip({ onClick, children }: { onClick: () => void; children: ReactNode }) {
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
        fontWeight: 500,
        whiteSpace: "nowrap",
        cursor: "pointer",
        background: "transparent",
        color: C.body,
        border: "1px solid rgba(21,21,21,0.18)",
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          boxSizing: "border-box",
          border: `1.5px solid ${C.faint}`,
        }}
      />
      {children}
    </button>
  );
}
