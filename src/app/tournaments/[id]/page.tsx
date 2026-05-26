import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EntryTeamCard } from "@/components/leaderboard/EntryTeamCard";
import { GroupLeaderboard } from "@/components/leaderboard/GroupLeaderboard";
import { MajorMark } from "@/components/theme/MajorMark";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { TournamentHeader } from "@/components/tournaments/TournamentHeader";
import { requireCurrentUser } from "@/lib/auth";
import { getDbEntry, getDbLeaderboard } from "@/lib/db-data/entries";
import { getEntry, getLeaderboard, getLowestRoundSummary, getTournament } from "@/lib/mock-data/store";
import type { LowestRoundSummary } from "@/lib/types";
import { formatScoreOrLabel } from "@/lib/utils";

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
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
  if (user.role !== "admin") {
    redirect(`/tournaments/${tournament.id}/leaderboard`);
  }
  const dbRows = await getDbLeaderboard(tournament.id, tournament);
  const leaderboardRows = dbRows.length ? dbRows : getLeaderboard(tournament.id);
  const winnerRow =
    tournament.status === "final"
      ? getLeaderboard(tournament.id).find((row) => row.score !== null && row.status !== "eliminated" && row.entry.user.name)
      : null;
  const lowestRound = getLowestRoundSummary(tournament.id);

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        {entry ? (
          <main className="space-y-4">
            {winnerRow ? <WinnerBanner name={winnerRow.entry.user.name} /> : null}
            <LowestRoundBanner lowestRound={lowestRound} />
            <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
              <div className="flex items-start gap-3">
                <MajorMark majorKey={tournament.majorKey} size="md" />
                <div>
                  <p className="text-sm font-bold uppercase text-muted">
                    {tournament.name} {tournament.year}
                  </p>
                  <h1 className="text-2xl font-black">Fantasy standings</h1>
                  <p className="mt-1 text-sm text-muted">
                    Tap a name to see the golfers counting for that team.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/tournaments/${tournament.id}/leaderboard`}
                      className="rounded-md bg-primary px-3 py-2 text-sm font-black text-white"
                    >
                      Fantasy Standings
                    </Link>
                    <Link
                      href={`/tournaments/${tournament.id}/players`}
                      className="rounded-md border border-border bg-white px-3 py-2 text-sm font-black text-primary"
                    >
                      Tournament Field
                    </Link>
                  </div>
                </div>
              </div>
            </section>
            <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
              <GroupLeaderboard
                rows={leaderboardRows}
                tournament={tournament}
                currentUserId={user.id}
                revealAll={user.role === "admin"}
                title="Fantasy standings"
              />
              <div className="space-y-4">
                <EntryTeamCard entry={entry} tournament={tournament} />
                {entry.status === "drop_required" ? (
                  <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
                    <h2 className="text-lg font-black">Cut being processed</h2>
                    <p className="mt-1 text-sm text-muted">
                      Your best 3 scores will count automatically once the standings refresh.
                    </p>
                  </section>
                ) : null}
              </div>
            </div>
          </main>
        ) : (
          <>
            <TournamentHeader tournament={tournament} entrySubmitted={false} />
            {winnerRow ? <WinnerBanner name={winnerRow.entry.user.name} /> : null}
            <LowestRoundBanner lowestRound={lowestRound} />
            <main className="grid gap-4 lg:grid-cols-[1fr_22rem]">
              <GroupLeaderboard
                rows={leaderboardRows}
                tournament={tournament}
                currentUserId={user.id}
                revealAll={user.role === "admin"}
                title="Fantasy standings"
              />
              <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
                <h2 className="text-lg font-black">No team submitted</h2>
                <p className="mt-1 text-sm text-muted">
                  Pick 4 golfers before the deadline to join the fantasy standings.
                </p>
                <Link
                  href={`/tournaments/${tournament.id}/pick`}
                  className="mt-4 inline-flex rounded-md bg-primary px-4 py-3 font-black text-white"
                >
                  Pick Team
                </Link>
                <Link
                  href={`/tournaments/${tournament.id}/players`}
                  className="ml-2 mt-4 inline-flex rounded-md border border-border bg-white px-4 py-3 font-black text-primary"
                >
                  Tournament Field
                </Link>
              </section>
            </main>
          </>
        )}
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

function LowestRoundBanner({ lowestRound }: { lowestRound: LowestRoundSummary }) {
  if (lowestRound.scoreToPar === null || lowestRound.golfers.length === 0) return null;

  const score = formatScoreOrLabel(lowestRound.scoreToPar);
  const names = lowestRound.golfers.map((golfer) => golfer.golfer.name).join(", ");
  const message =
    lowestRound.golfers.length > 1
      ? `${names} jointly won lowest round with a round of ${score}`
      : lowestRound.countback
        ? `${names} won on countback with a round of ${score}`
        : `${names} won lowest round with a round of ${score}`;

  return (
    <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
      <p className="sport-label">Lowest round</p>
      <h2 className="mt-1 text-xl font-black text-primary">{message}</h2>
    </section>
  );
}
