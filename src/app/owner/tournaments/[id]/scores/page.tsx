import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, RadioTower } from "lucide-react";
import { OwnerShell } from "@/components/layout/OwnerShell";
import { getTournament } from "@/lib/mock-data/store";

export default async function OwnerTournamentScoresPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = getTournament(id);
  if (!tournament) notFound();

  return (
    <OwnerShell>
      <div className="space-y-4">
        <Link href={`/owner/tournaments/${id}`} className="inline-flex items-center gap-2 text-sm font-black text-primary/72">
          <ArrowLeft size={17} />
          Back to tournament
        </Link>
        <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
          <p className="sport-label">Global scores and sync</p>
          <h1 className="mt-1 text-3xl font-black">{tournament.name} scores</h1>
          <p className="mt-1 text-muted">
            Score sync, manual score corrections, odds and global field data are platform-level controls.
          </p>
        </section>
        <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
          <RadioTower className="text-[var(--secondary)]" />
          <h2 className="mt-3 text-xl font-black">Legacy score tools</h2>
          <p className="mt-1 text-sm font-semibold text-muted">
            The existing score editor is still available during this transition and remains guarded for platform control users.
          </p>
          <Link href={`/admin/tournaments/${id}/scores`} className="app-button mt-4 h-11 px-4">
            Open score editor
          </Link>
        </section>
      </div>
    </OwnerShell>
  );
}
