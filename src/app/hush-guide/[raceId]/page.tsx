import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import GuideRaceView from "@/components/views/GuideRaceView";
import { existingPoliticianSlugs, getRace as fetchRace, guidePositions } from "@/lib/repo";

/** Deduped within a request: the title and the page both need the race. */
const getRace = cache(fetchRace);

/**
 * Records change between deploys, so this page is rebuilt in the background
 * at most every five minutes rather than frozen at whatever the database
 * held when the deploy ran.
 */
export const revalidate = 300;


/** Rendered on demand -- see the note on the politician page. */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ raceId: string }>;
}): Promise<Metadata> {
  const { raceId } = await params;
  const race = await getRace(raceId);
  return { title: race?.title ?? "Not found" };
}

export default async function HushGuideRacePage({
  params,
}: {
  params: Promise<{ raceId: string }>;
}) {
  const { raceId } = await params;

  const race = await getRace(raceId);
  if (!race) notFound();

  // Only this race's candidates matter here -- loading every politician and
  // every position in the database made the first view take several seconds.
  const slugs = race.candidates.map((c) => c.politicianId).filter(Boolean);
  const [knownPoliticianIds, positions] = await Promise.all([
    existingPoliticianSlugs(slugs),
    guidePositions(slugs),
  ]);

  return (
    <AppShell>
      <GuideRaceView race={race} knownPoliticianIds={knownPoliticianIds} positions={positions} />
    </AppShell>
  );
}
