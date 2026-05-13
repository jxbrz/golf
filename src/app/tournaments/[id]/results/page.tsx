import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Medal, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CutStatusBadge } from "@/components/leaderboard/CutStatusBadge";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import {
  getLeaderboard,
  getLowestRoundSummary,
  getTournament,
} from "@/lib/mock-data/store";
import { formatScoreOrLabel } from "@/lib/utils";

const podiumStyles: Record<number, string> = {
  1: "bg-[#f8e8a0] text-[#3f2d00] border-[#d6ad2f]",
  2: "bg-slate-100 text-slate-900 border-slate-300",
  3: "bg-[#ead2bd] text-[#4a2c17] border-[#c28a59]",
};

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const rows = getLeaderboard(tournament.id);
  const lowestRound = getLowestRoundSummary(tournament.id);

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        <main className="space-y-4">
          <Link
            href={`/tournaments/${tournament.id}/leaderboard`}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-bold text-primary"
          >
            <ArrowLeft size={16} /> Leaderboard
          </Link>

          <section className="overflow-hidden rounded-lg border border-border bg-surface scorecard-shadow">
            <div className="bg-primary p-5 text-white">
              <p className="text-sm font-bold uppercase tracking-wide text-white/75">
                Final results
              </p>
              <h1 className="mt-1 text-3xl font-black">
                {tournament.name} {tournament.year}
              </h1>
              <p className="mt-2 text-white/85">
                {tournament.status === "final"
                  ? "Tournament complete"
                  : "Results preview - finalise tournament when play is complete"}
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <div className="flex gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary text-white">
                <Trophy />
              </span>
              <div>
                <h2 className="text-xl font-black">Lowest round</h2>
                {lowestRound.scoreToPar === null ? (
                  <p className="mt-1 text-muted">No round scores have been recorded yet.</p>
                ) : (
                  <>
                    <p className="mt-1 text-lg font-bold">
                      {lowestRound.golfers.map((golfer) => golfer.golfer.name).join(", ")} shot{" "}
                      {formatScoreOrLabel(lowestRound.scoreToPar)} in round{" "}
                      {lowestRound.roundNumber}.
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {lowestRound.pickedBy.length
                        ? `Picked by ${lowestRound.pickedBy.map((user) => user.name).join(", ")}.`
                        : "No entrant picked this golfer."}
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface scorecard-shadow">
            <div className="border-b border-border p-4">
              <h2 className="text-xl font-black">Final leaderboard</h2>
              <p className="mt-1 text-sm text-muted">Lowest combined score wins.</p>
            </div>
            <div className="divide-y divide-border">
              {rows.map((row) => (
                <div
                  key={row.entry.id}
                  className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 p-4"
                >
                  <span
                    className={`flex size-11 items-center justify-center rounded-md border text-lg font-black ${
                      podiumStyles[row.rank] ?? "border-border bg-slate-50 text-primary"
                    }`}
                  >
                    {row.rank <= 3 ? <Medal size={22} /> : row.rank}
                  </span>
                  <span>
                    <span className="block text-lg font-black">{row.entry.user.name}</span>
                    <span className="mt-1 block">
                      <CutStatusBadge status={row.status} />
                    </span>
                  </span>
                  <span className="font-mono text-2xl font-black">
                    {formatScoreOrLabel(row.score, "-")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}
