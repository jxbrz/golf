import Link from "next/link";
import { CutStatusBadge } from "@/components/leaderboard/CutStatusBadge";
import type { EntryWithDetails, TournamentGolfer } from "@/lib/types";
import { formatScore } from "@/lib/utils";

export function PlayerScoreRow({
  pick,
  golfer,
}: {
  pick?: EntryWithDetails["picks"][number];
  golfer?: TournamentGolfer & { golfer: { name: string; country: string | null } };
}) {
  const row = pick?.tournamentGolfer ?? golfer;
  if (!row) return null;
  const madeCut = row.madeCut === true && row.status !== "cut";

  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-border py-3 last:border-b-0">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/tournaments/${row.tournamentId}/golfers/${row.id}`}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            {row.golfer.name}
          </Link>
          {pick?.isDropped ? <CutStatusBadge status="needs_drop" /> : null}
          {pick?.isCounting ? <CutStatusBadge status="made_cut" /> : null}
        </div>
        <p className="mt-1 text-sm text-muted">
          {row.position ?? "-"} · Today {formatScore(row.todayScore)} · {row.thru ?? "-"}
        </p>
      </div>
      <div className="text-right">
        <p className="font-mono text-xl font-bold">{formatScore(row.totalScore)}</p>
        <div className="mt-1">
          <CutStatusBadge status={madeCut ? "made_cut" : row.status} />
        </div>
      </div>
    </div>
  );
}
