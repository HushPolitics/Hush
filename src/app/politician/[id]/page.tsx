import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import PoliticianView from "@/components/views/PoliticianView";
import { factChecksFor, getPolitician, listPoliticians, politicianExists } from "@/lib/repo";

export function generateStaticParams() {
  return listPoliticians().map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!politicianExists(id)) return { title: "Not found" };
  const p = getPolitician(id);
  return {
    title: p.name,
    description: `${p.name} — ${p.office}, ${p.district}. HUSH. Score ${p.trust}, ${p.kept} of ${p.kept + p.prog + p.broken} tracked promises delivered.`,
  };
}

export default async function PoliticianPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!politicianExists(id)) notFound();
  const p = getPolitician(id);

  return (
    <AppShell kicker="Profile" title={p.name}>
      <PoliticianView politician={p} checks={factChecksFor(id)} />
    </AppShell>
  );
}
