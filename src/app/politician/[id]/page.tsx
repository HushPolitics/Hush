import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import PoliticianView from "@/components/views/PoliticianView";
import {
  factChecksFor,
  getFundingSummary,
  getPolitician,
  guidePositions,
  stanceGrid,
} from "@/lib/repo";

/**
 * Records change between deploys, so this page is rebuilt in the background
 * at most every five minutes rather than frozen at whatever the database
 * held when the deploy ran.
 */
export const revalidate = 300;


/**
 * Rendered on demand rather than prerendered.
 *
 * Returning the full roster here would prebuild 500+ profile pages at deploy
 * time and freeze each one at whatever the database held during the build.
 * These pages are records that change between deploys, so an empty list plus
 * Next's default `dynamicParams` is the correct trade: a page is rendered the
 * first time someone asks for it, against live data.
 */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = await getPolitician(id);
  if (!p) return { title: "Not found" };

  return {
    title: p.name,
    description: [p.name, p.office, p.district].filter(Boolean).join(" — "),
  };
}

export default async function PoliticianPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const p = await getPolitician(id);
  if (!p) notFound();

  const [checks, positions, funding, stances] = await Promise.all([
    factChecksFor(id),
    guidePositions(),
    getFundingSummary(id),
    stanceGrid(),
  ]);

  return (
    <AppShell>
      <PoliticianView
        politician={p}
        checks={checks}
        positions={positions[id] ?? {}}
        funding={funding}
        stances={stances}
      />
    </AppShell>
  );
}
