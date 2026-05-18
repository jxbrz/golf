import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { CutStatusBadge } from "@/components/leaderboard/CutStatusBadge";
import { MajorMark } from "@/components/theme/MajorMark";
import { majorThemes } from "@/lib/theme/major-themes";
import type { MajorKey, TournamentGolfer } from "@/lib/types";
import { formatCost, formatScore, formatScoreOrLabel } from "@/lib/utils";

export function FieldLeaderboard({
  golfers,
  majorKey,
  title = "Field leaderboard",
}: {
  golfers: Array<TournamentGolfer & { golfer: { name: string; country: string | null } }>;
  majorKey: MajorKey;
  title?: string;
}) {
  const theme = majorThemes[majorKey];

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface scorecard-shadow">
      <div className="border-b border-border bg-white p-4">
        <div className="flex items-center gap-3">
          <MajorMark majorKey={majorKey} size="sm" />
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-muted">
              {theme.shortLabel}
            </p>
            <h2 className="text-xl font-black">{title}</h2>
          </div>
        </div>
        <div className="mt-4 hidden grid-cols-[4.5rem_1fr_4rem_4.5rem_4.5rem_4.5rem] gap-3 rounded-md bg-slate-50 px-3 py-2 text-xs font-black uppercase text-muted sm:grid">
          <span>Pos</span>
          <span>Player</span>
          <span className="text-right">Cost</span>
          <span className="text-right">Total</span>
          <span className="text-right">Today</span>
          <span className="text-right">Thru</span>
        </div>
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
              className="grid grid-cols-[3.5rem_1fr_4rem] items-center gap-3 p-4 transition hover:bg-slate-50 sm:grid-cols-[4.5rem_1fr_4rem_4.5rem_4.5rem_4.5rem]"
            >
              <span className="flex min-h-10 items-center justify-center rounded-md border border-border bg-white px-1 font-mono text-sm font-black text-primary sm:text-base">
                {golfer.position ?? index + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-lg font-black leading-tight text-primary">
                  {golfer.golfer.name}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted sm:text-sm">
                  <span>{golfer.golfer.country ?? "Country not set"}</span>
                  <span>Cost {formatCost(golfer.pointValue)}</span>
                  <span className="sm:hidden">Today {formatScore(golfer.todayScore)}</span>
                  <span className="sm:hidden">{golfer.thru ?? "Not started"}</span>
                  <CutStatusBadge status={madeCut ? "made_cut" : golfer.status} />
                </span>
              </span>
              <span className="hidden text-right font-mono text-lg font-black tabular-nums text-primary sm:block">
                {formatCost(golfer.pointValue)}
              </span>
              <span className="text-right font-mono text-2xl font-black tabular-nums text-primary">
                {formatScoreOrLabel(golfer.totalScore, "-")}
              </span>
              <span className="hidden text-right font-mono text-xl font-black tabular-nums text-primary sm:block">
                {formatScore(golfer.todayScore)}
              </span>
              <span className="hidden text-right text-sm font-black text-muted sm:block">
                {golfer.thru ?? "-"}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
