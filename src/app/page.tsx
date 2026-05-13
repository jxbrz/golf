import { cookies } from "next/headers";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EntryTeamCard } from "@/components/leaderboard/EntryTeamCard";
import { GroupLeaderboard } from "@/components/leaderboard/GroupLeaderboard";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { TournamentHeader } from "@/components/tournaments/TournamentHeader";
import {
  getActiveTournament,
  getCurrentUser,
  getEntry,
  getLeaderboard,
} from "@/lib/mock-data/store";

export default async function Home() {
  const tournament = getActiveTournament();
  const cookieStore = await cookies();
  const user = getCurrentUser(cookieStore.get("mockUserId")?.value);
  const entry = getEntry(tournament.id, user.id);
  const rows = getLeaderboard(tournament.id);

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        <TournamentHeader tournament={tournament} />
        <main className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-4">
            <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
              <div className="flex gap-3">
                {entry ? (
                  <CheckCircle2 className="mt-1 shrink-0 text-emerald-700" />
                ) : (
                  <AlertTriangle className="mt-1 shrink-0 text-secondary" />
                )}
                <div>
                  <h2 className="text-xl font-black">
                    {entry ? "Your team is submitted" : "Pick your team"}
                  </h2>
                  <p className="mt-1 text-muted">
                    {entry
                      ? "Submitted teams are locked. You can view scores as the tournament moves on."
                      : "Choose 4 golfers with a combined value of 90 points or less."}
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
                      Live Leaderboard
                    </Link>
                  </div>
                </div>
              </div>
            </section>
            <GroupLeaderboard rows={rows} tournament={tournament} currentUserId={user.id} preview />
          </div>
          {entry ? (
            <EntryTeamCard entry={entry} />
          ) : (
            <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
              <h2 className="text-lg font-black">Simple rules</h2>
              <ul className="mt-3 space-y-3 text-sm text-muted">
                <li>Pick exactly 4 golfers.</li>
                <li>Stay at 90 points or less.</li>
                <li>Teams cannot be changed after submission.</li>
                <li>After the cut, 3 golfers count.</li>
              </ul>
            </section>
          )}
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}
