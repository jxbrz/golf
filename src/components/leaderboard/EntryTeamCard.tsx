import { PlayerScoreRow } from "@/components/leaderboard/PlayerScoreRow";
import type { EntryWithDetails } from "@/lib/types";
import { formatScoreOrLabel } from "@/lib/utils";

export function EntryTeamCard({ entry }: { entry: EntryWithDetails }) {
  return (
    <section className="app-panel p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="sport-label">Entry</p>
          <h2 className="mt-1 text-2xl font-bold">Your team</h2>
          <p className="text-sm font-semibold text-muted">{entry.totalPoints} points used</p>
        </div>
        <span className="rounded-md bg-primary px-3 py-2 text-right text-white">
          <span className="block text-[10px] font-black uppercase text-white/62">Score</span>
          <span className="font-mono text-xl font-black metric-number">
            {formatScoreOrLabel(entry.liveScore, "-")}
          </span>
        </span>
      </div>
      {entry.picks.map((pick) => (
        <PlayerScoreRow key={pick.id} pick={pick} />
      ))}
    </section>
  );
}
