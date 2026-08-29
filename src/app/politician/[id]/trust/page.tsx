import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import TrustView from "@/components/views/TrustView";
import { getPolitician, listPoliticians, politicianExists } from "@/lib/repo";

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
    title: `${p.name} · promise ledger`,
    description: `Every tracked promise from ${p.name}, with status, date and sources.`,
  };
}

export default async function TrustPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!politicianExists(id)) notFound();
  const p = getPolitician(id);

  return (
    <AppShell kicker="HUSH. Score" title={`${p.name} · promise ledger`}>
      <TrustView politician={p} />
    </AppShell>
  );
}
