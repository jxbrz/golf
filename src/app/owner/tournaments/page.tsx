import Link from "next/link";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { OwnerShell } from "@/components/layout/OwnerShell";
import { getStore } from "@/lib/mock-data/store";

export default function OwnerTournamentsPage() {
  const store = getStore();

  return (
    <OwnerShell>
      <div className="space-y-4">
        <Link href="/owner" className="inline-flex items-center gap-2 text-sm font-black text-primary/72">
          <ArrowLeft size={17} />
          Back to owner dashboard
        </Link>
        <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
          <p className="sport-label">Platform owner</p>
          <h1 className="mt-1 text-3xl font-black">Global tournaments</h1>
          <p className="mt-1 text-muted">
            Configure the central tournament lifecycle and global golf data used by every organisation.
          </p>
        </section>
        <section className="grid gap-3">
          {store.tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/owner/tournaments/${tournament.id}`}
              className="rounded-lg border border-border bg-surface p-4 scorecard-shadow"
            >
              <p className="text-sm font-black uppercase text-muted">{tournament.status}</p>
              <h2 className="mt-1 text-xl font-black">{tournament.name} {tournament.year}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-muted">
                <CalendarClock size={15} />
                Pick lock and weekend lifecycle are global platform controls.
              </p>
            </Link>
          ))}
        </section>
      </div>
    </OwnerShell>
  );
}
