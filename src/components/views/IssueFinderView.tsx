"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import {
  FINDER_DEPTHS,
  finderStats,
  scoreFinder,
  selectFinderQuestions,
  type FinderQuestion,
} from "@/lib/issue-finder";
import type { IssueFinderAnswer, IssueFinderDepth } from "@/lib/types";
import { Card, Display, Kicker } from "@/components/ui";
import { TopIssuesCard } from "./TopIssuesCard";
import { IssueFinderDepthCards } from "./IssueFinderDepthCards";

const ANSWERS: IssueFinderAnswer[] = ["Not important", "Somewhat important", "Very important"];

type Step = "depth" | "sitting" | "results";

/**
 * Issue Finder — formerly "the quiz." Renamed everywhere per the sidebar
 * brief's Part 2: this determines *what a reader cares about* (a ranked
 * issue list feeding Guide/Compare/Feed), which is a different instrument
 * from Stance Check (*what they think* about specific statements, matched
 * against candidates). "Quiz" was the same generic word for two different
 * things; Stance Check keeps its own name unchanged.
 *
 * Depth pick -> one specific policy-detail question at a time -> a
 * suggested ranked order, landed on the same TopIssuesCard editor in its
 * draft mode so the suggestion can be reordered, added to, or trimmed before
 * an explicit Save writes it to `topics` — nothing here auto-saves as the
 * user answers, mirroring HUSH Guide's issue picker requiring Continue
 * rather than committing each toggle live.
 *
 * `?depth=` (quick|standard|thorough) skips straight past the depth-pick
 * screen into that sitting — how the two-path onboarding chooser
 * (`/profile/top-issues/start`) launches a depth card directly, since that
 * screen already did the depth picking itself. A plain visit (avatar menu's
 * "My issues" -> "Try Issue Finder", Guide's "Your issues" section) has no
 * `?depth=` and still opens on the depth-pick screen, unchanged.
 *
 * Re-running Issue Finder when a ranking already exists replaces it, so
 * saving asks for a confirming second click first (see `confirmReplace`)
 * rather than overwriting silently — first-time onboarding always starts
 * from an empty ranking, so this never gates that path.
 */
export default function IssueFinderView({
  topicPool,
  finderBank,
}: {
  topicPool: string[];
  finderBank: Record<string, string[]>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  // Present when this was reached via HUSH Guide's own onboarding gate (an
  // empty `topics` list routes here with `?next=/hush-guide`) rather than a
  // voluntary visit from the avatar menu or Guide's "Your issues" section —
  // lets both "leave without finishing" and "save and continue" land back
  // where the visit started instead of always assuming a standalone visit.
  const next = params.get("next");
  const depthParam = params.get("depth") as IssueFinderDepth | null;
  const exitHref = next ?? "/feed";
  const skipHref = next ? `/profile/top-issues?next=${encodeURIComponent(next)}` : "/profile/top-issues";
  const { topics: liveTopics, finderAnswers, recordFinderAnswer, setTopics } = usePrefs();
  const [step, setStep] = useState<Step>("depth");
  const [questions, setQuestions] = useState<FinderQuestion[]>([]);
  const [at, setAt] = useState(0);
  const [draftTopics, setDraftTopics] = useState<string[]>([]);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const stats = useMemo(() => finderStats(topicPool, finderAnswers), [topicPool, finderAnswers]);

  function startSitting(depth: IssueFinderDepth) {
    setQuestions(selectFinderQuestions(topicPool, finderBank, depth, finderAnswers));
    setAt(0);
    setStep("sitting");
  }

  // `?depth=` from the two-path chooser: jump straight into that sitting
  // instead of showing the depth-pick screen a second time.
  useEffect(() => {
    if (depthParam && FINDER_DEPTHS[depthParam]) startSitting(depthParam);
    // Only ever fires once, on mount -- re-running startSitting on every
    // finderAnswers change would restart the sitting mid-question.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function answer(value: IssueFinderAnswer) {
    const q = questions[at];
    recordFinderAnswer(q.id, value);

    if (at + 1 < questions.length) {
      setAt(at + 1);
      return;
    }

    // Last question of the sitting: score from `finderAnswers` plus this one
    // answer merged in locally. usePrefs() hasn't re-rendered this component
    // with the just-recorded answer yet within this same click handler, so
    // reading `finderAnswers` alone here would miss it.
    const finalAnswers = {
      ...finderAnswers,
      [q.id]: { value, answeredAt: Date.now() },
    };
    const suggested = scoreFinder(topicPool, finalAnswers);
    setDraftTopics(suggested);
    setStep("results");
  }

  function saveResults() {
    if (liveTopics.length > 0 && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    setTopics(draftTopics);
    router.push(next ?? "/profile/top-issues");
  }

  if (step === "depth") {
    return (
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <Kicker>Issue Finder</Kicker>
          <Display size={25}>Find your top issues with a few questions</Display>
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

        <IssueFinderDepthCards topicPool={topicPool} onPick={startSitting} />

        <Link
          href={skipHref}
          style={{ fontSize: 13, color: C.muted, textDecoration: "underline" }}
        >
          Rank them yourself instead
        </Link>

        <Link href={exitHref} style={{ fontSize: 13, color: C.navy, textDecoration: "underline" }}>
          {next ? "Back" : "Back to Feed"}
        </Link>
      </div>
    );
  }

  if (step === "sitting") {
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
            onClick={() => router.push(exitHref)}
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
            Exit Issue Finder
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
          Ranked from your answers, most important first. Drag to reorder, add or remove issues
          below, then save — nothing changes your actual Top Issues until you do.
        </span>
        {confirmReplace ? (
          <span style={{ fontSize: 12.5, color: C.rust, fontWeight: 500 }}>
            This replaces your current top issues ranking. Save again to confirm.
          </span>
        ) : null}
      </div>

      <TopIssuesCard
        topicPool={topicPool}
        showEditLink={false}
        draft={{
          topics: draftTopics,
          onChange: (next) => {
            setConfirmReplace(false);
            setDraftTopics(next);
          },
          onSave: saveResults,
          onDiscard: () => router.push(exitHref),
          saveLabel: confirmReplace ? "Yes, replace my ranking" : "Save my top issues",
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
