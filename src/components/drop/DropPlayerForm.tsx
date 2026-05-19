"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CircleMinus } from "lucide-react";
import { dropPlayerAction } from "@/app/actions";
import type { EntryWithDetails, Tournament } from "@/lib/types";
import { cn, formatScoreOrLabel } from "@/lib/utils";

export function DropPlayerForm({
  entry,
  tournament,
}: {
  entry: EntryWithDetails;
  tournament: Tournament;
}) {
  const eligible = entry.picks.filter((pick) => pick.tournamentGolfer.madeCut === true);
  const [selectedPickId, setSelectedPickId] = useState(eligible[0]?.id ?? "");
  const selectedPick = eligible.find((pick) => pick.id === selectedPickId);
  const countingPlayers = useMemo(
    () => eligible.filter((pick) => pick.id !== selectedPickId),
    [eligible, selectedPickId],
  );

  return (
    <form action={dropPlayerAction} className="space-y-4">
      <input type="hidden" name="tournamentId" value={tournament.id} />
      <input type="hidden" name="entryId" value={entry.id} />
      <input type="hidden" name="pickId" value={selectedPickId} />

      <section className="event-hero rounded-xl p-5 text-white scorecard-shadow">
        <h1 className="text-3xl font-black">Drop one player</h1>
        <p className="mt-2 max-w-2xl text-white/80">
          Choose the one player you do not want to count. Your other 3 players will stay in your score.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-surface p-3 scorecard-shadow">
        <div className="space-y-3">
          {eligible.map((pick) => {
            const selected = pick.id === selectedPickId;
            return (
              <button
                key={pick.id}
                type="button"
                onClick={() => setSelectedPickId(pick.id)}
                className={cn(
                  "grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-md border p-4 text-left transition",
                  selected
                    ? "border-rose-200 bg-rose-50 text-rose-950"
                    : "border-border bg-white",
                )}
              >
                <span>
                  <span className="flex items-center gap-2 text-lg font-black">
                    {selected ? <CircleMinus size={20} className="text-rose-700" /> : null}
                    {pick.tournamentGolfer.golfer.name}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {pick.tournamentGolfer.position ?? "-"} -{" "}
                    {formatScoreOrLabel(pick.tournamentGolfer.totalScore)}
                  </span>
                </span>
                <span className="rounded-md border border-border bg-white px-3 py-2 font-mono text-xl font-black">
                  {formatScoreOrLabel(pick.tournamentGolfer.totalScore)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="paper-panel rounded-lg border border-border p-4 scorecard-shadow">
        <h2 className="text-lg font-black">Confirm your choice</h2>
        <p className="mt-2 text-sm text-muted">
          Dropping:{" "}
          <span className="font-black text-rose-800">
            {selectedPick?.tournamentGolfer.golfer.name ?? "Choose a player"}
          </span>
        </p>
        <div className="mt-3 rounded-md bg-emerald-50 p-3">
          <p className="text-sm font-black text-emerald-900">These 3 will count</p>
          <div className="mt-2 space-y-1">
            {countingPlayers.map((pick) => (
              <p key={pick.id} className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 size={16} className="text-emerald-700" />
                {pick.tournamentGolfer.golfer.name}
              </p>
            ))}
          </div>
        </div>
        <button
          disabled={!selectedPickId}
          className="mt-4 h-12 w-full rounded-md bg-primary px-4 text-base font-black text-white disabled:bg-slate-300 disabled:text-slate-600"
        >
          Confirm dropped player
        </button>
      </section>
    </form>
  );
}
