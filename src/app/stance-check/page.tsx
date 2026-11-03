import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import StanceCheckView from "@/components/views/StanceCheckView";
import StanceCheckPaused from "@/components/StanceCheckPaused";
import {
  listFactChecks,
  listPoliticians,
  listRaces,
  stancePositions,
  stanceStatements,
  stanceWhyItMatters,
  topicPool,
} from "@/lib/repo";

/**
 * Records change between deploys, so this page is rebuilt in the background
 * at most every five minutes rather than frozen at whatever the database
 * held when the deploy ran.
 */
export const revalidate = 300;


export const metadata: Metadata = { title: "Stance Check" };

/**
 * While true, Stance Check shows a blocking "under construction" notice and
 * none of the quiz renders. Flip to false to bring the feature back.
 */
const STANCE_CHECK_PAUSED = true;

export default async function StanceCheckPage() {
  if (STANCE_CHECK_PAUSED) {
    return (
      <AppShell>
        <StanceCheckPaused />
      </AppShell>
    );
  }

  const [politicians, races, positions, checks] = await Promise.all([
    listPoliticians(),
    listRaces(),
    stancePositions(),
    listFactChecks(),
  ]);

  // Stance Check covers statewide and federal seats only (Governor, U.S. Senate,
  // U.S. House). Local candidates are left out: nobody has a sourced answer to
  // these statements there, so listing them would only pad the page with
  // empty "no public position" entries.
  const stanceRaces = races.filter((r) => /Governor|U\.S\. Senat|U\.S\. Representative/.test(r.title));

  return (
    <AppShell>
      <StanceCheckView
        politicians={politicians}
        races={stanceRaces}
        topicPool={topicPool()}
        statements={stanceStatements()}
        whyItMatters={stanceWhyItMatters()}
        positions={positions}
        checks={checks}
      />
    </AppShell>
  );
}
