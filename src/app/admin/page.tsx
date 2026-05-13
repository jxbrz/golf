import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { getActiveTournament, getStore } from "@/lib/mock-data/store";

export default function AdminPage() {
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
          <section className="rounded-lg border border-dashed border-border bg-surface p-4">
            <h2 className="text-xl font-black">Create tournament</h2>
            <p className="mt-1 text-muted">
              The v1 scaffold is ready for creation forms. The seeded U.S. Open tournament is active now.
            </p>
          </section>
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}
