import { C } from "@/lib/theme";
import type { RaceCandidate } from "@/lib/types";

/**
 * A short, sourced party note next to a candidate's name, used in races where
 * the ballot itself carries no party (school board). It renders only when the
 * record has both the wording and the link it came from, and the whole note is
 * that link, so a voter can check it. Renders nothing otherwise: a missing note
 * means "not confirmed", never "no party".
 */
export default function CandidateAffiliation({ candidate }: { candidate: RaceCandidate }) {
  const a = candidate.affiliation;
  if (!a) return null;
  return (
    <a
      href={a.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={a.sourceName ? `Source: ${a.sourceName}` : "Source"}
      style={{ fontSize: 12, color: C.muted, textDecoration: "underline", textUnderlineOffset: 2 }}
    >
      {a.label}
    </a>
  );
}
