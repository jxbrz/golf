import Link from "next/link";
import { ChevronDown, ClipboardList } from "lucide-react";
import { CutStatusBadge } from "@/components/leaderboard/CutStatusBadge";
import { PlayerScoreRow } from "@/components/leaderboard/PlayerScoreRow";
import type { LeaderboardRow, Tournament } from "@/lib/types";
import { formatScoreOrLabel } from "@/lib/utils";

export function GroupLeaderboard({
  rows,
  tournament,
  preview = false,
  currentUserId,
  revealAll = false,
  title = "Current standings",
}: {
  rows: LeaderboardRow[];
  tournament: Tournament;
  preview?: boolean;
  currentUserId?: string;
  revealAll?: boolean;
  title?: string;
}) {
  const visibleRows = preview ? rows.slice(0, 3) : rows;
  const picksRevealed =
    new Date() > new Date(tournament.pickDeadline) ||
    !["draft", "picks_open"].includes(tournament.status);
  const scoreText = (row: LeaderboardRow) => {
    if (!picksRevealed && !revealAll && row.entry.userId !== currentUserId) {
      return "Picks hidden";
    }
    if (row.status === "drop_required") return "Pending";
    if (row.status === "eliminated") return "Out";
    return formatScoreOrLabel(row.score, "Not started");
  };

  return (
    <section className="app-panel">
      <div className="app-panel-header flex items-center justify-between gap-3 p-4">
        <div>
          <p className="sport-label">Group Standings</p>
          <h2 className="mt-1 text-2xl font-black">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-muted">
            {["drop_open", "round_3", "round_4", "final"].includes(tournament.status)
              ? "Best 3 scores count after the cut"
              : "Best 3 available scores count"}
          </p>
        </div>
        {preview ? (
          <Link
            href={`/tournaments/${tournament.id}/leaderboard`}
            className="app-button"
          >
            View all
          </Link>
        ) : null}
      </div>
      <div className="divide-y divide-border">
        {visibleRows.length === 0 ? (
          <div className="p-6 text-center">
            <ClipboardList className="mx-auto text-muted" size={34} />
            <h3 className="mt-3 text-lg font-black">No teams submitted yet</h3>
            <p className="mt-1 text-sm text-muted">
              Once players submit their 4 golfers, the leaderboard will appear here.
            </p>
          </div>
        ) : null}
        {visibleRows.map((row) => (
          <details
            key={row.entry.id}
            className={row.entry.userId === currentUserId ? "group bg-emerald-50/60" : "group bg-white"}
          >
            <summary className="grid cursor-pointer list-none grid-cols-[2.75rem_1fr_auto_1.5rem] items-center gap-3 p-4 transition hover:bg-slate-50">
              <span className="flex size-10 items-center justify-center rounded-md bg-[var(--rough)] font-mono text-lg font-black text-primary metric-number">
                {row.rank}
              </span>
              <span>
                <span className="block text-lg font-black leading-tight">
                  {row.entry.user.name}
                  {row.entry.userId === currentUserId ? (
                    <span className="ml-2 align-middle text-xs font-black uppercase text-emerald-800">
                      You
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block">
                  <CutStatusBadge status={row.needsDrop ? "drop_required" : row.status} />
                </span>
              </span>
              <span className="font-mono text-2xl font-black tabular-nums text-primary metric-number">
                {scoreText(row)}
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
