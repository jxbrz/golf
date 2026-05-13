import { notFound } from "next/navigation";
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

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        <main className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h1 className="text-3xl font-black">Group standings</h1>
            <p className="mt-1 text-muted">Your friends from first place to last place. Tap a name to see the full team.</p>
            <Link
              href={`/tournaments/${tournament.id}/players`}
              className="mt-4 inline-flex rounded-md border border-border bg-white px-4 py-3 font-black text-primary"
            >
              View Field Leaderboard
            </Link>
          </section>
          <GroupLeaderboard
            rows={getLeaderboard(tournament.id)}
            tournament={tournament}
            currentUserId={user.id}
            revealAll={user.role === "admin"}
            title="Player standings"
          />
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}
