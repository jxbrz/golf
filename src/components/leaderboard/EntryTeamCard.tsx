import { PlayerScoreRow } from "@/components/leaderboard/PlayerScoreRow";
import type { EntryWithDetails } from "@/lib/types";
import { formatScoreOrLabel } from "@/lib/utils";

export function EntryTeamCard({ entry }: { entry: EntryWithDetails }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Your team</h2>
          <p className="text-sm text-muted">{entry.totalPoints} points used</p>
        </div>
        <p className="font-mono text-2xl font-bold">
          {formatScoreOrLabel(entry.liveScore, "Not started")}
        </p>
      </div>
      {entry.picks.map((pick) => (
        <PlayerScoreRow key={pick.id} pick={pick} />
      ))}
    </section>
  );
}
