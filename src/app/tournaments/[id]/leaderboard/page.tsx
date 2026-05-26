import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, LocateFixed, Users, UserRoundCheck } from "lucide-react";
import { GolferHeadshot } from "@/components/golfers/GolferHeadshot";
import { AppShell, HeaderInfoButton } from "@/components/layout/AppShell";
import { GroupLeaderboard } from "@/components/leaderboard/GroupLeaderboard";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireCurrentUser } from "@/lib/auth";
import { getDbEntry, getDbHybridStatus, getDbLeaderboard } from "@/lib/db-data/entries";
import { getEntry, getLeaderboard, getTournament, getTournamentGolfers } from "@/lib/mock-data/store";
import { isCutFinalizedStatus, tournamentStageCopy } from "@/lib/tournament-status";
import { formatScoreOrLabel } from "@/lib/utils";

export default async function LeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const user = await requireCurrentUser();
  if (tournament.status === "final" && user.role !== "admin") {
    redirect(`/tournaments/${tournament.id}/results`);
  }
  const entry = (await getDbEntry(tournament.id, user.id)) ?? getEntry(tournament.id, user.id);
  if (user.role !== "admin" && !entry?.submittedAt && ["draft", "picks_open", "picks_locked"].includes(tournament.status)) {
    redirect("/app");
  }
  const dbRows = await getDbLeaderboard(tournament.id, tournament);
  const hybridStatus = await getDbHybridStatus(tournament.id);
  const rows = dbRows.length ? dbRows : getLeaderboard(tournament.id);
  const golfers = getTournamentGolfers(tournament.id);
  const cutFinalized = isCutFinalizedStatus(tournament.status);
  const madeCutCount = cutFinalized ? golfers.filter((golfer) => golfer.madeCut === true).length : null;
  const liveRound = Math.max(1, ...golfers.map((golfer) => golfer.round ?? 1));
  const stage = tournamentStageCopy(tournament);
  const userRank = rows.find((row) => row.entry.userId === user.id)?.rank ?? null;
  const picksRevealed = hybridStatus
    ? !["setup", "picks_open"].includes(hybridStatus.competition.status)
    : undefined;

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell
        tournament={tournament}
        screenTitle="Fantasy Standings"
        screenSubtitle={stage.label}
        backHref="/app"
        activeNav="standings"
        rightSlot={<HeaderInfoButton />}
      >
        <main className="space-y-4">
          <section className="standings-status-card grid grid-cols-2 overflow-hidden rounded-lg border border-white/16 bg-[var(--nav)] text-white scorecard-shadow">
            <div className="flex items-center gap-3 border-r border-white/12 p-4">
              <span className="flex size-8 items-center justify-center rounded-md bg-[var(--fairway)]/18 text-[var(--fairway)]">
                <UserRoundCheck size={18} />
              </span>
              <span>
                <span className="block text-[11px] font-black uppercase text-white/64">
                  {cutFinalized ? "Cut Made" : "Cut Status"}
                </span>
                <span className="block text-base font-black">
                  {cutFinalized ? `${madeCutCount} Players` : "Pending"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3 p-4">
              <span className="size-2 rounded-full bg-red-500" />
              <span>
                <span className="block text-[11px] font-black uppercase text-red-400">{stage.label}</span>
                <span className="block text-base font-black">Round {liveRound}</span>
              </span>
            </div>
          </section>
          <div className="mock-tabs">
            <Link href="#standings-board" className="active">Fantasy standings</Link>
            <Link href={userRank ? `#entry-${user.id}` : "#standings-board"}>
              <LocateFixed size={14} /> My Position{userRank ? ` #${userRank}` : ""}
            </Link>
            <Link href="#your-team">
              <Users size={14} /> My Team
            </Link>
          </div>
          <div id="standings-board" className="scroll-mt-24">
            <GroupLeaderboard
              rows={rows}
              tournament={tournament}
              currentUserId={user.id}
              revealAll={user.role === "admin"}
              picksRevealed={picksRevealed}
              title="Fantasy standings"
            />
          </div>
          {entry ? <YourTeamPanel entry={entry} tournament={tournament} /> : null}
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}

function YourTeamPanel({
  entry,
  tournament,
}: {
  entry: NonNullable<ReturnType<typeof getEntry>>;
  tournament: NonNullable<ReturnType<typeof getTournament>>;
}) {
  const cutFinalized = isCutFinalizedStatus(tournament.status);
  const madeCut = cutFinalized ? entry.picks.filter((pick) => pick.tournamentGolfer.madeCut === true).length : 0;
  const dropCount = cutFinalized && entry.status === "drop_required" ? Math.max(0, madeCut - 3) : 0;
  const note =
    !cutFinalized
      ? "Cut status is pending. Scores shown are current tournament totals."
      : entry.status === "drop_required"
      ? "Drop one golfer. Best 3 scores will count."
      : madeCut >= 3
        ? "Your counting players are set for the weekend."
        : "This team did not get 3 players through the cut.";

  return (
    <section id="your-team" className="mock-card scroll-mt-24 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <p className="sport-label">Your Team</p>
        <span className="rounded bg-[var(--fairway)] px-2 py-1 text-[10px] font-black uppercase text-white">
          {cutFinalized ? `${madeCut} made cut ${dropCount ? `- drop ${dropCount}` : ""}` : "cut pending"}
        </span>
      </div>
      <div className="divide-y divide-border">
        {entry.picks.map((pick) => (
          <div key={pick.id} className="grid grid-cols-[2rem_1fr_auto_auto] items-center gap-2 px-3 py-2.5">
            <GolferHeadshot name={pick.tournamentGolfer.golfer.name} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-primary">{pick.tournamentGolfer.golfer.name}</span>
              <span className="text-[11px] font-semibold text-muted">{pick.tournamentGolfer.golfer.country ?? "INT"}</span>
            </span>
            <span className="font-mono text-sm font-black text-primary">
              {formatScoreOrLabel(pick.tournamentGolfer.totalScore, "-")}
            </span>
            {pick.isDropped ? (
              <span className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[10px] font-black uppercase text-primary">Drop</span>
            ) : (
              <CheckCircle2 size={16} className={pick.isCounting ? "text-[var(--fairway)]" : "text-muted"} />
            )}
          </div>
        ))}
      </div>
      <p className="border-t border-border px-3 py-2 text-center text-[11px] font-semibold text-muted">
        {note}
      </p>
    </section>
  );
}
