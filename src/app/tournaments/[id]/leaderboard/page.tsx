import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { GroupLeaderboard } from "@/components/leaderboard/GroupLeaderboard";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { getCurrentUser, getLeaderboard, getTournament } from "@/lib/mock-data/store";

export default async function LeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const cookieStore = await cookies();
  const user = getCurrentUser(cookieStore.get("mockUserId")?.value);

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        <main className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h1 className="text-3xl font-black">Live leaderboard</h1>
            <p className="mt-1 text-muted">Tap a name to see the full team and cut status.</p>
          </section>
          <GroupLeaderboard
            rows={getLeaderboard(tournament.id)}
            tournament={tournament}
            currentUserId={user.id}
            revealAll={user.role === "admin"}
          />
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}
