import { PlayerScoreRow } from "@/components/leaderboard/PlayerScoreRow";
import type { EntryWithDetails } from "@/lib/types";
import { formatScoreOrLabel } from "@/lib/utils";

export function EntryTeamCard({ entry }: { entry: EntryWithDetails }) {
  return (
    <section className="app-panel p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="sport-label">Entry</p>
          <h2 className="mt-1 text-lg font-black">Your team</h2>
          <p className="text-sm font-semibold text-muted">{entry.totalPoints} points used</p>
        </div>
        <p className="font-mono text-2xl font-black metric-number text-primary">
          {formatScoreOrLabel(entry.liveScore, "Not started")}
        </p>
      </div>
      {entry.picks.map((pick) => (
        <PlayerScoreRow key={pick.id} pick={pick} />
      ))}
    </section>
  );
}
