import { adminUpdateEntryPicksAction } from "@/app/actions";
import { CutStatusBadge } from "@/components/leaderboard/CutStatusBadge";
import type { AdminEntryRow, TournamentGolfer } from "@/lib/types";
import { formatCost } from "@/lib/utils";

export function AdminEntriesEditor({
  tournamentId,
  rows,
  golfers,
  error,
}: {
  tournamentId: string;
  rows: AdminEntryRow[];
  golfers: Array<TournamentGolfer & { golfer: { name: string; country: string | null } }>;
  error?: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface scorecard-shadow">
      <div className="border-b border-border p-4">
        <h2 className="text-xl font-black">Manage entries</h2>
        <p className="mt-1 text-sm text-muted">
          Change picks for any player. Add a reason so the correction is logged.
        </p>
        {error === "reason" ? (
          <p className="mt-3 rounded-md bg-rose-50 p-3 text-sm font-bold text-rose-800">
            Please enter a reason before saving changes.
          </p>
        ) : null}
        {error === "invalid" ? (
          <p className="mt-3 rounded-md bg-rose-50 p-3 text-sm font-bold text-rose-800">
            Choose exactly 4 different golfers and keep the total at 90 points or less.
          </p>
        ) : null}
      </div>
      <div className="divide-y divide-border">
        {rows.map((row) => {
          const picks = row.entry?.picks ?? [];
          const currentIds = picks.map((pick) => pick.tournamentGolferId);
          return (
            <form key={row.user.id} action={adminUpdateEntryPicksAction} className="space-y-4 p-4">
              <input type="hidden" name="tournamentId" value={tournamentId} />
              <input type="hidden" name="userId" value={row.user.id} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">{row.user.name}</h3>
                  <p className="text-sm text-muted">
                    {row.entry ? `${row.entry.totalPoints} points used` : "No team submitted"}
                  </p>
                </div>
                {row.entry ? <CutStatusBadge status={row.entry.status} /> : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {[0, 1, 2, 3].map((index) => (
                  <label key={index} className="block">
                    <span className="text-xs font-black uppercase text-muted">
                      Pick {index + 1}
                    </span>
                    <select
                      name={`pick${index + 1}`}
                      defaultValue={currentIds[index] ?? ""}
                      required
                      className="mt-1 h-11 w-full rounded-md border border-border bg-white px-3 text-sm font-semibold"
                    >
                      <option value="">Choose golfer</option>
                      {golfers.filter((golfer) => golfer.pointValue !== null).map((golfer) => (
                        <option key={golfer.id} value={golfer.id}>
                          {formatCost(golfer.pointValue)} - {golfer.golfer.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <label className="block">
                <span className="text-xs font-black uppercase text-muted">Reason</span>
                <input
                  name="reason"
                  required
                  placeholder="Example: corrected typo from message"
                  className="mt-1 h-11 w-full rounded-md border border-border px-3 text-sm font-semibold"
                />
              </label>
              <button className="h-11 w-full rounded-md bg-primary px-4 font-black text-white sm:w-auto">
                Save entry changes
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
