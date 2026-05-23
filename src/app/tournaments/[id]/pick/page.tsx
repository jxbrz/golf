import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell, HeaderInfoButton } from "@/components/layout/AppShell";
import { EntryTeamCard } from "@/components/leaderboard/EntryTeamCard";
import { PickBuilder } from "@/components/picks/PickBuilder";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireCurrentUser } from "@/lib/auth";
import { getDbEntry } from "@/lib/db-data/entries";
import { canSubmitPicks, getEntry, getTournament, getTournamentGolfers } from "@/lib/mock-data/store";

export default async function PickPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const user = await requireCurrentUser();
  if (tournament.status === "final" && user.role !== "admin") {
    redirect(`/tournaments/${tournament.id}/results`);
  }
  const entry = (await getDbEntry(tournament.id, user.id)) ?? getEntry(tournament.id, user.id);
  const locked = Boolean(entry?.submittedAt) || !canSubmitPicks(tournament);

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell
        tournament={tournament}
        screenTitle="Pick Team"
        screenSubtitle="4 picks • 90 points"
        backHref="/"
        activeNav="more"
        rightSlot={<HeaderInfoButton />}
      >
        <main className="space-y-4">
          {error ? (
            <section className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">
              {error}
            </section>
          ) : null}
          {entry?.submittedAt ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
              <EntryTeamCard entry={entry} />
              <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
                <h2 className="text-lg font-black">Team locked</h2>
                <p className="mt-1 text-sm text-muted">
                  Your submitted team is saved. You can review it here any time.
                </p>
                {["round_1", "round_2", "drop_open", "round_3", "round_4", "final"].includes(tournament.status) ? (
                  <Link
                    href={`/tournaments/${tournament.id}/leaderboard`}
                    className="mt-4 flex h-12 items-center justify-center rounded-md bg-primary px-4 font-black text-white"
                  >
                    View standings
                  </Link>
                ) : null}
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
