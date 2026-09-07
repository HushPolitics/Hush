"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { C, PARTY, PARTY_LABEL, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { parseRaceTitle, stripPartySuffix } from "@/lib/guide";
import { useRegisterSectionNav, type SectionNavItem } from "@/lib/sectionNav";
import type { FactCheck, Party, Politician, Race, StanceCheckAnswer, StanceCheckPosition } from "@/lib/types";
import { Card, Display, Kicker, Pill, RustButton } from "@/components/ui";
import { FactCheckCard } from "./FactCheckView";
import { IssuesStep } from "./GuideView";

type Bucket = StanceCheckAnswer | "No record";
const BUCKETS: Bucket[] = ["Agree", "Neutral", "Disagree", "No record"];

/**
 * One identical neutral treatment for every bucket -- Agree, Neutral and
 * Disagree all get the same ink/body/shell styling, whether it's the user's
 * own pick (the "Your answers" review strip) or a politician's sourced
 * stance (the per-question results grid below). Color-as-verdict used to
 * differ between the two: the strip carried its own navy/tan/rust ("that's
 * fine for the user's own answer, no comparison implied") while the results
 * grid was already neutral, on the reasoning that coloring *politicians'*
 * Agree/Neutral/Disagree would read as the UI signaling who's "right" --
 * exactly what the no-score requirement says this feature must not do. That
 * distinction doesn't hold up once "no navy/tan/rust as good/bad, anywhere"
 * is the actual rule: a reader's own past answer shouldn't be color-coded as
 * good or bad either. Reused for both, rather than kept as two style maps
 * with the same values. "No record" keeps its own, more muted treatment --
 * that's a presence/absence distinction (nothing sourced to link to), not a
 * verdict. Which group matters more is carried by column order (see
 * `orderedBuckets`) and label wording (see `bucketHeader`), never by color.
 */
const RESULT_STYLE: Record<Bucket, { bg: string; fg: string; dot: string }> = {
  Agree: { bg: C.shell, fg: C.ink, dot: C.body },
  Neutral: { bg: C.shell, fg: C.ink, dot: C.body },
  Disagree: { bg: C.shell, fg: C.ink, dot: C.body },
  "No record": { bg: C.shell, fg: C.muted, dot: C.muted },
};

/**
 * The answer picker itself (Disagree/Neutral/Agree, in the question box)
 * gets the same no-color-coding treatment as the results grid below, and for
 * the same reason: a per-choice color there would still read as the UI
 * hinting which answer is "normal" before the user even picks. This is
 * deliberately not the shared `Chip` from ui.tsx -- Chip's selected state
 * inverts to a solid ink background, which would swallow a same-toned dot
 * into invisibility, so selection here is instead carried by the ring
 * (hollow outline -> solid navy fill) plus a bolder ink label, identical for
 * whichever of the three is picked. The "Your answers" review strip below
 * now shares this picker's no-color-coding treatment too (see `RESULT_STYLE`
 * above) -- it used to keep its own per-answer accent, but reviewing the
 * user's own past picks shouldn't be color-coded good/bad any more than the
 * live picker should.
 */
/**
 * `variant="tertiary"` is Neutral's demoted treatment (see 1.4): smaller,
 * lower-contrast, visually subordinate to Agree and Disagree without being
 * removed as a choice. Neutral is a legitimate answer, it just produces a
 * dead reveal (no one to be surprised about), so the picker shouldn't
 * present it as an equal-weight option among the three.
 */
function AnswerChip({ on, onClick, children, variant = "primary" }: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  variant?: "primary" | "tertiary";
}) {
  const tertiary = variant === "tertiary";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: tertiary ? 6 : 8,
        padding: tertiary ? "5px 11px" : "8px 14px",
        borderRadius: tertiary ? 16 : 20,
        fontSize: tertiary ? 12 : 13,
        fontWeight: on ? 600 : 500,
        whiteSpace: "nowrap",
        cursor: "pointer",
        background: on ? (tertiary ? C.hover : C.shell) : "transparent",
        color: on ? (tertiary ? C.body : C.ink) : tertiary ? C.faint : C.body,
        border: `1px solid ${on ? (tertiary ? C.line : C.ink) : "rgba(21,21,21,0.14)"}`,
        opacity: tertiary && !on ? 0.85 : 1,
      }}
    >
      <span
        style={{
          width: tertiary ? 7 : 9,
          height: tertiary ? 7 : 9,
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
 * on its own, and the "Your answers" strip at the bottom is a review index,
 * not a result. Three points, not five: an earlier pass here briefly
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
        <Card style={{ maxWidth: 640, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <Kicker color={C.muted}>{issue}</Kicker>
          <Display size={22} style={{ lineHeight: 1.3 }}>
            {statements[issue!]}
          </Display>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <AnswerChip on={answer === "Disagree"} onClick={() => pickAnswer("Disagree")}>
              Disagree
            </AnswerChip>
            <span aria-hidden style={{ width: 1, height: 20, background: C.line }} />
            <AnswerChip on={answer === "Neutral"} onClick={() => pickAnswer("Neutral")} variant="tertiary">
              Neutral
            </AnswerChip>
            <span aria-hidden style={{ width: 1, height: 20, background: C.line }} />
            <AnswerChip on={answer === "Agree"} onClick={() => pickAnswer("Agree")}>
              Agree
            </AnswerChip>
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
          checks={checks}
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
            {topics.map((q, i) => {
              const a = answers[q];
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => setIndex(i)}
                  title={a}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 11px",
                    borderRadius: 16,
                    fontSize: 12,
                    border: `1px solid ${!done && i === at ? C.ink : C.line}`,
                    background: a ? RESULT_STYLE[a].bg : C.white,
                    color: a ? RESULT_STYLE[a].fg : C.muted,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: a ? RESULT_STYLE[a].dot : C.muted }} />
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

  // Only the sections actually present for this run -- "surprise" and
  // "no-match" are both conditional on the data. Registered here (not by
  // the parent) so it only exists while this summary screen is mounted;
  // unmounting (going back to a question) clears it via the hook's own
  // cleanup, same as the mid-run state rendering nothing.
  const summaryItems: SectionNavItem[] = [{ id: "overview", label: "Overview" }];
  if (surprise) summaryItems.push({ id: "surprise", label: "Strongest surprise" });
  if (noMatchIssues.length > 0) summaryItems.push({ id: "no-match", label: "No match" });
  useRegisterSectionNav(summaryItems);

  return (
    <Card style={{ maxWidth: 640, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
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
  );
}
