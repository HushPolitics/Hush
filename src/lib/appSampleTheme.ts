// Colors specific to the "logged-in app" samples that appear on the public
// marketing pages (a laptop preview, an address form, an issue ranker, a
// stance grid, ballot-measure cards, the Feed, Follow the Money, ...) -- the
// design specs call for these to look like the real app, not the marketing
// site, so they get their own small palette rather than reusing MK's
// marketing tokens. First built page-local for HUSH. Guide (Step 4); pulled
// out here once What's Included (Step 5) needed the exact same values, so
// both pages share one definition instead of drifting apart.
export const APP_SAMPLE = {
  bg: "#F6F3EE",
  border: "#E3DDD2",
  tag: "#E6E1D8",
  fieldFill: "#EAE5DF",
  fieldBorder: "#CFC9BD",
  searchPlaceholder: "#A39B8B",
  dragHandle: "#9A9285",
  stepRule: "#C9C1B2",
  // Added for What's Included's interactive samples.
  issueOnBg: "#EAE5DC",
  issueRing: "#B8B0A2",
};
