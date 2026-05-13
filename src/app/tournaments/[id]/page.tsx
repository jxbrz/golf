import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EntryTeamCard } from "@/components/leaderboard/EntryTeamCard";
import { GroupLeaderboard } from "@/components/leaderboard/GroupLeaderboard";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { TournamentHeader } from "@/components/tournaments/TournamentHeader";
import { requireCurrentUser } from "@/lib/auth";
import { getEntry, getLeaderboard, getTournament } from "@/lib/mock-data/store";

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const user = await requireCurrentUser();
  const entry = getEntry(tournament.id, user.id);

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        {entry ? (
          <main className="space-y-4">
            <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-white">
                  <Trophy size={22} />
                </span>
                <div>
                  <p className="text-sm font-bold uppercase text-muted">
                    {tournament.name} {tournament.year}
                  </p>
                  <h1 className="text-2xl font-black">Player standings</h1>
                  <p className="mt-1 text-sm text-muted">
                    Tap a name to see the players counting for that team.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/tournaments/${tournament.id}/leaderboard`}
                      className="rounded-md bg-primary px-3 py-2 text-sm font-black text-white"
                    >
                      Group Standings
                    </Link>
                    <Link
                      href={`/tournaments/${tournament.id}/players`}
                      className="rounded-md border border-border bg-white px-3 py-2 text-sm font-black text-primary"
                    >
                      Field Leaderboard
                    </Link>
                  </div>
                </div>
              </div>
            </section>
            <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
              <GroupLeaderboard
                rows={getLeaderboard(tournament.id)}
                tournament={tournament}
                currentUserId={user.id}
                revealAll={user.role === "admin"}
                title="Player standings"
              />
              <div className="space-y-4">
                <EntryTeamCard entry={entry} />
                {entry.status === "drop_required" ? (
                  <Link
                    href={`/tournaments/${tournament.id}/drop`}
                    className="block rounded-lg bg-secondary p-4 text-center text-lg font-black text-white scorecard-shadow"
                  >
                    Drop required: choose 1 player
                  </Link>
                ) : null}
              </div>
            </div>
          </main>
        ) : (
          <>
            <TournamentHeader tournament={tournament} entrySubmitted={false} />
            <main className="grid gap-4 lg:grid-cols-[1fr_22rem]">
              <GroupLeaderboard
                rows={getLeaderboard(tournament.id)}
                tournament={tournament}
                currentUserId={user.id}
                revealAll={user.role === "admin"}
                title="Player standings"
              />
              <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
                <h2 className="text-lg font-black">No team submitted</h2>
                <p className="mt-1 text-sm text-muted">
                  Pick 4 golfers before the deadline to join the standings.
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
                  Field Leaderboard
                </Link>
              </section>
            </main>
          </>
        )}
      </AppShell>
    </MajorThemeProvider>
  );
}
