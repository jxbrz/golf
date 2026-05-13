import Link from "next/link";
import { notFound } from "next/navigation";
import {
  finaliseTournamentAction,
  processCutAction,
  recalculateAction,
  syncScoresAction,
  updateTournamentStatusAction,
} from "@/app/actions";
import { CsvGolferImport } from "@/components/admin/CsvGolferImport";
import { AppShell } from "@/components/layout/AppShell";
import { GroupLeaderboard } from "@/components/leaderboard/GroupLeaderboard";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { getLeaderboard, getTournament, getTournamentGolfers } from "@/lib/mock-data/store";
import type { TournamentStatus } from "@/lib/types";

const statuses: TournamentStatus[] = [
  "draft",
  "picks_open",
  "picks_locked",
  "round_1",
  "round_2",
  "cut_pending",
  "drop_open",
  "round_3",
  "round_4",
  "final",
];

export default async function AdminTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const golfers = getTournamentGolfers(tournament.id);

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        <main className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <p className="text-sm font-bold uppercase text-muted">Admin tournament</p>
            <h1 className="text-3xl font-black">
              {tournament.name} {tournament.year}
            </h1>
            <p className="mt-1 text-muted">
              {golfers.length} golfers loaded · Status: {tournament.status}
            </p>
          </section>

          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h2 className="text-xl font-black">Run tournament</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <form action={updateTournamentStatusAction} className="flex gap-2 sm:col-span-2">
                <input type="hidden" name="tournamentId" value={tournament.id} />
                <select
                  name="status"
                  defaultValue={tournament.status}
                  className="h-11 min-w-0 flex-1 rounded-md border border-border px-3 font-semibold"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button className="rounded-md bg-primary px-4 font-black text-white">Update</button>
              </form>
              <AdminButton action={processCutAction} tournamentId={tournament.id} label="Process cut" />
              <AdminButton action={recalculateAction} tournamentId={tournament.id} label="Recalculate" />
              <AdminButton action={syncScoresAction} tournamentId={tournament.id} label="Mock sync" />
              <AdminButton action={finaliseTournamentAction} tournamentId={tournament.id} label="Finalise" />
              <Link
                href={`/admin/tournaments/${tournament.id}/scores`}
                className="rounded-md border border-border px-4 py-3 text-center font-black text-primary"
              >
                Edit scores
              </Link>
            </div>
          </section>

          <CsvGolferImport tournamentId={tournament.id} />
          <GroupLeaderboard
            rows={getLeaderboard(tournament.id)}
            tournament={tournament}
            preview
            revealAll
          />
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}

function AdminButton({
  action,
  tournamentId,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  tournamentId: string;
  label: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <button className="h-11 w-full rounded-md bg-primary px-3 font-black text-white">{label}</button>
    </form>
  );
}
