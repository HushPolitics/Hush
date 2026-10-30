import { C } from "@/lib/theme";

/**
 * Shown only when an address resolved but matched no county or city races in
 * our data (see `lacksLocalRaces`). Those are the races most likely to be
 * missing, so the note points the voter to the official sample ballot instead
 * of implying the list is complete.
 */
export default function BallotGapNote() {
  return (
    <div
      role="note"
      style={{
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        background: C.shell,
        padding: "11px 14px",
        fontSize: 12.5,
        lineHeight: 1.6,
        color: C.body,
      }}
    >
      We don&rsquo;t have any county or city races loaded for your address yet, so your ballot may have more
      races than the ones listed here.{" "}
      <a
        href="https://registration.elections.myflorida.com/CheckVoterStatus"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: C.rust }}
      >
        Find your official sample ballot &rarr;
      </a>
    </div>
  );
}
