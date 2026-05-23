import { notFound, redirect } from "next/navigation";
import { CheckCircle2, UserRoundCheck } from "lucide-react";
import { GolferHeadshot } from "@/components/golfers/GolferHeadshot";
import { AppShell, HeaderInfoButton } from "@/components/layout/AppShell";
import { GroupLeaderboard } from "@/components/leaderboard/GroupLeaderboard";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireCurrentUser } from "@/lib/auth";
import { getDbEntry, getDbLeaderboard } from "@/lib/db-data/entries";
import { getEntry, getLeaderboard, getTournament, getTournamentGolfers } from "@/lib/mock-data/store";
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
    redirect("/");
  }
  const dbRows = await getDbLeaderboard(tournament.id, tournament);
  const rows = dbRows.length ? dbRows : getLeaderboard(tournament.id);
  const golfers = getTournamentGolfers(tournament.id);
  const madeCutCount = golfers.filter((golfer) => golfer.madeCut === true).length || golfers.length;
  const liveRound = Math.max(1, ...golfers.map((golfer) => golfer.round ?? 1));
  const afterCut = ["drop_open", "round_3", "round_4", "final"].includes(tournament.status);

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell
        tournament={tournament}
        screenTitle="Standings"
        screenSubtitle={afterCut ? "After Cut" : "Live"}
        backHref="/"
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
                <span className="block text-[11px] font-black uppercase text-white/64">Cut Made</span>
                <span className="block text-base font-black">{madeCutCount} Players</span>
              </span>
            </div>
            <div className="flex items-center gap-3 p-4">
              <span className="size-2 rounded-full bg-red-500" />
              <span>
                <span className="block text-[11px] font-black uppercase text-red-400">Live</span>
                <span className="block text-base font-black">Round {liveRound}</span>
              </span>
            </div>
          </section>
          <div className="mock-tabs">
            <button type="button" className="active">Overall</button>
            <button type="button">My Position</button>
            <button type="button">My Team</button>
          </div>
          <GroupLeaderboard
            rows={rows}
            tournament={tournament}
            currentUserId={user.id}
            revealAll={user.role === "admin"}
            title="Current standings"
          />
          {entry ? <YourTeamPanel entry={entry} /> : null}
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}

function YourTeamPanel({ entry }: { entry: NonNullable<ReturnType<typeof getEntry>> }) {
  const madeCut = entry.picks.filter((pick) => pick.tournamentGolfer.madeCut === true).length;
  const dropCount = entry.status === "drop_required" ? Math.max(0, madeCut - 3) : 0;
  const note =
    entry.status === "drop_required"
      ? "Drop one golfer. Best 3 scores will count."
      : madeCut >= 3
        ? "Your counting players are set for the weekend."
        : "This team did not get 3 players through the cut.";

  return (
    <section className="mock-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <p className="sport-label">Your Team</p>
        <span className="rounded bg-[var(--fairway)] px-2 py-1 text-[10px] font-black uppercase text-white">
          {madeCut} make cut {dropCount ? `- drop ${dropCount}` : ""}
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
