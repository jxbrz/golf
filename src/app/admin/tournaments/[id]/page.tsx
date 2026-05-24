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
  LockKeyhole,
  Medal,
  RefreshCw,
  Scissors,
  SlidersHorizontal,
} from "lucide-react";
import {
  advanceWeekendStepAction,
  finaliseTournamentAction,
  processCutAction,
  recalculateAction,
  resetTournamentToNoPicksAction,
  syncScoresAction,
  updateTournamentStatusAction,
} from "@/app/actions";
import { CsvGolferImport } from "@/components/admin/CsvGolferImport";
import { OddsPricingPanel } from "@/components/admin/OddsPricingPanel";
import { AppShell, HeaderSettingsButton } from "@/components/layout/AppShell";
import { GroupLeaderboard } from "@/components/leaderboard/GroupLeaderboard";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireAdminUser } from "@/lib/auth";
import { getDbEntriesWithDetails, getDbHybridStatus, getDbLeaderboard, type DbHybridStatus } from "@/lib/db-data/entries";
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
  searchParams: Promise<{ odds?: string; reset?: string }>;
}) {
  const { id } = await params;
  const { odds, reset } = await searchParams;
  await requireAdminUser();

  const tournament = getTournament(id);
  if (!tournament) notFound();

  const golfers = getTournamentGolfers(tournament.id);
  const [dbEntries, dbRows, hybridStatus] = await Promise.all([
    getDbEntriesWithDetails(tournament.id),
    getDbLeaderboard(tournament.id, tournament),
    getDbHybridStatus(tournament.id),
  ]);
  const entries = dbEntries.length ? dbEntries : getEntriesWithDetails(tournament.id);
  const leaderboardRows = dbRows.length ? dbRows : getLeaderboard(tournament.id);
  const scoredGolfers = golfers.filter((golfer) => golfer.totalScore !== null).length;
  const madeCutGolfers = golfers.filter((golfer) => golfer.madeCut === true).length;
  const nextStep = getNextWeekendStep(tournament.status);
  const syncLogs = getScoreSyncLogs(tournament.id).slice(0, 3);
  const oddsPreview = odds === "preview" ? await getOddsPricingPreview(tournament.id) : undefined;
  const syncMode = process.env.SCORE_SYNC_MODE === "mock" ? "mock" : "live";
  const activeScoreProvider = syncMode === "mock" ? "mock simulator" : process.env.GOLF_DATA_PROVIDER ?? "mock";

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell
        tournament={tournament}
        screenTitle="Admin"
        screenSubtitle="Weekend Control"
        activeNav="admin"
        rightSlot={<HeaderSettingsButton />}
      >
        <main className="space-y-5">
          <section className="standings-status-card overflow-hidden rounded-lg border border-white/16 bg-[var(--nav)] p-4 text-white scorecard-shadow">
            <div className="flex items-center gap-3 rounded-md border border-white/14 bg-white/5 p-3">
              <span className="size-2.5 rounded-full bg-[var(--fairway)]" />
              <span>
                <span className="block text-[11px] font-black uppercase text-[var(--fairway)]">Game Active</span>
                <span className="block text-base font-black">{weekendStageLabel(tournament.status)}</span>
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <AdminMetric label="teams" value={String(entries.length)} />
              <AdminMetric label="scored" value={`${scoredGolfers}/${golfers.length}`} />
              <AdminMetric label="made cut" value={madeCutGolfers ? String(madeCutGolfers) : "-"} />
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <section className="mock-card overflow-hidden">
              <TournamentTimeline status={tournament.status} tournamentId={tournament.id} nextStep={nextStep} />
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
                    label="View Fantasy Standings"
                    detail="Player-facing team leaderboard"
                  />
                  <TaskLink
                    href={`/tournaments/${tournament.id}/results`}
                    icon={<Medal />}
                    label="Final Results"
                    detail="Podium and awards"
                  />
                </div>
              </section>

              <HybridStatusPanel status={hybridStatus} mockStatus={tournament.status} />
            </aside>
          </div>

          {odds === "applied" ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-900 scorecard-shadow">
              Odds pricing applied to matched golfers.
            </p>
          ) : null}

          {reset === "no-picks" ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-900 scorecard-shadow">
              Test reset complete. No picks have been submitted and the game is back to picks open.
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
            <section className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
              <h2 className="text-lg font-black text-amber-950">Testing reset</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-amber-900">
                Clears submitted teams, score logs, score overrides, and returns the game to picks open.
              </p>
              <form action={resetTournamentToNoPicksAction} className="mt-4">
                <input type="hidden" name="tournamentId" value={tournament.id} />
                <button className="rounded-md bg-amber-500 px-4 py-3 text-sm font-black uppercase text-amber-950 shadow-sm">
                  Reset to no picks
                </button>
              </form>
            </section>
          </details>

          <GroupLeaderboard
            rows={leaderboardRows}
            tournament={tournament}
            preview
            revealAll
            title="Fantasy standings"
          />
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}

function HybridStatusPanel({
  status,
  mockStatus,
}: {
  status: DbHybridStatus | null;
  mockStatus: TournamentStatus;
}) {
  if (!status) {
    return (
      <section className="app-panel p-4">
        <p className="sport-label">Hybrid State</p>
        <h2 className="mt-1 text-lg font-black">Mock fallback active</h2>
        <p className="mt-1 text-sm font-semibold text-muted">
          No DB group competition was found, so local mock state is driving this run.
        </p>
        <HybridRow label="Mock status" value={mockStatus} />
      </section>
    );
  }

  const { competition, ruleSet, scoreRounds } = status;
  const countbackPolicy = ruleSet?.countbackPolicy as { order?: string[] } | null;

  return (
    <section className="app-panel p-4">
      <p className="sport-label">Hybrid State</p>
      <h2 className="mt-1 text-lg font-black">DB competition mirror</h2>
      <div className="mt-3 grid gap-1">
        <HybridRow label="Competition" value={`${competition.name} (${competition.id})`} />
        <HybridRow label="DB status" value={competition.status} />
        <HybridRow label="Current round" value={competition.currentRound ? String(competition.currentRound) : "-"} />
        <HybridRow label="Mock status" value={mockStatus} />
        <HybridRow label="Picks locked" value={formatNullableDate(competition.picksLockAt)} />
        <HybridRow label="Cut processed" value={formatNullableDate(competition.cutProcessedAt)} />
        <HybridRow label="Finalised" value={formatNullableDate(competition.finalisedAt)} />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1 text-center">
        {[1, 2, 3, 4].map((round) => (
          <span key={round} className="rounded-md border border-border bg-slate-50 px-2 py-2">
            <span className="block text-[10px] font-black uppercase text-muted">R{round}</span>
            <span className="font-mono text-sm font-black text-primary">{scoreRounds[round as 1 | 2 | 3 | 4]}</span>
          </span>
        ))}
      </div>
      {ruleSet ? (
        <div className="mt-3 rounded-md border border-border bg-slate-50 p-3 text-sm">
          <p className="font-black text-primary">{ruleSet.name}</p>
          <p className="mt-1 font-semibold text-muted">
            Pick {ruleSet.pickCount}, budget {ruleSet.budgetPoints}, cut target {ruleSet.requiredMadeCutCount}, active after cut {ruleSet.maxActiveAfterCut}.
          </p>
          <p className="mt-1 font-semibold text-muted">
            {ruleSet.lockPolicy} - {ruleSet.dropPolicy}
          </p>
          <p className="mt-1 font-semibold text-muted">
            Lowest round {ruleSet.lowestRoundEnabled ? "on" : "off"}; countback {(countbackPolicy?.order ?? []).join(", ") || "-"}.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function HybridRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-sm">
      <span className="font-black uppercase text-muted text-[10px]">{label}</span>
      <span className="min-w-0 truncate font-semibold text-primary">{value}</span>
    </div>
  );
}

function formatNullableDate(value: Date | string | null) {
  if (!value) return "-";
  return formatDateTime(value instanceof Date ? value.toISOString() : value);
}

function AdminMetric({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-24 rounded-md border border-white/12 bg-white/10 p-3">
      <span className="block font-mono text-2xl font-black metric-number">{value}</span>
      <span className="mt-1 block text-xs font-black uppercase text-white/64">{label}</span>
    </span>
  );
}

function TournamentTimeline({
  status,
  tournamentId,
  nextStep,
}: {
  status: TournamentStatus;
  tournamentId: string;
  nextStep: ReturnType<typeof getNextWeekendStep>;
}) {
  const currentIndex = timelineSteps.findIndex((step) => step.statuses.includes(status));

  return (
    <section>
      <div className="divide-y divide-border px-4 py-2">
        {timelineSteps.map((step, index) => {
          const complete = currentIndex > index;
          const current = currentIndex === index;
          const upcoming = currentIndex < index;
          return (
            <div
              key={step.label}
              className="relative grid grid-cols-[2.75rem_1fr_auto] items-center gap-3 py-3"
            >
              {index < timelineSteps.length - 1 ? (
                <span className="absolute bottom-0 left-[1.34rem] top-9 w-px bg-border" />
              ) : null}
              <span
                className={`relative z-[1] flex size-9 items-center justify-center rounded-full border text-xs font-black ${
                  current
                    ? "border-[var(--secondary)] bg-[var(--secondary)] text-white"
                    : complete
                      ? "border-[var(--fairway)] bg-[var(--fairway)] text-white"
                      : "border-slate-300 bg-slate-50 text-muted"
                }`}
              >
                {complete ? <CheckCircle2 size={20} /> : current ? step.icon : upcoming ? step.lockedIcon : index + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-black text-primary">{step.label}</span>
                <span className="mt-0.5 block text-sm font-semibold text-muted">
                  {current ? step.detail : complete ? "Completed" : "Upcoming"}
                </span>
              </span>
              <span className="min-w-[6.5rem] text-right">
                {current && nextStep ? (
                  <form action={advanceWeekendStepAction}>
                    <input type="hidden" name="tournamentId" value={tournamentId} />
                    <input type="hidden" name="step" value={nextStep.step} />
                    <button className="rounded-md bg-[var(--secondary)] px-3 py-2 text-xs font-black uppercase text-primary shadow-sm">
                      {nextStep.buttonLabel}
                    </button>
                  </form>
                ) : (
                  <span className="text-xs font-semibold text-muted">{step.time}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <p className="border-t border-border px-4 py-3 text-center text-[11px] font-semibold text-muted">
        Steps unlock in order. Complete the current step to continue.
      </p>
    </section>
  );
}

const timelineSteps: Array<{
  label: string;
  detail: string;
  statuses: TournamentStatus[];
  time: string;
  icon: ReactNode;
  lockedIcon: ReactNode;
}> = [
  {
    label: "Picks Open",
    detail: "Entries are still open",
    statuses: ["draft", "picks_open"],
    time: "Entries close Thu 14 May - 11:00 AM",
    icon: <LockKeyhole size={18} />,
    lockedIcon: <LockKeyhole size={15} />,
  },
  {
    label: "Picks Locked",
    detail: "Ready to load round 1",
    statuses: ["picks_locked"],
    time: "Round 1 Thu 14 May",
    icon: <Flag size={18} />,
    lockedIcon: <LockKeyhole size={15} />,
  },
  {
    label: "Round 1 Loaded",
    detail: "Ready to load round 2",
    statuses: ["round_1"],
    time: "Round 1 complete Thu 14 May",
    icon: <Flag size={18} />,
    lockedIcon: <LockKeyhole size={15} />,
  },
  {
    label: "Round 2 Loaded",
    detail: "Ready to process the cut",
    statuses: ["round_2", "cut_pending"],
    time: "Round 2 complete Fri 15 May",
    icon: <Scissors size={18} />,
    lockedIcon: <LockKeyhole size={15} />,
  },
  {
    label: "Cut Processed",
    detail: "Ready to load round 3",
    statuses: ["drop_open"],
    time: "Cut after Fri 15 May",
    icon: <Flag size={18} />,
    lockedIcon: <LockKeyhole size={15} />,
  },
  {
    label: "Round 3 Loaded",
    detail: "Ready to load round 4",
    statuses: ["round_3"],
    time: "Round 3 complete Sat 16 May",
    icon: <Flag size={18} />,
    lockedIcon: <LockKeyhole size={15} />,
  },
  {
    label: "Round 4 Loaded",
    detail: "Ready to finalise results",
    statuses: ["round_4", "final"],
    time: "Round 4 complete Sun 17 May",
    icon: <Medal size={18} />,
    lockedIcon: <LockKeyhole size={15} />,
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
      title: "Load round 1",
      buttonLabel: "Load Round 1",
      confirmation: "This adds mock round 1 scores and makes the leaderboards feel live.",
    },
    round_1: {
      step: "round_2",
      title: "Load round 2",
      buttonLabel: "Load Round 2",
      confirmation: "This adds mock round 2 scores. Process the cut after round 2.",
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
      title: "Load round 3",
      buttonLabel: "Load Round 3",
      confirmation: "Use this once the cut has been checked. The app is already counting best 3 scores.",
    },
    round_3: {
      step: "round_4",
      title: "Load round 4",
      buttonLabel: "Load Round 4",
      confirmation: "This adds round 4 scores after round 3 is complete.",
    },
    round_4: {
      step: "final",
      title: "End round 4",
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

