import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { EntryTeamCard } from "@/components/leaderboard/EntryTeamCard";
import { PickBuilder } from "@/components/picks/PickBuilder";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireCurrentUser } from "@/lib/auth";
import { canSubmitPicks, getEntry, getTournament, getTournamentGolfers } from "@/lib/mock-data/store";

export default async function PickPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const user = await requireCurrentUser();
  if (tournament.status === "final" && user.role !== "admin") {
    redirect(`/tournaments/${tournament.id}/results`);
  }
  const entry = getEntry(tournament.id, user.id);
  const locked = Boolean(entry?.submittedAt) || !canSubmitPicks(tournament);

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        <main className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h1 className="text-3xl font-black">Pick your team</h1>
            <p className="mt-1 text-muted">
              Pick exactly 4 golfers under the 90 point cap. Once submitted, your team is locked.
            </p>
            {locked ? (
              <p className="mt-3 rounded-md bg-amber-50 p-3 font-bold text-amber-900">
                Your team has been submitted. Submitted teams cannot be changed by players.
              </p>
            ) : null}
          </section>
          {entry?.submittedAt ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
              <EntryTeamCard entry={entry} />
              <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
                <h2 className="text-lg font-black">Team locked</h2>
                <p className="mt-1 text-sm text-muted">
                  Your submitted team is saved. The leaderboard is the main screen from here.
                </p>
                <Link
                  href={`/tournaments/${tournament.id}/leaderboard`}
                  className="mt-4 flex h-12 items-center justify-center rounded-md bg-primary px-4 font-black text-white"
                >
                  View Current Standings
                </Link>
              </section>
            </div>
          ) : (
            <PickBuilder
              tournamentId={tournament.id}
              golfers={getTournamentGolfers(tournament.id)}
              locked={locked}
            />
          )}
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}
