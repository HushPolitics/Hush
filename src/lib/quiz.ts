import type { QuizDepth, TopIssuesQuizAnswer } from "./types";

type QuizAnswers = Record<string, { value: TopIssuesQuizAnswer; answeredAt: number }>;

/**
 * Quick/Standard/Thorough — how many of each issue's 8 `TOP_ISSUES_QUIZ`
 * sub-questions one sitting asks. Every sitting touches every issue in the
 * pool at the chosen depth, so a 14-issue pool works out to 28/42/56
 * questions total, never a fixed 25 — see `sittingTotal()`.
 */
export const QUIZ_DEPTHS: Record<QuizDepth, { label: string; perIssue: number; blurb: string }> = {
  quick: {
    label: "Quick",
    perIssue: 2,
    blurb: "The essentials on every issue — a fast pass.",
  },
  standard: {
    label: "Standard",
    perIssue: 3,
    blurb: "A bit more nuance per issue. Good default.",
  },
  thorough: {
    label: "Thorough",
    perIssue: 4,
    blurb: "Every question this round has for each issue.",
  },
};

/** Total questions one sitting at `depth` asks across all of `topicPool`. */
export function sittingTotal(depth: QuizDepth, topicPool: string[]): number {
  return QUIZ_DEPTHS[depth].perIssue * topicPool.length;
}

/**
 * Stable id for one quiz question: an index into `TOP_ISSUES_QUIZ[issue]`,
 * not the question text itself, so the id survives if wording is edited
 * later and stays comparable across sittings/retakes.
 */
export function questionId(issue: string, index: number): string {
  return `${issue}::${index}`;
}

export interface QuizQuestion {
  id: string;
  issue: string;
  index: number;
  text: string;
}

/**
 * Builds one quiz sitting: `QUIZ_DEPTHS[depth].perIssue` questions from
 * every issue in `topicPool`/`bank`. Within each issue, questions not yet
 * answered (in `answers`) are preferred, in the bank's own core-first order;
 * once every question in that issue has been answered at least once, the
 * sitting cycles back starting with whichever was answered longest ago. The
 * picked set is then re-sorted to the bank's own index order for display, so
 * a sitting always reads core-first even when it includes cycled-back
 * questions. This is what makes retaking the quiz surface new material
 * automatically instead of re-asking the same 2-4 questions every time.
 */
export function selectQuizQuestions(
  topicPool: string[],
  bank: Record<string, string[]>,
  depth: QuizDepth,
  answers: QuizAnswers,
): QuizQuestion[] {
  const perIssue = QUIZ_DEPTHS[depth].perIssue;
  const questions: QuizQuestion[] = [];

  for (const issue of topicPool) {
    const pool = bank[issue] ?? [];
    const unanswered: number[] = [];
    const answered: number[] = [];
    pool.forEach((_, index) => {
      if (answers[questionId(issue, index)]) answered.push(index);
      else unanswered.push(index);
    });
    answered.sort(
      (a, b) => answers[questionId(issue, a)].answeredAt - answers[questionId(issue, b)].answeredAt,
    );
    const picked = unanswered.concat(answered).slice(0, perIssue).sort((a, b) => a - b);
    for (const index of picked) {
      questions.push({ id: questionId(issue, index), issue, index, text: pool[index] });
    }
  }

  return questions;
}

const ANSWER_VALUE: Record<TopIssuesQuizAnswer, number> = {
  "Not important": 0,
  "Somewhat important": 1,
  "Very important": 2,
};

/** Neutral midpoint on the 0 (Not important) - 2 (Very important) scale. */
const NEUTRAL = 1;

/**
 * An issue's score is treated as fully confident once this many of its
 * sub-questions have been answered — Thorough depth's per-issue count, so
 * completing even one Thorough sitting is enough evidence to trust an
 * issue's average outright. Answering more than this keeps sharpening the
 * average but no longer changes how much the shrink below softens it.
 */
const FULL_CONFIDENCE_AT = QUIZ_DEPTHS.thorough.perIssue;

/**
 * Suggested "My Top Issues" ranking from every quiz answer on file (not just
 * the latest sitting), most important first, capped at the same 10 issues
 * `topics` allows everywhere else.
 *
 * Same "shrink toward neutral" philosophy `matchDetail()` in scoring.ts
 * already uses for Value Match: an issue's raw average answer is pulled
 * toward the neutral midpoint in proportion to how few of its sub-questions
 * have been answered, so a single "Very important" answer doesn't outrank an
 * issue with a consistent "Very important" record across several answers —
 * more retakes sharpen an issue's position instead of just adding noise.
 * Ties (including issues nobody has answered anything for yet, which sit at
 * the neutral score) fall back to `topicPool`'s own order, so the result is
 * always fully deterministic.
 */
export function scoreQuiz(topicPool: string[], answers: QuizAnswers): string[] {
  const scored = topicPool.map((issue, poolIndex) => {
    const prefix = `${issue}::`;
    const forIssue = Object.entries(answers).filter(([id]) => id.startsWith(prefix));
    const n = forIssue.length;
    if (n === 0) return { issue, score: NEUTRAL, n, poolIndex };
    const raw = forIssue.reduce((sum, [, a]) => sum + ANSWER_VALUE[a.value], 0) / n;
    const coverage = Math.min(n / FULL_CONFIDENCE_AT, 1);
    const score = raw * coverage + NEUTRAL * (1 - coverage);
    return { issue, score, n, poolIndex };
  });

  return scored
    .sort((a, b) => b.score - a.score || b.n - a.n || a.poolIndex - b.poolIndex)
    .slice(0, 10)
    .map((s) => s.issue);
}

/** How many questions have been answered, and for how many distinct issues — for a "based on N answers" note on the results step. */
export function quizStats(topicPool: string[], answers: QuizAnswers): { totalAnswered: number; issuesAnswered: number } {
  const totalAnswered = Object.keys(answers).length;
  const issuesAnswered = topicPool.filter((issue) =>
    Object.keys(answers).some((id) => id.startsWith(`${issue}::`)),
  ).length;
  return { totalAnswered, issuesAnswered };
}
