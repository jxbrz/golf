import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  LockKeyhole,
  Trophy,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EntryTeamCard } from "@/components/leaderboard/EntryTeamCard";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireCurrentUser } from "@/lib/auth";
import { getDbEntry } from "@/lib/db-data/entries";
import { getActiveTournament, getEntry, getLeaderboard } from "@/lib/mock-data/store";
import { isPrePlayStatus, tournamentStageCopy } from "@/lib/tournament-status";
import type { TournamentStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export default async function Home() {
  const tournament = getActiveTournament();
  const user = await requireCurrentUser();
  const entry = (await getDbEntry(tournament.id, user.id)) ?? getEntry(tournament.id, user.id);
  const prePlay = isPrePlayStatus(tournament.status);
  const stage = tournamentStageCopy(tournament);
  const needsDrop = entry?.status === "drop_required";
  const winnerRow =
    tournament.status === "final"
      ? getLeaderboard(tournament.id).find((row) => row.score !== null && row.status !== "eliminated" && row.entry.user.name)
      : null;

  if (tournament.status === "final" && user.role !== "admin") {
    redirect(`/tournaments/${tournament.id}/results`);
  }

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament} activeNav="home">
        <div className="space-y-5">
          <WelcomeHero
            entrySubmitted={Boolean(entry?.submittedAt)}
            locked={tournament.status === "picks_locked"}
            prePlay={prePlay}
            tournament={tournament}
          />
          {winnerRow ? <WinnerBanner name={winnerRow.entry.user.name} /> : null}
          {entry?.submittedAt ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
              <section className="app-panel p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-800">
                    <CheckCircle2 />
                  </span>
                  <div>
                    <p className="sport-label">Team status</p>
                    <h2 className="mt-1 text-2xl font-black">
                      {needsDrop ? "Drop required." : "Thanks for your picks."}
                    </h2>
                    <p className="mt-2 text-muted">
                      {needsDrop
                        ? "All 4 of your golfers made the cut. Drop 1 player so your best 3 count for the weekend."
                        : stage.team}
                    </p>
                    <Link
                      href={needsDrop ? `/tournaments/${tournament.id}/team#drop` : `/tournaments/${tournament.id}/team`}
                      className="app-button mt-4"
                    >
                      {needsDrop ? "Drop player" : "Review team"}
                      <ArrowRight size={17} />
                    </Link>
                  </div>
                </div>
              </section>
              <EntryTeamCard entry={entry} tournament={tournament} />
            </div>
          ) : null}
        </div>
      </AppShell>
    </MajorThemeProvider>
  );
}

function WinnerBanner({ name }: { name: string }) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 scorecard-shadow">
      <p className="sport-label text-emerald-800">Tournament winner</p>
      <h2 className="mt-1 text-2xl font-black text-primary">Congratulations {name}</h2>
    </section>
  );
}

function WelcomeHero({
  tournament,
  entrySubmitted,
  locked,
  prePlay,
}: {
  tournament: ReturnType<typeof getActiveTournament>;
  entrySubmitted: boolean;
  locked: boolean;
  prePlay: boolean;
}) {
  const stage = tournamentStageCopy(tournament);
  const statusTitle = entrySubmitted ? stage.label : locked ? "Picks Locked" : "Not Submitted";
  const statusCopy = entrySubmitted
    ? stage.team
    : locked
      ? "Picks are locked for this test weekend."
      : "You have 90 points to build your team of 4.";
  const primaryHref =
    tournament.status === "final"
      ? `/tournaments/${tournament.id}/results`
      : prePlay
        ? `/tournaments/${tournament.id}/pick`
        : `/tournaments/${tournament.id}/leaderboard`;
  const primaryLabel =
    tournament.status === "final"
      ? "View Results"
      : prePlay
        ? entrySubmitted
          ? "Review Team"
          : "Pick Team"
        : "View Standings";

  return (
    <section className="home-mock-screen overflow-hidden rounded-lg bg-white scorecard-shadow">
      <div className="relative h-[14.25rem] overflow-hidden text-white sm:h-[18rem] lg:h-[20rem]">
        <Image
          src="/images/aronimink-clubhouse.jpg"
          alt=""
          fill
          sizes="(min-width: 1024px) 72rem, 100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgb(0_22_49_/_0.9)] via-[rgb(0_22_49_/_0.36)] to-[rgb(0_22_49_/_0.72)]" />
        <div className="absolute inset-x-0 top-3 px-4 text-center sm:top-5">
          <div className="mx-auto h-px max-w-xs bg-white/16" />
          <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-black uppercase text-[var(--secondary)]">
            <LockKeyhole size={13} strokeWidth={2.4} /> Lock Picks
          </p>
          <div className="mt-1 flex items-end justify-center gap-1 font-mono font-black tabular-nums">
            <span className="text-[2rem] leading-none text-[var(--secondary)] sm:text-5xl">2d</span>
            <span className="text-[2rem] leading-none text-white/78 sm:text-5xl">14h</span>
            <span className="text-[2rem] leading-none text-white/78 sm:text-5xl">23m</span>
          </div>
          <p className="mt-2 text-xs font-black text-white sm:text-sm">{formatDateTime(tournament.pickDeadline)}</p>
        </div>
      </div>

      <div className="relative -mt-12 space-y-2.5 px-3 pb-3 sm:px-5 sm:pb-5">
        <section className="mock-card relative overflow-hidden p-4">
          <div className="relative z-[1]">
            <p className="sport-label">Your Status</p>
            <h2 className="mt-1 text-2xl font-bold text-primary">{statusTitle}</h2>
            <p className="mt-2 max-w-[16rem] text-sm font-semibold leading-5 text-primary/78">{statusCopy}</p>
          </div>
          <Flag className="absolute -bottom-2 right-2 text-slate-200" size={94} strokeWidth={1.2} />
        </section>

        <section className="mock-card p-4">
          <p className="sport-label">Tournament Progress</p>
          <div className="mt-4">
            <TournamentProgress status={tournament.status} />
          </div>
        </section>

        <section className="mock-card p-4">
          <p className="sport-label">Game Details</p>
          <div className="mt-3 grid gap-2">
            <DetailRow icon={<UsersRound size={15} />} label="Roster Size" value="4 Golfers" />
            <DetailRow icon={<Trophy size={15} />} label="Budget" value="90 Points" />
            <DetailRow icon={<Clock size={15} />} label="Scoring" value="Best 3 of 4" />
            <DetailRow icon={<LockKeyhole size={15} />} label="Cut Rule" value="Drop 1 if all 4 make cut" />
          </div>
        </section>

        {(!entrySubmitted && !locked) || entrySubmitted || !prePlay ? (
          <Link href={primaryHref} className="app-button h-12 w-full text-base">
            {primaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function TournamentProgress({ status }: { status: TournamentStatus }) {
  const steps: Array<{ label: string; statuses: TournamentStatus[] }> = [
    { label: "Lock Picks", statuses: ["draft", "picks_open", "picks_locked"] },
    { label: "Thu", statuses: ["round_1"] },
    { label: "Fri", statuses: ["round_2", "cut_pending"] },
    { label: "Cut", statuses: ["drop_open"] },
    { label: "Sat", statuses: ["round_3"] },
    { label: "Sun", statuses: ["round_4"] },
    { label: "Final", statuses: ["final"] },
  ];
  const current = Math.max(0, steps.findIndex((step) => step.statuses.includes(status)));

  return (
    <div className="grid grid-cols-7 items-start text-center">
      {steps.map((step, index) => {
        const complete = index < current;
        const active = index === current;
        return (
          <div key={step.label} className="relative flex flex-col items-center gap-2">
            {index > 0 ? <span className="absolute left-0 top-[0.72rem] h-px w-1/2 bg-slate-300" /> : null}
            {index < steps.length - 1 ? <span className="absolute right-0 top-[0.72rem] h-px w-1/2 bg-slate-300" /> : null}
            <span
              className={`relative z-[1] flex size-6 items-center justify-center rounded-full border bg-white ${
                active
                  ? "border-[var(--secondary)] bg-[var(--secondary)] text-white"
                  : complete
                    ? "border-[var(--fairway)] bg-[var(--fairway)] text-white"
                    : "border-slate-300 text-slate-400"
              }`}
            >
              {active ? <LockKeyhole size={13} /> : complete ? <CheckCircle2 size={14} /> : <Circle size={8} fill="currentColor" />}
            </span>
            <span className="min-w-0 text-[10px] font-semibold leading-3 text-primary">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[1.25rem_1fr_auto] items-center gap-2 text-sm">
      <span className="text-[var(--secondary)]">{icon}</span>
      <span className="font-semibold text-primary/78">{label}</span>
      <span className="text-right font-semibold text-primary">{value}</span>
    </div>
  );
}
