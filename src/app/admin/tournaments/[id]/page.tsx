import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  ClipboardList,
  FileUp,
  Flag,
  Medal,
  Percent,
  SlidersHorizontal,
} from "lucide-react";
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
  getOddsPricingPreview,
  getScoreSyncLogs,
  getTournament,
  getTournamentGolfers,
} from "@/lib/mock-data/store";
import { OddsPricingPanel } from "@/components/admin/OddsPricingPanel";
import { formatDateTime } from "@/lib/utils";
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ odds?: string }>;
}) {
  const { id } = await params;
  const { odds } = await searchParams;
  await requireAdminUser();
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const golfers = getTournamentGolfers(tournament.id);
  const entries = getEntriesWithDetails(tournament.id);
  const scoredGolfers = golfers.filter((golfer) => golfer.totalScore !== null).length;
  const madeCutGolfers = golfers.filter((golfer) => golfer.madeCut === true).length;
  const nextStep = getNextWeekendStep(tournament.status);
  const syncLogs = getScoreSyncLogs(tournament.id).slice(0, 3);
  const oddsPreview = odds === "preview" ? await getOddsPricingPreview(tournament.id) : undefined;
  const syncMode = process.env.SCORE_SYNC_MODE === "mock" ? "mock" : "live";
  const activeScoreProvider = syncMode === "mock" ? "mock simulator" : process.env.GOLF_DATA_PROVIDER ?? "mock";

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
                <p className="text-sm font-bold uppercase text-muted">Tournament control</p>
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

            <div className="mt-4 rounded-lg border border-border bg-slate-50 p-4">
              {nextStep ? (
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="text-sm font-black uppercase text-muted">Next sensible action</p>
                    <h3 className="mt-1 text-xl font-black">{nextStep.title}</h3>
                    <p className="mt-1 text-sm text-muted">{nextStep.confirmation}</p>
                  </div>
                  <form action={advanceWeekendStepAction}>
                    <input type="hidden" name="tournamentId" value={tournament.id} />
                    <input type="hidden" name="step" value={nextStep.step} />
                    <button className="h-12 w-full rounded-md bg-primary px-5 text-base font-black text-white sm:w-auto">
                      {nextStep.buttonLabel}
                    </button>
                  </form>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-black uppercase text-muted">Tournament complete</p>
                  <h3 className="mt-1 text-xl font-black">No next action needed</h3>
                  <p className="mt-1 text-sm text-muted">
                    Results are final. Use advanced controls only if you need to correct something.
                  </p>
                </div>
              )}
            </div>

            <TournamentTimeline status={tournament.status} />

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link
                href={`/tournaments/${tournament.id}/leaderboard`}
                className="rounded-lg border border-border bg-white p-3 font-black text-primary"
              >
                View current standings
                <span className="mt-1 block text-sm font-semibold text-muted">Friends fantasy standings</span>
              </Link>
              <Link
                href={`/tournaments/${tournament.id}/players`}
                className="rounded-lg border border-border bg-white p-3 font-black text-primary"
              >
                View field leaderboard
                <span className="mt-1 block text-sm font-semibold text-muted">Actual golfer scores</span>
              </Link>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h2 className="text-xl font-black">Admin tasks</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <TaskLink href={`/admin/tournaments/${tournament.id}/entries`} icon={<ClipboardList />} label="Entries" />
              <TaskLink href={`/admin/tournaments/${tournament.id}/scores`} icon={<Flag />} label="Scores" />
              <TaskLink href="#import" icon={<FileUp />} label="Import Players" />
              <TaskLink href="#odds" icon={<Percent />} label="Odds Pricing" />
              <TaskLink href="#advanced" icon={<SlidersHorizontal />} label="Advanced" />
              <TaskLink href={`/tournaments/${tournament.id}/results`} icon={<Medal />} label="Final Results" />
            </div>
          </section>

          {odds === "applied" ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-900 scorecard-shadow">
              Odds pricing applied to matched golfers.
            </p>
          ) : null}

          {odds === "error" ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-900 scorecard-shadow">
              Odds pricing could not be applied. Preview the odds to see the provider error.
            </p>
          ) : null}

          <OddsPricingPanel tournamentId={tournament.id} preview={oddsPreview} />

          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-muted">Score sync</p>
                <h2 className="text-xl font-black">{activeScoreProvider}</h2>
                <p className="mt-1 text-sm font-semibold text-muted">
                  {syncMode === "mock"
                    ? "Testing mode is on, so no live score API calls will be made."
                    : process.env.SCORECARD_SYNC_ENABLED === "true"
                      ? "Live leaderboard and scorecard calls are enabled."
                      : "Live leaderboard sync is allowed; scorecard API calls are skipped."}
                </p>
              </div>
              <p className="text-sm font-semibold text-muted">
                Tournament ID: {tournament.providerTournamentId}
              </p>
            </div>
            <div className="mt-4 space-y-2">
              {syncLogs.length ? (
                syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-md border border-border bg-slate-50 p-3 text-sm"
                  >
                    <p className={log.success ? "font-black text-emerald-800" : "font-black text-rose-800"}>
                      {log.success ? "Success" : "Failed"} · {log.provider}
                    </p>
                    <p className="mt-1 text-muted">{log.message}</p>
                    <p className="mt-1 text-xs font-semibold text-muted">
                      {formatDateTime(log.syncedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-muted">
                  No score syncs have run yet.
                </p>
              )}
            </div>
          </section>

          <details id="advanced" className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <summary className="cursor-pointer list-none text-xl font-black text-primary">
              Advanced controls
              <span className="mt-1 block text-sm font-semibold text-muted">
                Use these only for corrections or recovery.
              </span>
            </summary>
            <section className="mt-4 rounded-lg border border-border bg-slate-50 p-4">
              <h2 className="text-lg font-black">Raw tournament status</h2>
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
                <AdminButton action={syncScoresAction} tournamentId={tournament.id} label="Sync scores" />
                <AdminButton action={finaliseTournamentAction} tournamentId={tournament.id} label="Finalise" />
                <Link
                  href={`/admin/tournaments/${tournament.id}/scores`}
                  className="rounded-md border border-border bg-white px-4 py-3 text-center font-black text-primary"
                >
                  Edit scores
                </Link>
              </div>
            </section>
          </details>

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

function TournamentTimeline({ status }: { status: TournamentStatus }) {
  const currentIndex = timelineSteps.findIndex((step) => step.statuses.includes(status));

  return (
    <section className="mt-4 rounded-lg border border-border bg-white p-4">
      <h3 className="text-lg font-black">Weekend timeline</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {timelineSteps.map((step, index) => {
          const complete = currentIndex > index;
          const current = currentIndex === index;
          return (
            <div
              key={step.label}
              className={`rounded-lg border p-3 ${
                current
                  ? "border-primary bg-primary text-white"
                  : complete
                    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                    : "border-border bg-slate-50 text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-xs font-black ${
                    current
                      ? "bg-white text-primary"
                      : complete
                        ? "bg-emerald-700 text-white"
                        : "bg-white text-muted"
                  }`}
                >
                  {complete ? <CheckCircle2 size={16} /> : index + 1}
                </span>
                <span className="font-black">{step.label}</span>
              </div>
              <p className={`mt-2 text-sm font-semibold ${current ? "text-white/80" : "text-muted"}`}>
                {step.detail}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const timelineSteps: Array<{
  label: string;
  detail: string;
  statuses: TournamentStatus[];
}> = [
  {
    label: "Tuesday",
    detail: "Players pick their teams.",
    statuses: ["draft", "picks_open"],
  },
  {
    label: "Lock picks",
    detail: "Teams are closed and visible.",
    statuses: ["picks_locked"],
  },
  {
    label: "Thursday",
    detail: "Round 1 scores are added.",
    statuses: ["round_1"],
  },
  {
    label: "Friday",
    detail: "Round 2 scores and cut.",
    statuses: ["round_2", "cut_pending", "drop_open"],
  },
  {
    label: "Saturday",
    detail: "Best 3 scores and round 3.",
    statuses: ["round_3"],
  },
  {
    label: "Sunday",
    detail: "Round 4 scores.",
    statuses: ["round_4"],
  },
  {
    label: "Final",
    detail: "Publish final results.",
    statuses: ["final"],
  },
];

function getNextWeekendStep(status: TournamentStatus) {
  const steps: Partial<
    Record<
      TournamentStatus,
      {
        step: "lock_picks" | "round_1" | "round_2" | "process_cut" | "round_3" | "round_4" | "final";
        title: string;
        buttonLabel: string;
        confirmation: string;
      }
    >
  > = {
    draft: {
      step: "lock_picks",
      title: "Lock picks",
      buttonLabel: "Lock Picks",
      confirmation: "This closes team selection. Players will no longer be able to submit or change teams.",
    },
    picks_open: {
      step: "lock_picks",
      title: "Lock picks",
      buttonLabel: "Lock Picks",
      confirmation: "This closes team selection. Players will no longer be able to submit or change teams.",
    },
    picks_locked: {
      step: "round_1",
      title: "Start Thursday",
      buttonLabel: "Start Thursday",
      confirmation: "This adds mock round 1 scores and makes the live leaderboards feel active.",
    },
    round_1: {
      step: "round_2",
      title: "Start Friday",
      buttonLabel: "Start Friday",
      confirmation: "This adds mock round 2 scores. Process the cut after this step.",
    },
    round_2: {
      step: "process_cut",
      title: "Process the cut",
      buttonLabel: "Process Cut",
      confirmation: "This marks who made the cut and automatically counts each team's best 3 golfers.",
    },
    cut_pending: {
      step: "process_cut",
      title: "Process the cut",
      buttonLabel: "Process Cut",
      confirmation: "This marks who made the cut and automatically counts each team's best 3 golfers.",
    },
    drop_open: {
      step: "round_3",
      title: "Start Saturday",
      buttonLabel: "Start Saturday",
      confirmation: "Use this once the cut has been checked. The app is already counting the best 3 scores.",
    },
    round_3: {
      step: "round_4",
      title: "Start Sunday",
      buttonLabel: "Start Sunday",
      confirmation: "This adds mock final-round scores before you publish final results.",
    },
    round_4: {
      step: "final",
      title: "Finalise results",
      buttonLabel: "Finalise Results",
      confirmation: "This closes the tournament and publishes the final results page.",
    },
  };

  return steps[status] ?? null;
}

function weekendStageLabel(status: TournamentStatus) {
  const labels: Record<TournamentStatus, string> = {
    draft: "Setup",
    picks_open: "Tuesday: teams are being picked",
    picks_locked: "Picks locked: ready for Thursday",
    round_1: "Thursday: round 1 scores are in",
    round_2: "Friday: round 2 scores are in",
    cut_pending: "Friday night: ready to process the cut",
    drop_open: "Saturday morning: cut processed",
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
    round_1: "The leaderboard is live using the best 3 available scores. Next, start Friday.",
    round_2: "Round 2 scores are loaded. Next, process the cut.",
    cut_pending: "Round 2 is complete. Process the cut when you are ready.",
    drop_open: "Entries with at least 3 golfers through the cut are scored using their best 3.",
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
