import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { CutStatusBadge } from "@/components/leaderboard/CutStatusBadge";
import { PlayerScoreRow } from "@/components/leaderboard/PlayerScoreRow";
import type { LeaderboardRow, Tournament } from "@/lib/types";
import { formatScore } from "@/lib/utils";

export function GroupLeaderboard({
  rows,
  tournament,
  preview = false,
  currentUserId,
  revealAll = false,
}: {
  rows: LeaderboardRow[];
  tournament: Tournament;
  preview?: boolean;
  currentUserId?: string;
  revealAll?: boolean;
}) {
  const visibleRows = preview ? rows.slice(0, 4) : rows;
  const picksRevealed =
    new Date() > new Date(tournament.pickDeadline) ||
    !["draft", "picks_open"].includes(tournament.status);

  return (
    <section className="rounded-lg border border-border bg-surface scorecard-shadow">
      <div className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 className="text-lg font-bold">Group leaderboard</h2>
          <p className="text-sm text-muted">
            {["drop_open", "round_3", "round_4", "final"].includes(tournament.status)
              ? "Counting 3 players after the cut"
              : "Pre-cut live score: all 4 players count"}
          </p>
        </div>
        {preview ? (
          <Link
            href={`/tournaments/${tournament.id}/leaderboard`}
            className="rounded-md bg-primary px-3 py-2 text-sm font-bold text-white"
          >
            View all
          </Link>
        ) : null}
      </div>
      <div className="divide-y divide-border">
        {visibleRows.map((row) => (
          <details key={row.entry.id} className="group">
            <summary className="grid cursor-pointer list-none grid-cols-[2rem_1fr_auto_1.5rem] items-center gap-2 p-4">
              <span className="font-mono text-lg font-bold text-primary">{row.rank}</span>
              <span>
                <span className="block font-bold">{row.entry.user.name}</span>
                <span className="mt-1 block">
                  <CutStatusBadge status={row.needsDrop ? "drop_required" : row.status} />
                </span>
              </span>
              <span className="font-mono text-xl font-bold">
                {picksRevealed || revealAll || row.entry.userId === currentUserId
                  ? formatScore(row.score)
                  : "Locked"}
              </span>
              <ChevronDown className="text-muted transition group-open:rotate-180" size={18} />
            </summary>
            <div className="px-4 pb-4">
              {picksRevealed || revealAll || row.entry.userId === currentUserId ? (
                row.entry.picks.map((pick) => <PlayerScoreRow key={pick.id} pick={pick} />)
              ) : (
                <p className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-muted">
                  This team is hidden until the pick deadline has passed.
                </p>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
