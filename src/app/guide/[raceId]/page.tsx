import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import GuideRaceView from "@/components/views/GuideRaceView";
import { getRace, guidePositions, listPoliticians, listRaces, raceExists } from "@/lib/repo";

export function generateStaticParams() {
  return listRaces().map((r) => ({ raceId: r.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ raceId: string }>;
}): Promise<Metadata> {
  const { raceId } = await params;
  if (!raceExists(raceId)) return { title: "Not found" };
  return { title: getRace(raceId)?.title ?? "Comparison" };
}

export default async function GuideRacePage({
  params,
}: {
  params: Promise<{ raceId: string }>;
}) {
  const { raceId } = await params;
  if (!raceExists(raceId)) notFound();
  const race = getRace(raceId);
  if (!race) notFound();

  return (
    <AppShell kicker="HUSH Guide" title={race.title}>
      <GuideRaceView race={race} politicians={listPoliticians()} positions={guidePositions()} />
    </AppShell>
  );
}
