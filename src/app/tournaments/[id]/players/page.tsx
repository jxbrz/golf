import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Flag } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { FieldLeaderboard } from "@/components/leaderboard/FieldLeaderboard";
import { MajorMark } from "@/components/theme/MajorMark";
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
  const title = tournament.status === "final" ? "Field results" : "Field leaderboard";

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
          <section className="event-hero rounded-xl p-5 text-white scorecard-shadow sm:p-6">
            <div className="flex items-start gap-3">
              <MajorMark majorKey={tournament.majorKey} size="lg" />
              <div>
                <p className="text-sm font-bold uppercase text-white/70">
                  {tournament.name} {tournament.year}
                </p>
                <h1 className="text-3xl font-black">{title}</h1>
                <p className="mt-1 max-w-2xl text-white/80">
                  The tournament leaderboard. Cut players are removed after the cut, but remain visible inside picked teams.
                </p>
              </div>
              <Flag className="ml-auto hidden text-white/50 sm:block" size={36} />
            </div>
          </section>
          <FieldLeaderboard
            golfers={getFieldLeaderboard(tournament.id)}
            majorKey={tournament.majorKey}
            title={title}
          />
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}
