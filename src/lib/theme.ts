/**
 * Hush design system tokens.
 * Ported verbatim from the Claude Design canvas so the build stays pixel-faithful.
 */

import type { GuideSourceType } from "./types";

export const C = {
  // Brand-kit token swap (brand-tokens-v2, HUSH. Brand Guidelines Draft 1)
  // -- same roles as before, new hex values from the Ink/Paper/Persimmon
  // system, defaulting to the guideline's own literal values wherever one
  // exists (including backup/secondary colors for supporting roles like
  // hover states) rather than inventing a derived tint. Tokens with truly
  // no guideline equivalent at all (inkSoft, sand, sandDeep) are derived
  // from the old palette's own ratios -- see the brand-tokens-v2 Phase 1
  // build doc for the method and the numbers.
  ink: "#1C1917",
  // The guideline defines one ink value, not two -- collapsed inkSoft into
  // ink rather than inventing a second, deeper shade. Only consumer today
  // is HERO_SCRIM below; easy to split back out if a real deeper black-
  // point value shows up later.
  inkSoft: "#1C1917",
  // The guideline's type system never defines a separate, softened body
  // text color -- its own body-copy sample just inherits plain Ink. Body
  // text is Ink itself now, not a derived in-between tone.
  body: "#1C1917",
  // The guideline's own supporting/eyebrow label color -- used verbatim,
  // not derived (it happened to land almost exactly where the math said
  // it should, which is a good sign the derivation method is right).
  muted: "#8A8578",
  // The guideline's Taupe, used verbatim for the same reason. NOTE: the
  // guideline's own contrast table marks Taupe "decorative use only --
  // never carry text on its own" (2.29:1 on Paper, fails AA). This token
  // is mostly borders/dividers/tints already, not paragraph text -- but
  // hasn't been audited for the rare place that might render it as actual
  // text. Flag anything found; it should move to `muted` instead.
  faint: "#A9A296",

  cream: "#F7F3EC", // "Paper"
  // Derived -- no surface-tint equivalent in the guideline at all. Built
  // the same way: the old sand/sandDeep tokens' distance from old cream
  // toward old ink, applied to the new cream/ink pair.
  sand: "#E2DED8",
  sandDeep: "#E9E5DE",
  shell: "#E2DED8",
  hover: "#E9E5DE",
  white: "#FFFFFF",

  // "Persimmon" -- kept the `rust` name rather than renaming every call
  // site across the app, same approach the brand-tokens-v1 pass used for
  // fonts (old variable names, new values). This also now covers the old
  // highlighter role (see below) -- the guideline's single-accent system
  // doesn't have a second bright color for dark grounds, and Persimmon
  // already passes 4.75:1 on Ink, so it doesn't need one.
  rust: "#E4572E",
  // The guideline's Muted Red -- a real backup accent "kept on file," used
  // here for hover/pressed states specifically since that's a genuinely
  // supporting, non-primary moment. Not a derived tint of Persimmon; this
  // is the guideline's own named secondary color doing the job it was
  // described for, rather than inventing a lighter shade of the primary.
  rustHover: "#B0524A",
  rustFill: "rgba(228,87,46,0.12)",

  // RETIRED as a general secondary UI accent, per your call -- kept
  // defined (not deleted) so nothing breaks before Phase 2 migrates the
  // call sites that still reference it. The two places blue stays live:
  // the politician profile, and party-affiliation dots (PARTY.D below) --
  // both of those should read `navy`, never `slate`, going forward.
  slate: "#7B93B0", // DEPRECATED for general UI -- do not add new uses
  slateFill: "rgba(123,147,176,0.12)", // DEPRECATED, same as slate
  independentFill: "rgba(46,96,76,0.12)",
  navy: "#7B93B0", // stays live: politician profile + party dots only
  // Unchanged -- not covered by the new guideline, not touched by this
  // pass. Still unused anywhere live, same as before.
  steel: "#4BA3E8",
  steelHover: "#63B2EC",
  // RETIRED as a separate token -- the guideline's single-accent system
  // has no second bright color for dark grounds, and `rust` (Persimmon)
  // already clears 4.75:1 on Ink. Aliased to rust rather than deleted, so
  // GlobalFooter.tsx/LandingHero.tsx/the Guide "Election Day" panel don't
  // break before they're migrated to reference `C.rust` directly -- safe
  // to remove once that migration happens.
  highlighter: "#E4572E", // DEPRECATED alias for rust
  highlighterHover: "#B0524A", // DEPRECATED alias for rustHover
  tan: "#A9A296", // now the same value as `faint` -- see note below
  // Not in the brand kit and not touched by this pass -- still live (see
  // HushScoreInfo's 100/50/0 score-key legend).
  olive: "#8A7A4E",

  // Rebuilt from the new ink's RGB, same alpha values as before.
  line: "rgba(28,25,23,0.12)",
  lineSoft: "rgba(28,25,23,0.07)",
  lineHard: "rgba(28,25,23,0.2)",
  onDark: "#F7F3EC",

  // Unchanged -- party-neutral colors are their own protected set, outside
  // the brand/UI accent palette, and the new guideline doesn't cover them.
  independent: "#2E604C",
  independentBright: "#40DD9C",
} as const;

export const PARTY: Record<string, string> = {
  D: C.navy,
  R: C.rust,
  I: C.independent,
};

export const PARTY_LABEL: Record<string, string> = {
  D: "Democrat",
  R: "Republican",
  I: "Independent",
};

/**
 * Trust score colour -- always one neutral ink tone, whatever the number is.
 * Used to color the HUSH Score digit itself and each bar in "Trust by term";
 * neither has a label next to it the way a verdict or a promise status does,
 * so the number alone (not a red/green-style color swing) is what tells a
 * reader whether a score is high or low. Kept as a named function (not a
 * bare `C.ink` reference at each call site) so both call sites stay in sync
 * if this ever needs to change again. Also finishes removing the old
 * "Follows through" / "Mixed record" / "Weak record" band labels this
 * function used to return -- dead output nothing ever rendered, and the app
 * IA restructure brief's Section 0 already called for dropping that
 * vocabulary in favor of the number plus the Delivered/In progress/No
 * movement ledger wording.
 */
export function trustBand(_t: number): string {
  return C.ink;
}

/**
 * One neutral treatment for every promise status -- Delivered, In progress
 * and No movement are visually identical now (background/foreground alike);
 * the status word itself is what tells the reader what happened, not the
 * color behind it. Matches the pattern StanceCheckView's `RESULT_STYLE`
 * already established for Agree/Neutral/Disagree.
 */
export const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  Delivered: { bg: C.shell, fg: C.ink },
  "In progress": { bg: C.shell, fg: C.ink },
  "No movement": { bg: C.shell, fg: C.ink },
};

/**
 * Bar fill for a promise's progress -- always one neutral ink tone,
 * regardless of percentage. The percentage number and the status word next
 * to it (see `STATUS_STYLE`) carry the meaning; the bar is just showing how
 * far along, not judging good/bad.
 */
export function progressColor(_progress: number): string {
  return C.ink;
}

// Aligned/Partial/Opposed share one neutral treatment: they're clickable
// source links (see CompareView's Row), not status indicators, so nothing
// here should read as "this stance is good" vs "this stance is bad." "No
// record" stays in its own, more muted treatment -- that's a presence/
// absence distinction (there's nothing sourced to link to), not a verdict.
export const TAG_STYLE: Record<string, { bg: string; fg: string }> = {
  Aligned: { bg: C.shell, fg: C.ink },
  Partial: { bg: C.shell, fg: C.ink },
  Opposed: { bg: C.shell, fg: C.ink },
  "No record": { bg: C.shell, fg: C.muted },
};

/**
 * One neutral treatment for every fact-check verdict -- Supported, Needs
 * Context, Unsupported and Inconclusive all render identically. The verdict
 * word itself (plus the claim and finding text next to it) is what tells
 * the reader what was found; navy/tan/rust behind it would tell them how to
 * feel about it before they'd even read the label.
 */
export const VERDICT_STYLE: Record<string, { bg: string; fg: string; dot: string }> = {
  Supported: { bg: C.shell, fg: C.ink, dot: C.body },
  "Needs Context": { bg: C.shell, fg: C.ink, dot: C.body },
  Unsupported: { bg: C.shell, fg: C.ink, dot: C.body },
  Inconclusive: { bg: C.shell, fg: C.ink, dot: C.body },
};

/** Chip styling for the on/off filter pills used across every view. */
export function chip(on: boolean) {
  return on
    ? { background: C.ink, color: C.sand, border: `1px solid ${C.ink}` }
    : { background: "transparent", color: C.body, border: `1px solid ${C.lineHard}` };
}

export const cond = "var(--font-condensed), sans-serif";

/**
 * Shared hero-image scrim gradient -- the dark-to-transparent wash behind
 * every page hero's white overlay text (Feed, HUSH Guide, Stance Check,
 * Politicians Directory). Was a hand-typed `rgba(11,10,8,…)` pair
 * copy-pasted identically into all four views; `rgba(11,10,8,1)` is exactly
 * `C.inkSoft`, so this builds the same two stops from the real token
 * instead of a duplicated raw triple.
 */
const inkSoftRgb = "28,25,23"; // C.inkSoft (#1C1917) as an rgb() triple, for the alpha stops below
export const HERO_SCRIM = `linear-gradient(to top, rgba(${inkSoftRgb},0.85), rgba(${inkSoftRgb},0.35))`;
/**
 * Maps HUSH Guide's granular source-provenance enum down to the
 * three-word editorial vocabulary SourceAttribution's `kind` prop
 * expects. "Official government site" is the only GuideSourceType that
 * names an actual government-run source, so it's the only one that reads
 * as "Official website" rather than "Primary source" -- a candidate's own
 * campaign material, wherever it's published, is still primary-source,
 * not independently verified the way an official record is.
 */
export const GUIDE_SOURCE_KIND: Record<GuideSourceType, string> = {
  "Campaign site": "Primary source",
  "Official government site": "Official website",
  "Official platform document": "Primary source",
  "Official press release": "Primary source",
  "Official social media": "Primary source",
};
