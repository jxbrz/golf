import Link from "next/link";
import { GolferHeadshot } from "@/components/golfers/GolferHeadshot";
import { CutStatusBadge } from "@/components/leaderboard/CutStatusBadge";
import type { EntryWithDetails, TournamentGolfer } from "@/lib/types";
import { formatCost, formatScore, formatScoreOrLabel } from "@/lib/utils";

export function PlayerScoreRow({
  pick,
  golfer,
  cutFinalized = false,
}: {
  pick?: EntryWithDetails["picks"][number];
  golfer?: TournamentGolfer & { golfer: { name: string; country: string | null } };
  cutFinalized?: boolean;
}) {
  const row = pick?.tournamentGolfer ?? golfer;
  if (!row) return null;
  const madeCut = cutFinalized && row.madeCut === true && row.status !== "cut";
  const status = madeCut ? "made_cut" : row.status;
  const score = row.totalScore === null && row.status === "wd" ? "WD" : formatScoreOrLabel(row.totalScore, "Not started");

  return (
    <div className="grid grid-cols-[2rem_1fr_auto] gap-3 border-b border-border py-3 last:border-b-0">
      <GolferHeadshot name={row.golfer.name} size="sm" />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/tournaments/${row.tournamentId}/golfers/${row.id}`}
            className="font-black text-primary underline-offset-4 hover:underline"
          >
            {row.golfer.name}
          </Link>
          {pick?.isDropped ? <CutStatusBadge status="dropped" /> : null}
          {pick?.isCounting && !pick.isDropped ? <CutStatusBadge status="counting" /> : null}
        </div>
        <p className="mt-1 text-xs font-bold uppercase text-muted">
          {row.position ?? "Not started"} - Today {formatScore(row.todayScore)} - {row.thru ?? "-"} - Cost{" "}
          {formatCost(pick?.pointValueAtPick ?? row.pointValue)}
        </p>
      </div>
      <div className="text-right">
        <p className="font-mono text-xl font-black text-primary metric-number">
          {score}
        </p>
        <div className="mt-1">
          <CutStatusBadge status={status} />
        </div>
      </div>
    </div>
  );
}
