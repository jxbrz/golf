import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ClipboardList, FileUp, Flag, Medal, SlidersHorizontal } from "lucide-react";
import {
  advanceWeekendStepAction,
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
import { requireAdminUser } from "@/lib/auth";
import {
  getEntriesWithDetails,
  getLeaderboard,
  getTournament,
  getTournamentGolfers,
} from "@/lib/mock-data/store";
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
  await requireAdminUser();
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const golfers = getTournamentGolfers(tournament.id);
  const entries = getEntriesWithDetails(tournament.id);
  const scoredGolfers = golfers.filter((golfer) => golfer.totalScore !== null).length;
  const madeCutGolfers = golfers.filter((golfer) => golfer.madeCut === true).length;

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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-muted">Weekend simulator</p>
                <h2 className="text-2xl font-black">{weekendStageLabel(tournament.status)}</h2>
                <p className="mt-1 text-sm text-muted">{weekendStageHelp(tournament.status)}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-black sm:min-w-80">
                <span className="rounded-md bg-slate-50 p-2 text-primary">
                  {entries.length}
                  <span className="block font-semibold text-muted">teams</span>
                </span>
                <span className="rounded-md bg-slate-50 p-2 text-primary">
                  {scoredGolfers}
                  <span className="block font-semibold text-muted">scored</span>
                </span>
                <span className="rounded-md bg-slate-50 p-2 text-primary">
                  {madeCutGolfers || "-"}
                  <span className="block font-semibold text-muted">made cut</span>
                </span>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <WeekendStepButton
                tournamentId={tournament.id}
                step="lock_picks"
                label="1. Lock picks"
                detail="Close team selection"
                active={tournament.status === "picks_locked"}
              />
              <WeekendStepButton
                tournamentId={tournament.id}
                step="round_1"
                label="2. Start Thursday"
                detail="Add round 1 scores"
                active={tournament.status === "round_1"}
              />
              <WeekendStepButton
                tournamentId={tournament.id}
                step="round_2"
                label="3. Start Friday"
                detail="Add round 2 scores"
                active={tournament.status === "round_2" || tournament.status === "cut_pending"}
              />
              <WeekendStepButton
                tournamentId={tournament.id}
                step="process_cut"
                label="4. Process cut"
                detail="Open drop choices"
                active={tournament.status === "drop_open"}
              />
              <WeekendStepButton
                tournamentId={tournament.id}
                step="round_3"
                label="5. Start Saturday"
                detail="Add round 3 scores"
                active={tournament.status === "round_3"}
              />
              <WeekendStepButton
                tournamentId={tournament.id}
                step="round_4"
                label="6. Start Sunday"
                detail="Add round 4 scores"
                active={tournament.status === "round_4"}
              />
              <WeekendStepButton
                tournamentId={tournament.id}
                step="final"
                label="7. Finalise"
                detail="Show final results"
                active={tournament.status === "final"}
              />
              <Link
                href={`/tournaments/${tournament.id}/leaderboard`}
                className="rounded-lg border border-border bg-white p-3 font-black text-primary"
              >
                View leaderboard
                <span className="mt-1 block text-sm font-semibold text-muted">Check what changed</span>
              </Link>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h2 className="text-xl font-black">Admin tasks</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <TaskLink href={`/admin/tournaments/${tournament.id}/entries`} icon={<ClipboardList />} label="Entries" />
              <TaskLink href={`/admin/tournaments/${tournament.id}/scores`} icon={<Flag />} label="Scores" />
              <TaskLink href="#import" icon={<FileUp />} label="Import Players" />
              <TaskLink href="#status" icon={<SlidersHorizontal />} label="Status" />
              <TaskLink href={`/tournaments/${tournament.id}/results`} icon={<Medal />} label="Final Results" />
            </div>
          </section>

          <section id="status" className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h2 className="text-xl font-black">Tournament status</h2>
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

          <div id="import">
            <CsvGolferImport tournamentId={tournament.id} />
          </div>
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

function WeekendStepButton({
  tournamentId,
  step,
  label,
  detail,
  active,
}: {
  tournamentId: string;
  step: "lock_picks" | "round_1" | "round_2" | "process_cut" | "round_3" | "round_4" | "final";
  label: string;
  detail: string;
  active: boolean;
}) {
  return (
    <form action={advanceWeekendStepAction}>
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <input type="hidden" name="step" value={step} />
      <button
        className={`h-full min-h-20 w-full rounded-lg border p-3 text-left font-black ${
          active ? "border-primary bg-primary text-white" : "border-border bg-white text-primary"
        }`}
      >
        {label}
        <span className={`mt-1 block text-sm font-semibold ${active ? "text-white/80" : "text-muted"}`}>
          {active ? "Current stage" : detail}
        </span>
      </button>
    </form>
  );
}

function weekendStageLabel(status: TournamentStatus) {
  const labels: Record<TournamentStatus, string> = {
    draft: "Setup",
    picks_open: "Tuesday: teams are being picked",
    picks_locked: "Picks locked: ready for Thursday",
    round_1: "Thursday: round 1 scores are in",
    round_2: "Friday: round 2 scores are in",
    cut_pending: "Friday night: ready to process the cut",
    drop_open: "Saturday morning: drop choices are open",
    round_3: "Saturday: round 3 scores are in",
    round_4: "Sunday: round 4 scores are in",
    final: "Final results are ready",
  };
  return labels[status];
}

function weekendStageHelp(status: TournamentStatus) {
  const copy: Record<TournamentStatus, string> = {
    draft: "Create the tournament and load players before opening picks.",
    picks_open: "Players can submit their teams. Scores should still say Not started.",
    picks_locked: "Teams are locked. Next, start Thursday to add the first mock scores.",
    round_1: "The leaderboard is live using all 4 picked golfers. Next, start Friday.",
    round_2: "Round 2 scores are loaded. Next, process the cut.",
    cut_pending: "Round 2 is complete. Process the cut when you are ready.",
    drop_open: "Entries with 4 golfers through the cut must drop one player.",
    round_3: "Only counting golfers should matter now. Next, start Sunday.",
    round_4: "Sunday scores are loaded. Finalise when the tournament is complete.",
    final: "The results page shows the podium and lowest-round banner.",
  };
  return copy[status];
}

function TaskLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-white p-4 text-center font-black text-primary"
    >
      <span className="mx-auto mb-2 flex size-9 items-center justify-center rounded-md bg-primary text-white">
        {icon}
      </span>
      {label}
    </Link>
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
