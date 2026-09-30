// Marketing-site "v11" brand tokens (brand-tokens-v2, HUSH. Brand Guidelines
// Draft 1) shared by the public marketing pages -- Home, Our Story, and the
// rest of the inner pages as they're built. Kept separate from theme.ts's
// `C` because the app-wide "on light" tokens there (C.body, C.muted, C.line)
// don't match this table's hex values, and touching them would reskin every
// already-built app page that depends on them. Consolidating the two is a
// later phase, not this pass -- see the Home v11 foundation-spec build notes.
//
// C.ink, C.rust ("persimmon"), and C.onDark/C.cream ("paper") already match
// this spec's table exactly, so those three keep coming from theme.ts rather
// than being duplicated here.
export const MK = {
  // On black.
  ruleDark: "#2A2620",
  ruleDarkStrong: "#3A342C",
  field: "#24201B",
  onBlackBody: "#CFC9BD",
  mutedDark: "#8C8477",

  // On light -- not rendered anywhere on the all-black Home page, so this
  // is new territory rather than a port of an existing page-local token.
  paper: "#F7F3EC",
  paperAlt: "#EFEAE0",
  card: "#FFFDF9",
  rule: "#D9D2C4",
  body: "#3D3629",
  // Spec's "muted" role (on light) is also what the v11 Home footer already
  // uses for its on-black copyright line -- same hex, reused as-is rather
  // than split into a separate on-black variant.
  muted: "#6B6355",
  persimmonTint: "#FBE3DA",
};
