import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell, HeaderInfoButton } from "@/components/layout/AppShell";
import { EntryTeamCard } from "@/components/leaderboard/EntryTeamCard";
import { PickBuilder } from "@/components/picks/PickBuilder";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireCurrentUser } from "@/lib/auth";
import { canSubmitDbPicksForCompetitionStatus, getActiveDbGroupCompetition, getDbEntry } from "@/lib/db-data/entries";
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
  const [dbEntry, dbCompetition] = await Promise.all([
    getDbEntry(tournament.id, user.id),
    getActiveDbGroupCompetition(tournament.id),
  ]);
  const entry = dbEntry ?? getEntry(tournament.id, user.id);
  const dbCanEdit = dbCompetition ? canSubmitDbPicksForCompetitionStatus(dbCompetition.status) : null;
  const locked = dbCanEdit === null ? !canSubmitPicks(tournament) : !dbCanEdit;
  const initialSelectedIds = entry?.picks.map((pick) => pick.tournamentGolfer.id) ?? [];

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell
        tournament={tournament}
        screenTitle="Pick Team"
        screenSubtitle="4 picks • 90 points"
        backHref="/"
        activeNav="team"
        rightSlot={<HeaderInfoButton />}
      >
        <main className="space-y-4">
          {error ? (
            <section className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">
              {error}
            </section>
          ) : null}
          <section className={`rounded-lg border p-3 text-sm font-black ${
            locked
              ? "border-amber-200 bg-amber-50 text-amber-950"
              : "border-emerald-200 bg-emerald-50 text-emerald-950"
          }`}>
            {locked
              ? "Picks are locked. You can review your saved team, but edits are disabled."
              : entry?.submittedAt
                ? "Picks are open. You can still edit and resubmit this team."
                : "Picks are open. Submit 4 golfers within the 90 point budget."}
          </section>
          {entry?.submittedAt && locked ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
              <EntryTeamCard entry={entry} tournament={tournament} />
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
              initialSelectedIds={initialSelectedIds}
            />
          )}
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}
