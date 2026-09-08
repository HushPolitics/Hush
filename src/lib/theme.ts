/**
 * Hush design system tokens.
 * Ported verbatim from the Claude Design canvas so the build stays pixel-faithful.
 */

export const C = {
  // Brand-kit token swap (brand-tokens-v1) -- same roles as before, new hex
  // values pulled from the brand kit. See individual notes below for the
  // handful of tokens that don't have a direct kit match.
  ink: "#14110C",
  inkSoft: "#0B0A08",
  body: "#3D3629",
  muted: "#8C8477",
  // Derived, not a kit token -- the kit doesn't define a fourth, lighter
  // light-ground text tone, so this splits the difference between kit
  // Muted (#8C8477, above) and kit "Rule on light" (#C7BFAE).
  faint: "#AAA293",

  cream: "#FFFDF9",
  sand: "#EFE8DA",
  sandDeep: "#F4EFE4",
  shell: "#EFE8DA",
  hover: "#F4EFE4",
  white: "#FFFFFF",

  rust: "#9C3F32",
  rustHover: "#B44A3B",
  // Secondary accent (app-layout-v2 amendment) -- rust stays primary. Full
  // strength for labels, glyphs, rules, underlines and selected-state bars;
  // `slateFill` (roughly 12% opacity over cream) for card header fills and
  // background tints. Never on anything that signals true/false, good/bad,
  // or right/wrong -- verdicts, promise status, stance labels, HUSH Score
  // values and Compare's alignment tags all stay neutral ink/shell, same as
  // before this token existed. Brand-kit swap: now the kit's "Faded blue"
  // -- and `navy` below is the same kit color for the same reason, so the
  // two tokens are intentionally identical now (still kept separate: they
  // mean different things -- navy is a base UI color, slate is the
  // deliberate accent -- even though they render the same today).
  slate: "#2F4A6B",
  slateFill: "rgba(47,74,107,0.12)",
  navy: "#2F4A6B",
  // Bright accent for dark grounds (kit's "Bright blue"). Not currently
  // wired into any live component -- `.btn-steel` in globals.css and this
  // token aren't applied anywhere in the app right now -- kept so it's
  // ready when a dark-ground accent is needed again. Note for whenever
  // that happens: this is now a much lighter blue than before, so it needs
  // dark text on top of it, not light/sand text -- onDark/sand only clears
  // ~2.3:1 against it, well under the 4.5:1 text bar.
  steel: "#4BA3E8",
  steelHover: "#63B2EC",
  tan: "#B5A88A",
  // Not in the brand kit and not touched by this pass -- still live (see
  // HushScoreInfo's 100/50/0 score-key legend), so it can't just be
  // deleted, and it's outside a token swap's scope to redesign that legend.
  olive: "#8A7A4E",

  line: "rgba(20,17,12,0.12)",
  lineSoft: "rgba(20,17,12,0.07)",
  lineHard: "rgba(20,17,12,0.2)",
  onDark: "#F4EFE4",

  // Independent's party color. Not in the brand kit (the kit's accents are
  // only rust/orange/blue) -- party colors are their own protected token
  // set, separate from the brand/UI accent palette, so that's fine here.
  // Built the same way the kit builds its faded/bright pairs: same hue,
  // faded roughly half the lightness/saturation of bright. `independent`
  // is the one actually wired to PARTY.I below -- every party-color use in
  // the app renders on a light/white card, which this clears at ~6.9:1.
  // `independentBright` has nowhere to go yet (no dark-ground party-color
  // context exists), kept named and defined for whenever one does.
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

/** Chip styling for the on/off filter pills used across every view. */
export function chip(on: boolean) {
  return on
    ? { background: C.ink, color: C.sand, border: `1px solid ${C.ink}` }
    : { background: "transparent", color: C.body, border: "1px solid rgba(21,21,21,0.18)" };
}

export const cond = "var(--font-condensed), sans-serif";
