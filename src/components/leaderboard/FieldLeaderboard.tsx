"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, ClipboardList, Search } from "lucide-react";
import { GolferHeadshot } from "@/components/golfers/GolferHeadshot";
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
  const [query, setQuery] = useState("");
  const theme = majorThemes[majorKey];
  const filteredGolfers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return golfers;
    return golfers.filter((golfer) =>
      golfer.golfer.name.toLowerCase().includes(normalizedQuery),
    );
  }, [golfers, query]);
  const podium = filteredGolfers.slice(0, 3);

  return (
    <section className="mock-card overflow-hidden">
      <div className="border-b border-border bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MajorMark majorKey={majorKey} size="sm" />
            <div>
              <p className="sport-label">{theme.shortLabel}</p>
              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h2>
            </div>
          </div>
          <span className="rounded-md bg-[var(--rough)] px-3 py-2 text-right">
            <span className="block text-[10px] font-black uppercase text-muted">Players</span>
            <span className="font-mono text-xl font-black text-primary">{filteredGolfers.length}</span>
          </span>
        </div>

        {podium.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {podium.map((golfer, index) => (
              <Link
                key={golfer.id}
                href={`/tournaments/${golfer.tournamentId}/golfers/${golfer.id}`}
                className="grid grid-cols-[2.75rem_1fr_auto] items-center gap-2 rounded-md border border-border bg-[var(--rough)] px-3 py-2 transition hover:bg-white"
              >
                <GolferHeadshot name={golfer.golfer.name} size="md" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-black uppercase text-muted">#{index + 1}</span>
                  <span className="block truncate text-sm font-black text-primary">{golfer.golfer.name}</span>
                </span>
                <span className="font-mono text-lg font-black text-primary">
                  {formatScoreOrLabel(golfer.totalScore, "-")}
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        <label className="mt-4 flex h-11 items-center gap-2 rounded-md border border-border bg-white px-3 shadow-sm">
          <Search size={18} className="text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search golfers"
            className="w-full bg-transparent text-sm font-semibold outline-none"
          />
        </label>

        <div className="mt-4 hidden grid-cols-[4rem_1fr_4rem_4.5rem_4.5rem_4.5rem_2rem] gap-3 rounded-md bg-[var(--rough)] px-3 py-2 text-xs font-black uppercase text-muted sm:grid">
          <span>Pos</span>
          <span>Player</span>
          <span className="text-right">Cost</span>
          <span className="text-right">Total</span>
          <span className="text-right">Today</span>
          <span className="text-right">Thru</span>
          <span />
        </div>
      </div>

      <div className="divide-y divide-border">
        {filteredGolfers.length === 0 ? (
          <div className="p-6 text-center">
            <ClipboardList className="mx-auto text-muted" size={34} />
            <h3 className="mt-3 text-lg font-black">
              {golfers.length === 0 ? "No golfers loaded" : "No golfers found"}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {golfers.length === 0
                ? "Import the tournament field from admin."
                : "Clear the search to restore the full field."}
            </p>
          </div>
        ) : null}
        {filteredGolfers.map((golfer, index) => {
          const madeCut = golfer.madeCut === true && golfer.status !== "cut";
          return (
            <Link
              key={golfer.id}
              href={`/tournaments/${golfer.tournamentId}/golfers/${golfer.id}`}
              className="grid grid-cols-[2.6rem_1fr_4rem_1rem] items-center gap-3 bg-white px-3 py-3 transition hover:bg-slate-50 sm:grid-cols-[4rem_1fr_4rem_4.5rem_4.5rem_4.5rem_2rem] sm:px-4"
            >
              <span className="font-mono text-sm font-black text-primary metric-number">
                {golfer.position ?? index + 1}
              </span>
              <span className="flex min-w-0 items-center gap-3">
                <GolferHeadshot name={golfer.golfer.name} size="md" />
                <span className="min-w-0">
                  <span className="block truncate text-base font-black leading-tight text-primary">
                    {golfer.golfer.name}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted sm:text-sm">
                    <span>{golfer.golfer.country ?? "Country not set"}</span>
                    <span className="sm:hidden">Cost {formatCost(golfer.pointValue)}</span>
                    <span className="sm:hidden">Today {formatScore(golfer.todayScore)}</span>
                    <span className="sm:hidden">{golfer.thru ?? "Not started"}</span>
                    <CutStatusBadge status={madeCut ? "made_cut" : golfer.status} />
                  </span>
                </span>
              </span>
              <span className="hidden text-right font-mono text-lg font-black tabular-nums text-primary metric-number sm:block">
                {formatCost(golfer.pointValue)}
              </span>
              <span className="text-right font-mono text-xl font-black tabular-nums text-primary metric-number sm:text-2xl">
                {formatScoreOrLabel(golfer.totalScore, "-")}
              </span>
              <span className="hidden text-right font-mono text-xl font-black tabular-nums text-primary metric-number sm:block">
                {formatScore(golfer.todayScore)}
              </span>
              <span className="hidden text-right text-sm font-black text-muted sm:block">
                {golfer.thru ?? "-"}
              </span>
              <ChevronRight size={17} className="text-muted" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
