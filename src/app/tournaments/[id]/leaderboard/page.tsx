import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { GroupLeaderboard } from "@/components/leaderboard/GroupLeaderboard";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireCurrentUser } from "@/lib/auth";
import { getLeaderboard, getTournament } from "@/lib/mock-data/store";

export default async function LeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const user = await requireCurrentUser();
  if (tournament.status === "final" && user.role !== "admin") {
    redirect(`/tournaments/${tournament.id}/results`);
  }
  if (user.role !== "admin" && ["draft", "picks_open", "picks_locked"].includes(tournament.status)) {
    redirect("/");
  }

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        <main className="space-y-4">
          <section className="event-hero rounded-xl p-5 text-white scorecard-shadow sm:p-6">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Standings</h1>
            <p className="mt-2 max-w-2xl text-white/80">
              The live sweepstake table. Tap a name to see the golfers counting for that team.
            </p>
            <Link
              href={`/tournaments/${tournament.id}/players`}
              className="mt-4 inline-flex rounded-md bg-white px-4 py-3 font-black text-primary"
            >
              View field results
            </Link>
          </section>
          <GroupLeaderboard
            rows={getLeaderboard(tournament.id)}
            tournament={tournament}
            currentUserId={user.id}
            revealAll={user.role === "admin"}
            title="Current standings"
          />
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}
