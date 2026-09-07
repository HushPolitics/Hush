/**
 * Hush design system tokens.
 * Ported verbatim from the Claude Design canvas so the build stays pixel-faithful.
 */

export const C = {
  ink: "#151515",
  inkSoft: "#1C1C1C",
  body: "#4A4540",
  muted: "#6B6560",
  faint: "#9A938B",

  cream: "#FFFDF9",
  sand: "#F3EFE4",
  sandDeep: "#F7F4EC",
  shell: "#EFEADE",
  hover: "#FAF7F0",
  white: "#FFFFFF",

  rust: "#9C3F32",
  rustHover: "#B44A3B",
  navy: "#253746",
  // Muted blue for actions on the near-black hero panel. Navy itself is far
  // too dark there (#253746 on #1C1C1C is 1.39:1, effectively invisible), so
  // this is the same hue — 212° vs navy's 209° — lifted into a readable range.
  // Sand label at 4.61:1, and 3.22:1 against the panel, which clears the 3:1
  // bar for a UI component. The rust button it replaces only managed 2.57:1.
  // Do not lighten `steel` further: it sits at the ceiling where the label
  // would drop below 4.5:1.
  steel: "#4A6E96",
  steelHover: "#4C709A",
  tan: "#B5A88A",
  olive: "#8A7A4E",
  oliveDeep: "#6E6244",

  line: "rgba(21,21,21,0.12)",
  lineSoft: "rgba(21,21,21,0.07)",
  lineHard: "rgba(21,21,21,0.2)",
  onDark: "#F3EFE4",
} as const;

export const PARTY: Record<string, string> = {
  D: C.navy,
  R: C.rust,
  I: C.tan,
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
 * One neutral treatment for every fact-check verdict -- True, Misleading and
 * False all render identically now. The verdict word itself (plus the claim
 * and finding text next to it) is what tells the reader what was found;
 * navy/tan/rust behind it would tell them how to feel about it before they'd
 * even read the label.
 */
export const VERDICT_STYLE: Record<string, { bg: string; fg: string; dot: string }> = {
  True: { bg: C.shell, fg: C.ink, dot: C.body },
  Misleading: { bg: C.shell, fg: C.ink, dot: C.body },
  False: { bg: C.shell, fg: C.ink, dot: C.body },
};

export const BALLOT_STATE_STYLE: Record<string, { bg: string; fg: string }> = {
  Reviewed: { bg: "rgba(37,55,70,0.10)", fg: C.navy },
  "Needs review": { bg: "rgba(181,168,138,0.35)", fg: C.oliveDeep },
  "No match yet": { bg: C.shell, fg: C.muted },
};

/** Chip styling for the on/off filter pills used across every view. */
export function chip(on: boolean) {
  return on
    ? { background: C.ink, color: C.sand, border: `1px solid ${C.ink}` }
    : { background: "transparent", color: C.body, border: "1px solid rgba(21,21,21,0.18)" };
}

export const cond = "var(--font-condensed), sans-serif";
