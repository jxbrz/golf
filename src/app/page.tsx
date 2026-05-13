import Link from "next/link";
import { AlertTriangle, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EntryTeamCard } from "@/components/leaderboard/EntryTeamCard";
import { GroupLeaderboard } from "@/components/leaderboard/GroupLeaderboard";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { TournamentHeader } from "@/components/tournaments/TournamentHeader";
import { requireCurrentUser } from "@/lib/auth";
import {
  getActiveTournament,
  getEntry,
  getLeaderboard,
} from "@/lib/mock-data/store";

export default async function Home() {
  const tournament = getActiveTournament();
  const user = await requireCurrentUser();
  const entry = getEntry(tournament.id, user.id);
  const rows = getLeaderboard(tournament.id);

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
                    Your team is locked. Check where everyone stands from first to last.
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
                rows={rows}
                tournament={tournament}
                currentUserId={user.id}
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
              <div className="space-y-4">
                <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-1 shrink-0 text-secondary" />
                    <div>
                      <h2 className="text-xl font-black">Pick your team</h2>
                      <p className="mt-1 text-muted">
                        Choose 4 golfers with a combined value of 90 points or less.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/tournaments/${tournament.id}/pick`}
                          className="rounded-md bg-primary px-4 py-3 font-black text-white"
                        >
                          Pick Team
                        </Link>
                        <Link
                          href={`/tournaments/${tournament.id}/leaderboard`}
                          className="rounded-md border border-border bg-white px-4 py-3 font-black text-primary"
                        >
                          Group Standings
                        </Link>
                        <Link
                          href={`/tournaments/${tournament.id}/players`}
                          className="rounded-md border border-border bg-white px-4 py-3 font-black text-primary"
                        >
                          Field Leaderboard
                        </Link>
                      </div>
                    </div>
                  </div>
                </section>
                <GroupLeaderboard
                  rows={rows}
                  tournament={tournament}
                  currentUserId={user.id}
                  preview
                  title="Player standings"
                />
              </div>
              <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
                <h2 className="text-lg font-black">Simple rules</h2>
                <ul className="mt-3 space-y-3 text-sm text-muted">
                  <li>Pick exactly 4 golfers.</li>
                  <li>Stay at 90 points or less.</li>
                  <li>Teams cannot be changed after submission.</li>
                  <li>After the cut, 3 golfers count.</li>
                </ul>
              </section>
            </main>
          </>
        )}
      </AppShell>
    </MajorThemeProvider>
  );
}
