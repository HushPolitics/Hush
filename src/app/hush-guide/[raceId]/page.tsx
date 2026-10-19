import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import GuideRaceView from "@/components/views/GuideRaceView";
import { getRace, guidePositions, listPoliticians } from "@/lib/repo";

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

  const [politicians, positions] = await Promise.all([listPoliticians(), guidePositions()]);

  return (
    <AppShell>
      <GuideRaceView race={race} politicians={politicians} positions={positions} />
    </AppShell>
  );
}
