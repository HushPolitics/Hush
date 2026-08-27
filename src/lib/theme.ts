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

/** Trust score band -> colour + plain-language label. */
export function trustBand(t: number): { color: string; label: string } {
  if (t >= 70) return { color: C.navy, label: "Follows through" };
  if (t >= 50) return { color: C.olive, label: "Mixed record" };
  return { color: C.rust, label: "Weak record" };
}

export const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  Delivered: { bg: "rgba(37,55,70,0.10)", fg: C.navy },
  "In progress": { bg: "rgba(181,168,138,0.35)", fg: C.oliveDeep },
  "No movement": { bg: "rgba(156,63,50,0.10)", fg: C.rust },
};

/** Bar fill for a promise's progress, matching its status colour. */
export function progressColor(progress: number): string {
  if (progress >= 100) return C.navy;
  if (progress > 0) return C.tan;
  return C.rust;
}

// Aligned/Partial/Opposed are all rust now that they're clickable source
// links (see CompareView's Row) rather than status indicators — the grid
// trades away its at-a-glance color difference between "aligned" and
// "opposed" for a consistent link affordance. "No record" stays neutral:
// there's nothing sourced to link to.
export const TAG_STYLE: Record<string, { bg: string; fg: string }> = {
  Aligned: { bg: "rgba(156,63,50,0.10)", fg: C.rust },
  Partial: { bg: "rgba(156,63,50,0.10)", fg: C.rust },
  Opposed: { bg: "rgba(156,63,50,0.10)", fg: C.rust },
  "No record": { bg: C.shell, fg: C.muted },
};

export const VERDICT_STYLE: Record<string, { bg: string; fg: string; dot: string }> = {
  True: { bg: "rgba(37,55,70,0.10)", fg: C.navy, dot: C.navy },
  Misleading: { bg: "rgba(181,168,138,0.35)", fg: C.oliveDeep, dot: C.tan },
  False: { bg: "rgba(156,63,50,0.10)", fg: C.rust, dot: C.rust },
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
