import { updateGolferScoreAction } from "@/app/actions";
import type { TournamentGolfer, User } from "@/lib/types";
import { formatScore } from "@/lib/utils";

export function AdminScoreEditor({
  tournamentId,
  adminUser,
  golfers,
}: {
  tournamentId: string;
  adminUser: User;
  golfers: Array<TournamentGolfer & { golfer: { name: string; country: string | null } }>;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface scorecard-shadow">
      <div className="border-b border-border p-4">
        <h2 className="text-xl font-black">Edit scores</h2>
        <p className="mt-1 text-sm text-muted">Every change is logged as an admin override.</p>
      </div>
      <div className="divide-y divide-border">
        {golfers.map((row) => (
          <div key={row.id} className="p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{row.golfer.name}</p>
                <p className="text-sm text-muted">
                  {row.position ?? "-"} · Total {formatScore(row.totalScore)} · Today{" "}
                  {formatScore(row.todayScore)} · {row.status.toUpperCase()}
                </p>
              </div>
              <span className="rounded-md border border-border px-2 py-1 font-mono font-black">
                {row.pointValue}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              <ScoreForm label="Total" field="totalScore" defaultValue={formatScore(row.totalScore)} rowId={row.id} tournamentId={tournamentId} adminUserId={adminUser.id} />
              <ScoreForm label="Today" field="todayScore" defaultValue={formatScore(row.todayScore)} rowId={row.id} tournamentId={tournamentId} adminUserId={adminUser.id} />
              <ScoreForm label="Pos" field="position" defaultValue={row.position ?? ""} rowId={row.id} tournamentId={tournamentId} adminUserId={adminUser.id} />
              <ScoreForm label="Thru" field="thru" defaultValue={row.thru ?? ""} rowId={row.id} tournamentId={tournamentId} adminUserId={adminUser.id} />
              <ScoreForm label="Cut" field="madeCut" defaultValue={String(row.madeCut === true)} rowId={row.id} tournamentId={tournamentId} adminUserId={adminUser.id} />
              <ScoreForm label="Status" field="status" defaultValue={row.status} rowId={row.id} tournamentId={tournamentId} adminUserId={adminUser.id} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScoreForm({
  label,
  field,
  defaultValue,
  rowId,
  tournamentId,
  adminUserId,
}: {
  label: string;
  field: string;
  defaultValue: string;
  rowId: string;
  tournamentId: string;
  adminUserId: string;
}) {
  return (
    <form action={updateGolferScoreAction} className="space-y-1">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <input type="hidden" name="adminUserId" value={adminUserId} />
      <input type="hidden" name="tournamentGolferId" value={rowId} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="reason" value={`${label} update`} />
      <label className="text-xs font-bold uppercase text-muted">{label}</label>
      <div className="flex gap-1">
        <input
          name="value"
          defaultValue={defaultValue}
          className="h-10 min-w-0 flex-1 rounded-md border border-border px-2 text-sm font-semibold"
        />
        <button className="h-10 rounded-md bg-primary px-2 text-xs font-bold text-white">Save</button>
      </div>
    </form>
  );
}
