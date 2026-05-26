import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { OwnerShell } from "@/components/layout/OwnerShell";
import { getTournament } from "@/lib/mock-data/store";

export default async function OwnerTournamentEntriesPage({
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
          <p className="sport-label">Platform entry tools</p>
          <h1 className="mt-1 text-3xl font-black">{tournament.name} entries</h1>
          <p className="mt-1 text-muted">
            Entry correction tools are platform-level for now. Organisation-specific local entry operations can move here later.
          </p>
        </section>
        <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
          <ClipboardList className="text-[var(--secondary)]" />
          <h2 className="mt-3 text-xl font-black">Legacy entry tools</h2>
          <p className="mt-1 text-sm font-semibold text-muted">
            The existing entry editor is still available during this transition and remains guarded for platform control users.
          </p>
          <Link href={`/admin/tournaments/${id}/entries`} className="app-button mt-4 h-11 px-4">
            Open entry editor
          </Link>
        </section>
      </div>
    </OwnerShell>
  );
}
