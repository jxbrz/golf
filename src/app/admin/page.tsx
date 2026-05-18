import Link from "next/link";
import { ClipboardList, Flag, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireAdminUser } from "@/lib/auth";
import { getActiveTournament, getStore } from "@/lib/mock-data/store";

export default async function AdminPage() {
  await requireAdminUser();
  const active = getActiveTournament();
  const store = getStore();

  return (
    <MajorThemeProvider majorKey={active.majorKey}>
      <AppShell tournament={active}>
        <main className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h1 className="text-3xl font-black">Admin</h1>
            <p className="mt-1 text-muted">
              Simple controls for running the competition if live data breaks.
            </p>
          </section>
          <div className="grid gap-4 sm:grid-cols-2">
            {store.tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/admin/tournaments/${tournament.id}`}
                className="rounded-lg border border-border bg-surface p-4 scorecard-shadow"
              >
                <p className="text-sm font-bold uppercase text-muted">{tournament.status}</p>
                <h2 className="mt-1 text-xl font-black">
                  {tournament.name} {tournament.year}
                </h2>
                <p className="mt-1 text-muted">{tournament.venue}</p>
              </Link>
            ))}
          </div>
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h2 className="text-xl font-black">Quick tasks</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Link
                href={`/admin/tournaments/${active.id}/entries`}
                className="rounded-lg border border-border p-4 font-black text-primary"
              >
                <ClipboardList className="mb-2" /> Entries
              </Link>
              <Link
                href={`/admin/tournaments/${active.id}/scores`}
                className="rounded-lg border border-border p-4 font-black text-primary"
              >
                <Flag className="mb-2" /> Scores
              </Link>
              {active.status === "final" ? (
                <Link
                  href={`/tournaments/${active.id}/results`}
                  className="rounded-lg border border-border p-4 font-black text-primary"
                >
                  <Trophy className="mb-2" /> Final Results
                </Link>
              ) : null}
            </div>
          </section>
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}
