"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import {
  FINDER_DEPTHS,
  finderStats,
  importanceLabel,
  scoreFinder,
  scoreFinderDetailed,
  selectFinderQuestions,
  type FinderIssueDetail,
  type FinderQuestion,
} from "@/lib/issue-finder";
import type { IssueFinderAnswer, IssueFinderDepth } from "@/lib/types";
import { Card, Display, GhostButton, Kicker, RustButton } from "@/components/ui";
import { TopIssuesCard } from "./TopIssuesCard";
import { IssueFinderDepthCards } from "./IssueFinderDepthCards";

const ANSWERS: { value: IssueFinderAnswer; description: string }[] = [
  { value: "Not important", description: "This isn't a priority for me." },
  { value: "Somewhat important", description: "This matters, but isn't a top priority." },
  { value: "Important", description: "This is an important issue for me." },
  { value: "Very important", description: "This is one of my stronger priorities." },
];

/**
 * One neutral, non-partisan line per issue for the sitting screen's "why
 * we ask" box -- explains why the issue is worth having an opinion on,
 * never which opinion to have. Drafted copy, not sourced from anywhere;
 * edit freely.
 */
const WHY_WE_ASK: Record<string, string> = {
  Healthcare: "Health coverage and costs land differently depending on your age, income, whether you have employer insurance, or you're managing a chronic condition — the same policy question can feel urgent to one household and abstract to another. Your answer here shapes how much weight healthcare gets across your Feed, HUSH Guide comparisons, and Stance Check results, alongside everything else you tell us matters.",
  Housing: "Rent, mortgage rates, and housing supply vary enormously by city, state, and whether you're a renter, an owner, or still saving for a first home — a policy that helps one household can barely register for another. Your answer helps us calibrate how much housing policy and candidate positions should factor into your Top Issues, Feed, and comparisons against the rest of your priorities.",
  "Voting rights": "Registration deadlines, ID requirements, mail-ballot rules, and early-voting windows are set state by state, so how much this issue matters can depend entirely on where you live and vote. Your answer helps us decide how prominently voting-access coverage and candidate records on this issue should surface relative to everything else in your profile.",
  Climate: "Climate and energy policy shows up in utility bills, extreme-weather risk, local jobs tied to energy production, and long-term environmental costs — the mix that matters most depends heavily on where you live and what you do for work. Your answer helps us weigh climate and energy coverage against your other priorities across the Feed and HUSH Guide.",
  Labor: "Wages, overtime rules, workplace safety, and union protections land differently depending on your industry, whether you're salaried or hourly, and whether collective bargaining is part of your workplace. Your answer helps us calibrate how much labor and workplace policy should factor into your Top Issues and the candidate comparisons we surface for you.",
  Education: "School funding, curriculum decisions, and access to higher education vary by district and state, and matter differently depending on whether you have kids in school, are paying off student loans, or neither. Your answer helps us decide how much education coverage should weigh against everything else you've told us matters.",
  Economy: "Economic policy spans taxes, inflation, trade, and interest rates — broad forces that touch everyone, but not evenly, depending on your income, whether you own a home or business, and how exposed your job is to economic swings. Your answer helps us calibrate how central economic policy should be in your overall issue profile.",
  Immigration: "Immigration policy covers the border, work visas, and paths to citizenship — issues that can feel distant to some households and immediate to others depending on family, community, and industry. Your answer helps us understand how much weight immigration policy should carry alongside your other priorities.",
  "Criminal justice": "Policing, sentencing, and prison policy affect communities very differently depending on where you live and your own experience with the justice system. Your answer helps us weigh criminal-justice coverage and candidate records against the rest of your Top Issues profile.",
  Guns: "Gun policy is one of the most locally variable issues in the country — state laws, rural versus urban context, and personal experience all shape how much it matters to any one person. Your answer helps us understand how central this issue is to you specifically, separate from how loudly it's debated nationally.",
  "Reproductive rights": "Reproductive health policy differs significantly by state, and how much it matters can depend on your age, whether you're planning a family, or your own health history. Your answer helps us prioritize this issue the way it actually matters to you, not by how much attention it gets elsewhere.",
  Transit: "Public transit and infrastructure investment shape commutes, costs, and access differently depending on whether you live somewhere transit-dependent or car-dependent, urban or rural. Your answer helps us weigh transit and infrastructure coverage against your other priorities.",
  Water: "Water infrastructure, quality, and environmental protections vary widely by region — a pressing local issue in some places, a background concern in others. Your answer helps us calibrate how central this should be in your issue profile.",
  Veterans: "Veterans' benefits and services affect a specific but significant part of the population directly, and touch many more through family and community. Your answer helps us understand how much weight this issue should carry relative to everything else you've told us matters.",
};

// Persists the in-progress sitting (and the unsaved results-screen draft) so
// a refresh resumes exactly where the person left off, including a finished
// but not-yet-saved ranking. sessionStorage on purpose, not localStorage --
// this is a live in-progress flow, not a durable preference, so it should
// clear when the tab closes rather than resurrect a quiz from weeks ago.
const SESSION_KEY = "hush.issueFinderSession.v1";

interface IssueFinderSession {
  step: Step;
  questions: FinderQuestion[];
  at: number;
  draftTopics: string[];
  confirmReplace: boolean;
  // Answers given so far in *this* sitting, kept separate from the
  // persisted, all-time finderAnswers -- so a question that already has an
  // old answer on file (from a prior sitting, possibly weeks ago) starts
  // blank here and only shows selected once actually clicked this round.
  sittingAnswers?: FinderAnswerMap;
}

function loadSession(): IssueFinderSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as IssueFinderSession;
  } catch {
    return null;
  }
}

function clearSession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

type Step = "depth" | "sitting" | "results";

type FinderAnswerMap = Record<string, { value: IssueFinderAnswer; answeredAt: number }>;

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
  // Set the instant a card is clicked so it can render as selected before
  // advancing -- answer() used to record and advance in the same tick, so
  // the click never had a visible moment on screen. Cleared once the pause
  // below finishes and the real advance happens.
  const [pendingAnswer, setPendingAnswer] = useState<IssueFinderAnswer | null>(null);
  const pendingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // What's been answered in this sitting only -- see IssueFinderSession's
  // sittingAnswers comment. Drives the answer cards' selected styling;
  // the persisted, all-time finderAnswers below still drives scoring.
  const [sittingAnswers, setSittingAnswers] = useState<FinderAnswerMap>({});

  const stats = useMemo(() => finderStats(topicPool, finderAnswers), [topicPool, finderAnswers]);
  // Computed unconditionally (not inside the `results`-only branch below) so
  // this hook runs in the same order every render regardless of `step` --
  // only actually used once step is "results", but Rules of Hooks doesn't
  // allow a useMemo call to be skipped on `depth`/`sitting` renders.
  const detail = useMemo(
    () => scoreFinderDetailed(topicPool, finderAnswers, finderBank),
    [topicPool, finderAnswers, finderBank],
  );
  const detailByIssue = useMemo(() => Object.fromEntries(detail.map((d) => [d.issue, d])), [detail]);

  useEffect(() => {
    return () => {
      if (pendingTimeout.current) clearTimeout(pendingTimeout.current);
    };
  }, []);

  function startSitting(depth: IssueFinderDepth) {
    setQuestions(selectFinderQuestions(topicPool, finderBank, depth, finderAnswers));
    setAt(0);
    setSittingAnswers({});
    setStep("sitting");
  }

  // On mount: resume a persisted sitting/results draft if one exists, and
  // only fall through to the `?depth=` deep-link (from the two-path chooser)
  // when there's nothing to resume -- a restored session always wins over
  // re-starting a fresh sitting.
  useEffect(() => {
    const restored = loadSession();
    if (restored) {
      setStep(restored.step);
      setQuestions(restored.questions);
      setAt(restored.at);
      setDraftTopics(restored.draftTopics);
      setConfirmReplace(restored.confirmReplace);
      setSittingAnswers(restored.sittingAnswers ?? {});
    } else if (depthParam && FINDER_DEPTHS[depthParam]) {
      startSitting(depthParam);
    }
    // Only ever fires once, on mount -- re-running this on every
    // finderAnswers change would restart or re-resume mid-question.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirrors the local flow state to sessionStorage on every change, so a
  // refresh at any point -- mid-question or sitting on a finished-but-unsaved
  // results screen -- picks back up instead of bouncing to the depth screen.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ step, questions, at, draftTopics, confirmReplace, sittingAnswers }),
      );
    } catch {
      // Storage unavailable (private browsing, blocked): progress just
      // won't survive a refresh this session -- same as today.
    }
  }, [step, questions, at, draftTopics, confirmReplace, sittingAnswers]);

  // Shared by answer() and skip(): move to the next question, or -- on the
  // last one -- score and land on results. `finalAnswers` lets answer()
  // pass finderAnswers with its just-recorded value merged in locally,
  // since usePrefs() hasn't re-rendered with it yet within the same click.
  // skip() has nothing to merge, so it just scores off finderAnswers as-is.
  function advance(finalAnswers: FinderAnswerMap) {
    if (at + 1 < questions.length) {
      setAt(at + 1);
      return;
    }
    const suggested = scoreFinder(topicPool, finalAnswers);
    setDraftTopics(suggested);
    setStep("results");
  }

  function answer(value: IssueFinderAnswer) {
    if (pendingAnswer) return; // already mid-advance from a previous click
    const q = questions[at];
    setPendingAnswer(value);
    recordFinderAnswer(q.id, value);
    setSittingAnswers((prev) => ({ ...prev, [q.id]: { value, answeredAt: Date.now() } }));
    const finalAnswers = { ...finderAnswers, [q.id]: { value, answeredAt: Date.now() } };
    pendingTimeout.current = setTimeout(() => {
      setPendingAnswer(null);
      advance(finalAnswers);
    }, 400);
  }

  // Leaves this question unanswered and moves on -- doesn't touch
  // finderAnswers at all, so a later retake still offers it first.
  function skip() {
    if (pendingAnswer) return;
    advance(finderAnswers);
  }

  function goPrevious() {
    setAt((prev) => Math.max(0, prev - 1));
  }

  function saveResults() {
    if (liveTopics.length > 0 && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    clearSession();
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
          onClick={clearSession}
          style={{ fontSize: 13, color: C.muted, textDecoration: "underline" }}
        >
          Rank them yourself instead
        </Link>

        <Link href={exitHref} onClick={clearSession} style={{ fontSize: 13, color: C.navy, textDecoration: "underline" }}>
          {next ? "Back" : "Back to Feed"}
        </Link>
      </div>
    );
  }

  if (step === "sitting") {
    const q = questions[at];
    // Only this sitting's own clicks highlight a card -- a question that
    // already has an answer on file from a past sitting starts blank, same
    // as one that's never been touched.
    const currentAnswer = sittingAnswers[q.id]?.value;
    const issueQuestions = questions.filter((qq) => qq.issue === q.issue);
    const posInIssue = issueQuestions.findIndex((qq) => qq.id === q.id) + 1;
    const pct = Math.round(((at + 1) / questions.length) * 100);

    return (
      <div style={{ padding: "24px 28px", display: "flex", gap: 28 }}>
        <aside style={{ width: 300, flex: "0 0 300px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <Kicker>Issue Finder</Kicker>
            <Display size={22} style={{ lineHeight: 1.25 }}>
              Find your top issues with a few questions
            </Display>
            <span style={{ fontSize: 12.5, color: C.body, lineHeight: 1.5 }}>
              Every question is one specific policy detail — how you answer says how much that
              detail matters to you, not which side you&apos;re on.
            </span>
          </div>

          <nav aria-label="Issues in this sitting" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {topicPool.map((issue, i) => {
              const indices = questions.reduce<number[]>((acc, qq, idx) => {
                if (qq.issue === issue) acc.push(idx);
                return acc;
              }, []);
              const on = issue === q.issue;
              const done = indices.length > 0 && indices.every((idx) => idx < at);
              return (
                <div
                  key={issue}
                  aria-current={on ? "true" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px 8px 11px",
                    borderRadius: 7,
                    borderLeft: `3px solid ${on ? C.rust : "transparent"}`,
                    background: on ? C.shell : "transparent",
                    color: on ? C.ink : C.body,
                    fontSize: 12.5,
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  <span style={{ width: 16, fontSize: 11, color: C.muted }}>{String(i + 1).padStart(2, "0")}</span>
                  <span
                    aria-hidden
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      flex: "0 0 6px",
                      background: on || done ? C.rust : C.faint,
                      opacity: done && !on ? 0.5 : 1,
                    }}
                  />
                  <span>{issue}</span>
                </div>
              );
            })}
          </nav>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted }}>
              <span>
                {at + 1} of {questions.length} questions
              </span>
              <span>{pct}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: C.line, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: C.rust }} />
            </div>
          </div>
        </aside>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ height: 1, flex: 1, background: C.line }} />
            <button
              type="button"
              className="link-quiet"
              onClick={() => {
                clearSession();
                router.push(exitHref);
              }}
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

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Kicker color={C.rust}>{q.issue}</Kicker>
            <Kicker color={C.muted}>
              Question {posInIssue} of {issueQuestions.length}
            </Kicker>
          </div>

          <Display size={30} style={{ lineHeight: 1.3 }}>
            How important is it to you that {q.text}?
          </Display>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {ANSWERS.map((a) => {
              const selected = pendingAnswer ? pendingAnswer === a.value : currentAnswer === a.value;
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => answer(a.value)}
                  aria-pressed={selected}
                  style={{
                    boxSizing: "border-box",
                    flex: "1 1 180px",
                    minWidth: 160,
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    padding: 14,
                    borderRadius: 10,
                    border: `1px solid ${selected ? C.rust : "rgba(21,21,21,0.16)"}`,
                    background: selected ? C.shell : C.white,
                    cursor: "pointer",
                    transition: "border-color 120ms ease, background-color 120ms ease",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      boxSizing: "border-box",
                      border: `1.5px solid ${selected ? C.rust : C.faint}`,
                      background: selected ? C.rust : "transparent",
                    }}
                  />
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{a.value}</span>
                  <span style={{ fontSize: 11.5, color: C.body, lineHeight: 1.4 }}>{a.description}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
            {at > 0 ? (
              <button
                type="button"
                onClick={goPrevious}
                style={{ border: 0, background: "transparent", color: C.navy, cursor: "pointer", padding: 0 }}
              >
                ← Previous
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={skip}
              style={{ border: 0, background: "transparent", color: C.muted, cursor: "pointer", padding: 0 }}
            >
              Skip question →
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              marginTop: 6,
              padding: "18px 22px",
              borderRadius: 12,
              background: C.slate,
            }}
          >
            <span aria-hidden style={{ fontSize: 16 }}>💡</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
              <Kicker color={C.onDark}>Why we ask</Kicker>
              <span style={{ fontSize: 13, color: C.onDark, lineHeight: 1.6 }}>
                {WHY_WE_ASK[q.issue]}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // step === "results"
  const top5 = draftTopics.slice(0, 5);
  const tierCounts = top5.reduce<Record<string, number>>((acc, issue) => {
    const label = importanceLabel(detailByIssue[issue].raw);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  const resultsDetail = Object.fromEntries(
    draftTopics.map((issue) => [
      issue,
      {
        importance: importanceLabel(detailByIssue[issue].raw),
        why: explainRanking(detailByIssue[issue]),
        href: "/hush-guide",
      },
    ]),
  );

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <button
        type="button"
        onClick={() => {
          setStep("sitting");
          setAt(Math.max(0, questions.length - 1));
        }}
        style={{ alignSelf: "flex-start", border: 0, background: "transparent", color: C.muted, fontSize: 12, cursor: "pointer", padding: 0 }}
      >
        ← Back to questions
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <Kicker>Suggested order</Kicker>
        <Display size={25}>Here are the issues that matter most to you.</Display>
        <span style={{ fontSize: 13, color: C.body, maxWidth: 580, lineHeight: 1.5 }}>
          Based on your answers, these are the issues you care about most — and why. Reorder, add,
          or remove below, then save — nothing changes your actual Top Issues until you do.
        </span>
        {confirmReplace ? (
          <span style={{ fontSize: 12.5, color: C.rust, fontWeight: 500 }}>
            This replaces your current top issues ranking. Save again to confirm.
          </span>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
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
              onDiscard: () => {
                clearSession();
                router.push(exitHref);
              },
              saveLabel: confirmReplace ? "Yes, replace my ranking" : "Save my top issues",
            }}
            resultsDetail={resultsDetail}
          />
        </div>

        <aside style={{ width: 300, flex: "0 0 300px", display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <Kicker>Your issue profile</Kicker>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: cond, fontSize: 20 }}>
                {top5.length} key issue{top5.length === 1 ? "" : "s"}
              </span>
              <span style={{ fontSize: 12, color: C.muted }}>
                These are the issues that rose to the top based on your answers.
              </span>
            </div>
            <span style={{ fontSize: 12.5, color: C.body }}>
              {(["Very important", "Important", "Somewhat important", "Not important"] as const)
                .filter((l) => tierCounts[l])
                .map((l) => `${tierCounts[l]} ${l}`)
                .join(" · ")}
            </span>
            <RustButton onClick={() => router.push("/your-ballot")} style={{ width: "100%" }}>
              See these issues on your ballot →
            </RustButton>
            <GhostButton
              onClick={() => {
                clearSession();
                setDraftTopics([]);
                setConfirmReplace(false);
                setStep("depth");
              }}
              style={{ width: "100%" }}
            >
              Retake the quiz
            </GhostButton>
          </Card>

          <Card style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <Kicker>What&apos;s next?</Kicker>
            <NextActionRow href="/compare" label="See where candidates stand" desc="Compare candidate positions on your top issues." />
            <NextActionRow href="/your-ballot" label="Explore your ballot" desc="See the races and candidates you'll actually vote on." />
            <NextActionRow href="/hush-guide" label="Learn about each issue" desc="Read direct quotes, sources, bills and key context in HUSH. Guide." />
          </Card>
        </aside>
      </div>
    </div>
  );
}

/**
 * The results screen's "why" line for one ranked issue -- grounded in the
 * real question the person answered (via scoreFinderDetailed's
 * topQuestion), not generated/invented text.
 */
function explainRanking(detail: FinderIssueDetail): string {
  if (detail.n === 0) {
    return `You haven't answered anything about ${detail.issue} yet — this is filling out the list by default.`;
  }
  const label = importanceLabel(detail.raw).toLowerCase();
  if (!detail.topQuestion) {
    return `Based on ${detail.n} answer${detail.n === 1 ? "" : "s"} so far, this came out ${label} to you overall.`;
  }
  const lede = detail.n === 1 ? "Your one answer" : `Across your ${detail.n} answers`;
  return `${lede} on how important it is that ${detail.topQuestion.text} — rated ${label} — is a big part of why this ranked here.`;
}

function NextActionRow({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="link-quiet"
      style={{ display: "flex", alignItems: "center", gap: 10, color: C.ink }}
    >
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
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={C.navy} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.3 }}>{desc}</span>
      </span>
      <span aria-hidden style={{ color: C.faint, fontSize: 14 }}>
        ›
      </span>
    </Link>
  );
}
