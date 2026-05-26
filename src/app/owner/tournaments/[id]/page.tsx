import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, RadioTower } from "lucide-react";
import { OwnerShell } from "@/components/layout/OwnerShell";
import { getTournament } from "@/lib/mock-data/store";
import { formatDateTime } from "@/lib/utils";

export default async function OwnerTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = getTournament(id);
  if (!tournament) notFound();

  return (
    <OwnerShell>
      <div className="space-y-4">
        <Link href="/owner/tournaments" className="inline-flex items-center gap-2 text-sm font-black text-primary/72">
          <ArrowLeft size={17} />
          Back to global tournaments
        </Link>
        <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
          <p className="sport-label">Global tournament lifecycle</p>
          <h1 className="mt-1 text-3xl font-black">{tournament.name} {tournament.year}</h1>
          <p className="mt-1 text-muted">
            Platform-owned timing, field, odds, score sync and finalisation for every linked organisation competition.
          </p>
        </section>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Status" value={tournament.status.replaceAll("_", " ")} />
          <Metric label="Pick lock" value={formatDateTime(tournament.pickDeadline)} />
          <Metric label="Drop deadline" value={formatDateTime(tournament.dropDeadline)} />
          <Metric label="Venue" value={tournament.venue} />
        </section>
        <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
          <h2 className="text-xl font-black">Global controls</h2>
          <p className="mt-1 text-sm font-semibold text-muted">
            These tools affect the central tournament data shared by all organisations.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <OwnerAction href={`/admin/tournaments/${tournament.id}`} icon={<ClipboardList />} label="Lifecycle control" />
            <OwnerAction href={`/owner/tournaments/${tournament.id}/scores`} icon={<RadioTower />} label="Scores and sync" />
            <OwnerAction href={`/owner/tournaments/${tournament.id}/entries`} icon={<ClipboardList />} label="Entry tools" />
          </div>
        </section>
      </div>
    </OwnerShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
      <p className="text-sm font-black uppercase text-muted">{label}</p>
      <p className="mt-2 font-black capitalize text-primary">{value}</p>
    </section>
  );
}

function OwnerAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="rounded-lg border border-border p-4 font-black text-primary">
      <span className="mb-2 block text-[var(--secondary)]">{icon}</span>
      {label}
    </Link>
  );
}
