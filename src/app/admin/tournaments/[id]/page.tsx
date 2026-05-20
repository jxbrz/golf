import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Eye,
  Flag,
  Medal,
  RefreshCw,
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
import { OddsPricingPanel } from "@/components/admin/OddsPricingPanel";
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
import type { TournamentStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

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
        <main className="space-y-5">
          <section className="event-hero overflow-hidden rounded-lg text-white scorecard-shadow">
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-end lg:p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm font-black text-white/70">
                  <span className="rounded-md bg-white/10 px-2.5 py-1 uppercase">Admin</span>
                  <span>Tournament ID {tournament.providerTournamentId}</span>
                  <span>{tournament.status.replaceAll("_", " ")}</span>
                </div>
                <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                  {tournament.name} {tournament.year}
                </h1>
                <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-white/76">
                  {weekendStageHelp(tournament.status)}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <AdminMetric label="teams" value={String(entries.length)} />
                <AdminMetric label="scored" value={`${scoredGolfers}/${golfers.length}`} />
                <AdminMetric label="made cut" value={madeCutGolfers ? String(madeCutGolfers) : "-"} />
              </div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <section className="app-panel">
              <div className="app-panel-header p-4">
                <p className="sport-label">Tournament Control</p>
                <h2 className="mt-1 text-2xl font-black">{weekendStageLabel(tournament.status)}</h2>
              </div>
              <div className="space-y-4 p-4">
                <div className="rounded-md border border-border bg-[var(--rough)] p-4">
                  {nextStep ? (
                    <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <p className="sport-label">Next recommended action</p>
                        <h3 className="mt-1 text-2xl font-black">{nextStep.title}</h3>
                        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted">
                          {nextStep.confirmation}
                        </p>
                      </div>
                      <form action={advanceWeekendStepAction}>
                        <input type="hidden" name="tournamentId" value={tournament.id} />
                        <input type="hidden" name="step" value={nextStep.step} />
                        <button className="app-button h-12 w-full px-5 sm:w-auto">
                          {nextStep.buttonLabel}
                          <ArrowRight size={18} />
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div>
                      <p className="sport-label">Tournament complete</p>
                      <h3 className="mt-1 text-2xl font-black">No next action needed</h3>
                      <p className="mt-2 text-sm font-semibold text-muted">
                        Results are final. Use recovery controls only if you need to correct something.
                      </p>
                    </div>
                  )}
                </div>

                <TournamentTimeline status={tournament.status} />
              </div>
            </section>

            <aside className="space-y-5">
              <section className="app-panel p-4">
                <p className="sport-label">Live Data</p>
                <div className="mt-1 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black">{activeScoreProvider}</h2>
                    <p className="mt-1 text-sm font-semibold leading-6 text-muted">
                      {syncMode === "mock"
                        ? "Testing mode is on, so score updates use the simulator."
                        : process.env.SCORECARD_SYNC_ENABLED === "true"
                          ? "Live leaderboard and scorecard calls are enabled."
                          : "Live leaderboard sync is allowed; scorecard API calls are skipped."}
                    </p>
                  </div>
                  <Activity className="text-primary" size={22} />
                </div>
                <form action={syncScoresAction} className="mt-4">
                  <input type="hidden" name="tournamentId" value={tournament.id} />
                  <button className="app-button app-button-secondary w-full">
                    <RefreshCw size={17} /> Sync Scores
                  </button>
                </form>
                <div className="mt-4 space-y-2">
                  {syncLogs.length ? (
                    syncLogs.map((log) => (
                      <div key={log.id} className="rounded-md border border-border bg-white p-3 text-sm">
                        <p className={log.success ? "font-black text-emerald-800" : "font-black text-rose-800"}>
                          {log.success ? "Success" : "Failed"} - {log.provider}
                        </p>
                        <p className="mt-1 font-semibold text-muted">{log.message}</p>
                        <p className="mt-1 text-xs font-semibold text-muted">{formatDateTime(log.syncedAt)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-muted">
                      No score syncs have run yet.
                    </p>
                  )}
                </div>
              </section>

              <section className="app-panel p-4">
                <p className="sport-label">Quick Links</p>
                <div className="mt-3 grid gap-2">
                  <TaskLink
                    href={`/admin/tournaments/${tournament.id}/entries`}
                    icon={<ClipboardList />}
                    label="Manage Entries"
                    detail="Review and correct teams"
                  />
                  <TaskLink
                    href={`/admin/tournaments/${tournament.id}/scores`}
                    icon={<Flag />}
                    label="Edit Scores"
                    detail="Manual score corrections"
                  />
                  <TaskLink
                    href={`/tournaments/${tournament.id}/leaderboard`}
                    icon={<Eye />}
                    label="View Standings"
                    detail="Player-facing leaderboard"
                  />
                  <TaskLink
                    href={`/tournaments/${tournament.id}/results`}
                    icon={<Medal />}
                    label="Final Results"
                    detail="Podium and awards"
                  />
                </div>
              </section>
            </aside>
          </div>

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

          <div className="grid items-start gap-5 xl:grid-cols-2">
            <OddsPricingPanel tournamentId={tournament.id} preview={oddsPreview} />
            <div id="import">
              <CsvGolferImport tournamentId={tournament.id} />
            </div>
          </div>

          <details id="advanced" className="app-panel p-4">
            <summary className="cursor-pointer list-none text-xl font-black text-primary">
              Recovery controls
              <span className="mt-1 block text-sm font-semibold text-muted">
                Raw status changes and one-off recalculation tools.
              </span>
            </summary>
            <section className="mt-4 rounded-md border border-border bg-slate-50 p-4">
              <h2 className="flex items-center gap-2 text-lg font-black">
                <SlidersHorizontal size={18} /> Raw tournament status
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <form action={updateTournamentStatusAction} className="flex gap-2 sm:col-span-2">
                  <input type="hidden" name="tournamentId" value={tournament.id} />
                  <select
                    name="status"
                    defaultValue={tournament.status}
                    className="h-11 min-w-0 flex-1 rounded-md border border-border bg-white px-3 font-semibold"
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
                <AdminButton action={finaliseTournamentAction} tournamentId={tournament.id} label="Finalise" />
              </div>
            </section>
          </details>

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

function AdminMetric({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-24 rounded-md border border-white/12 bg-white/10 p-3">
      <span className="block font-mono text-2xl font-black metric-number">{value}</span>
      <span className="mt-1 block text-xs font-black uppercase text-white/64">{label}</span>
    </span>
  );
}

function TournamentTimeline({ status }: { status: TournamentStatus }) {
  const currentIndex = timelineSteps.findIndex((step) => step.statuses.includes(status));

  return (
    <section className="rounded-md border border-border bg-white p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="sport-label">Event Timeline</p>
          <h3 className="mt-1 text-xl font-black">Weekend flow</h3>
        </div>
        <p className="text-sm font-semibold text-muted">Use the recommended action to move safely.</p>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {timelineSteps.map((step, index) => {
          const complete = currentIndex > index;
          const current = currentIndex === index;
          return (
            <div
              key={step.label}
              className={`rounded-md border p-3 ${
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
    detail: "Players pick.",
    statuses: ["draft", "picks_open"],
  },
  {
    label: "Lock",
    detail: "Teams close.",
    statuses: ["picks_locked"],
  },
  {
    label: "Thu",
    detail: "Round 1.",
    statuses: ["round_1"],
  },
  {
    label: "Fri",
    detail: "Round 2.",
    statuses: ["round_2", "cut_pending"],
  },
  {
    label: "Cut",
    detail: "Best 3.",
    statuses: ["drop_open"],
  },
  {
    label: "Sat",
    detail: "Round 3.",
    statuses: ["round_3"],
  },
  {
    label: "Final",
    detail: "Publish.",
    statuses: ["round_4", "final"],
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
      confirmation: "This adds mock round 1 scores and makes the leaderboards feel live.",
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
      confirmation: "This marks who made the cut and counts each team's best 3 golfers.",
    },
    cut_pending: {
      step: "process_cut",
      title: "Process the cut",
      buttonLabel: "Process Cut",
      confirmation: "This marks who made the cut and counts each team's best 3 golfers.",
    },
    drop_open: {
      step: "round_3",
      title: "Start Saturday",
      buttonLabel: "Start Saturday",
      confirmation: "Use this once the cut has been checked. The app is already counting best 3 scores.",
    },
    round_3: {
      step: "round_4",
      title: "Start Sunday",
      buttonLabel: "Start Sunday",
      confirmation: "This adds final-round scores before you publish results.",
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
    picks_open: "Picks are open",
    picks_locked: "Picks locked: ready for round 1",
    round_1: "Round 1 scores are in",
    round_2: "Round 2 scores are in",
    cut_pending: "Ready to process the cut",
    drop_open: "Cut processed",
    round_3: "Round 3 scores are in",
    round_4: "Round 4 scores are in",
    final: "Final results are ready",
  };
  return labels[status];
}

function weekendStageHelp(status: TournamentStatus) {
  const copy: Record<TournamentStatus, string> = {
    draft: "Create the tournament and load players before opening picks.",
    picks_open: "Players can submit their teams. Scores should still show as not started.",
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

function TaskLink({
  href,
  icon,
  label,
  detail,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-md border border-border bg-white p-3 text-primary transition hover:bg-slate-50"
    >
      <span className="flex size-10 items-center justify-center rounded-md bg-[var(--rough)] text-primary">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-black">{label}</span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-muted">{detail}</span>
      </span>
      <ArrowRight size={17} />
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
