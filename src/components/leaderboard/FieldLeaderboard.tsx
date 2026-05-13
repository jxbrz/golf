import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { CutStatusBadge } from "@/components/leaderboard/CutStatusBadge";
import type { TournamentGolfer } from "@/lib/types";
import { formatScore, formatScoreOrLabel } from "@/lib/utils";

export function FieldLeaderboard({
  golfers,
}: {
  golfers: Array<TournamentGolfer & { golfer: { name: string; country: string | null } }>;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface scorecard-shadow">
      <div className="border-b border-border bg-white p-4">
        <h2 className="text-xl font-black">Field leaderboard</h2>
        <p className="mt-1 text-sm text-muted">The actual tournament scores for every golfer.</p>
      </div>
      <div className="divide-y divide-border">
        {golfers.length === 0 ? (
          <div className="p-6 text-center">
            <ClipboardList className="mx-auto text-muted" size={34} />
            <h3 className="mt-3 text-lg font-black">No golfers loaded</h3>
            <p className="mt-1 text-sm text-muted">Import the tournament field from admin.</p>
          </div>
        ) : null}
        {golfers.map((golfer, index) => {
          const madeCut = golfer.madeCut === true && golfer.status !== "cut";
          return (
            <Link
              key={golfer.id}
              href={`/tournaments/${golfer.tournamentId}/golfers/${golfer.id}`}
              className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 p-4 transition hover:bg-slate-50"
            >
              <span className="flex size-10 items-center justify-center rounded-md border border-border bg-white font-mono text-lg font-black text-primary">
                {golfer.position ?? index + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-lg font-black leading-tight text-primary">
                  {golfer.golfer.name}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <span>{golfer.golfer.country ?? "Country not set"}</span>
                  <span>Today {formatScore(golfer.todayScore)}</span>
                  <span>{golfer.thru ?? "Not started"}</span>
                  <CutStatusBadge status={madeCut ? "made_cut" : golfer.status} />
                </span>
              </span>
              <span className="text-right font-mono text-2xl font-black tabular-nums text-primary">
                {formatScoreOrLabel(golfer.totalScore, "-")}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
