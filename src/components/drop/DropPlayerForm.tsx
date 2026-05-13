import { dropPlayerAction } from "@/app/actions";
import type { EntryWithDetails, Tournament } from "@/lib/types";
import { formatScore } from "@/lib/utils";

export function DropPlayerForm({
  entry,
  tournament,
}: {
  entry: EntryWithDetails;
  tournament: Tournament;
}) {
  const eligible = entry.picks.filter((pick) => pick.tournamentGolfer.madeCut === true);
  return (
    <form action={dropPlayerAction} className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
      <input type="hidden" name="tournamentId" value={tournament.id} />
      <input type="hidden" name="entryId" value={entry.id} />
      <h1 className="text-2xl font-black">Drop one player</h1>
      <p className="mt-1 text-muted">
        All 4 of your golfers made the cut. Choose 1 to drop before the drop deadline.
      </p>
      <div className="my-4 divide-y divide-border">
        {eligible.map((pick) => (
          <label key={pick.id} className="flex cursor-pointer items-center justify-between gap-3 py-4">
            <span>
              <span className="block font-bold">{pick.tournamentGolfer.golfer.name}</span>
              <span className="text-sm text-muted">
                {pick.tournamentGolfer.position ?? "-"} · {formatScore(pick.tournamentGolfer.totalScore)}
              </span>
            </span>
            <input required type="radio" name="pickId" value={pick.id} className="size-5 accent-primary" />
          </label>
        ))}
      </div>
      <button className="h-12 w-full rounded-md bg-primary px-4 text-base font-black text-white">
        Confirm dropped player
      </button>
    </form>
  );
}
