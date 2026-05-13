import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EntryTeamCard } from "@/components/leaderboard/EntryTeamCard";
import { GroupLeaderboard } from "@/components/leaderboard/GroupLeaderboard";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { TournamentHeader } from "@/components/tournaments/TournamentHeader";
import { getCurrentUser, getEntry, getLeaderboard, getTournament } from "@/lib/mock-data/store";

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const cookieStore = await cookies();
  const user = getCurrentUser(cookieStore.get("mockUserId")?.value);
  const entry = getEntry(tournament.id, user.id);

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        <TournamentHeader tournament={tournament} />
        <main className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <GroupLeaderboard
            rows={getLeaderboard(tournament.id)}
            tournament={tournament}
            currentUserId={user.id}
            revealAll={user.role === "admin"}
          />
          <div className="space-y-4">
            {entry ? <EntryTeamCard entry={entry} /> : null}
            {entry?.status === "drop_required" ? (
              <Link
                href={`/tournaments/${tournament.id}/drop`}
                className="block rounded-lg bg-secondary p-4 text-center text-lg font-black text-white scorecard-shadow"
              >
                Drop required: choose 1 player
              </Link>
            ) : null}
          </div>
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}
