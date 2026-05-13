import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { FieldLeaderboard } from "@/components/leaderboard/FieldLeaderboard";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireCurrentUser } from "@/lib/auth";
import { getFieldLeaderboard, getTournament } from "@/lib/mock-data/store";

export default async function PlayersLeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireCurrentUser();
  const tournament = getTournament(id);
  if (!tournament) notFound();

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        <main className="space-y-4">
          <Link
            href={`/tournaments/${tournament.id}`}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-bold text-primary"
          >
            <ArrowLeft size={16} /> Back
          </Link>
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <p className="text-sm font-bold uppercase text-muted">
              {tournament.name} {tournament.year}
            </p>
            <h1 className="text-3xl font-black">Field leaderboard</h1>
            <p className="mt-1 text-muted">
              See where Scheffler, McIlroy and the rest of the field sit in the tournament.
            </p>
          </section>
          <FieldLeaderboard golfers={getFieldLeaderboard(tournament.id)} />
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}
