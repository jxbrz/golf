import { notFound } from "next/navigation";
import { dropPlayerAction } from "@/app/actions";
import { AppShell, HeaderInfoButton } from "@/components/layout/AppShell";
import { EntryTeamCard } from "@/components/leaderboard/EntryTeamCard";
import { PickBuilder } from "@/components/picks/PickBuilder";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireCurrentUser } from "@/lib/auth";
import { getDbEntry } from "@/lib/db-data/entries";
import {
  canSubmitPicks,
  getEntry,
  getTournament,
  getTournamentGolfers,
} from "@/lib/mock-data/store";
import type { EntryWithDetails } from "@/lib/types";

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = getTournament(id);
  if (!tournament) notFound();

  const user = await requireCurrentUser();
  const entry = (await getDbEntry(tournament.id, user.id)) ?? getEntry(tournament.id, user.id);
  const locked = !canSubmitPicks(tournament);
  const initialSelectedIds = entry?.picks.map((pick) => pick.tournamentGolfer.id) ?? [];
  const needsDrop = entry?.status === "drop_required";

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell
        tournament={tournament}
        screenTitle="Team"
        screenSubtitle={locked ? "Picks locked" : "Edit until lock"}
        backHref="/"
        activeNav="team"
        rightSlot={<HeaderInfoButton />}
      >
        <main className="space-y-4">
          {entry ? <EntryTeamCard entry={entry} tournament={tournament} /> : null}
          {needsDrop ? <DropSection entry={entry} tournamentId={tournament.id} /> : null}
          <PickBuilder
            tournamentId={tournament.id}
            golfers={getTournamentGolfers(tournament.id)}
            locked={locked}
            initialSelectedIds={initialSelectedIds}
          />
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}

function DropSection({
  entry,
  tournamentId,
}: {
  entry: EntryWithDetails;
  tournamentId: string;
}) {
  const dropOptions = entry.picks.filter(
    (pick) => pick.tournamentGolfer.madeCut === true && !pick.isDropped,
  );

  return (
    <section id="drop" className="app-panel scroll-mt-24 p-4">
      <p className="sport-label">Drop required</p>
      <h2 className="mt-1 text-2xl font-black">Choose 1 golfer to drop</h2>
      <p className="mt-2 text-sm font-semibold text-muted">
        All 4 made the cut, so drop 1 player. Your remaining 3 scores will count.
      </p>
      <div className="mt-4 grid gap-2">
        {dropOptions.map((pick) => (
          <form key={pick.id} action={dropPlayerAction}>
            <input type="hidden" name="tournamentId" value={tournamentId} />
            <input type="hidden" name="entryId" value={entry.id} />
            <input type="hidden" name="pickId" value={pick.id} />
            <button className="flex w-full items-center justify-between rounded-md border border-border bg-white px-3 py-3 text-left font-black text-primary transition hover:bg-slate-50">
              <span>{pick.tournamentGolfer.golfer.name}</span>
              <span className="rounded bg-[var(--secondary)] px-2 py-1 text-[10px] uppercase text-primary">
                Drop
              </span>
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
