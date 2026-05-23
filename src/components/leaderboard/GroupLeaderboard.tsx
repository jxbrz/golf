import Link from "next/link";
import { ChevronRight, ClipboardList } from "lucide-react";
import { PlayerScoreRow } from "@/components/leaderboard/PlayerScoreRow";
import { isCutFinalizedStatus } from "@/lib/tournament-status";
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
  const visibleRows = preview ? rows.slice(0, 4) : rows;
  const cutFinalized = isCutFinalizedStatus(tournament.status);
  const picksRevealed =
    new Date() > new Date(tournament.pickDeadline) ||
    !["draft", "picks_open"].includes(tournament.status);
  const scoreText = (row: LeaderboardRow) => {
    if (!picksRevealed && !revealAll && row.entry.userId !== currentUserId) {
      return "Hidden";
    }
    if (row.status === "drop_required") return "Pending";
    if (row.status === "eliminated") return "Out";
    return formatScoreOrLabel(row.score, "-");
  };

  return (
    <section className="mock-card overflow-hidden">
      <div className="sr-only">
        <h2>{title}</h2>
      </div>
      {preview ? (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="sport-label">Standings</p>
          <Link
            href={`/tournaments/${tournament.id}/leaderboard`}
            className="rounded-md bg-primary px-3 py-2 text-sm font-black text-white"
          >
            View all
          </Link>
        </div>
      ) : null}
      <div className="grid grid-cols-[3.5rem_1fr_4.5rem_3.5rem] gap-2 border-b border-border bg-[var(--rough)] px-3 py-2 text-[10px] font-black uppercase text-muted">
        <span>Pos</span>
        <span>Team</span>
        <span className="text-right">Best 3 of 4</span>
        <span className="text-right">Pts</span>
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
        {visibleRows.map((row) => {
          const isCurrentUser = row.entry.userId === currentUserId;
          return (
            <details
              key={row.entry.id}
              id={`entry-${row.entry.userId}`}
              className={isCurrentUser ? "group scroll-mt-24 bg-emerald-50/70" : "group scroll-mt-24 bg-white"}
            >
              <summary className="grid cursor-pointer list-none grid-cols-[3.5rem_1fr_4.5rem_3.5rem_1rem] items-center gap-2 px-3 py-3 transition hover:bg-slate-50">
                <span className="flex items-center gap-1.5 font-mono text-sm font-black text-primary metric-number">
                  {row.rank}
                  <span className="hidden">
                    {row.rank % 2 === 0 ? "↓1" : row.rank % 3 === 0 ? "—" : "↑2"}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className={isCurrentUser ? "block truncate text-sm font-black text-[var(--fairway)]" : "block truncate text-sm font-black text-primary"}>
                    {isCurrentUser ? "Your Team" : row.entry.user.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-semibold text-muted">
                    {row.entry.user.name}
                  </span>
                </span>
                <span className="text-right font-mono text-sm font-black text-primary metric-number">
                  {scoreText(row)}
                </span>
                <span className="text-right font-mono text-sm font-black text-primary metric-number">
                  {row.entry.totalPoints}
                </span>
                <ChevronRight className="text-muted transition group-open:rotate-90" size={16} />
              </summary>
              <div className="bg-white px-3 pb-3">
                {picksRevealed || revealAll || isCurrentUser ? (
                  row.entry.picks.map((pick) => (
                    <PlayerScoreRow key={pick.id} pick={pick} cutFinalized={cutFinalized} />
                  ))
                ) : (
                  <p className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-muted">
                    This team is hidden until the pick deadline has passed.
                  </p>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
