import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Medal, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CutStatusBadge } from "@/components/leaderboard/CutStatusBadge";
import { PlayerScoreRow } from "@/components/leaderboard/PlayerScoreRow";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireCurrentUser } from "@/lib/auth";
import { getDbLeaderboard, getDbLowestRoundSummary } from "@/lib/db-data/entries";
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
  if (tournament.status !== "final") redirect(`/tournaments/${tournament.id}/leaderboard`);
  const user = await requireCurrentUser();
  const dbRows = await getDbLeaderboard(tournament.id, tournament);
  const rows = dbRows.length ? dbRows : getLeaderboard(tournament.id);
  const winnerRow =
    rows.find(
      (row) =>
        row.rank === 1 &&
        row.score !== null &&
        row.status !== "eliminated" &&
        row.entry.user.name,
    ) ??
    rows.find(
      (row) =>
        row.score !== null &&
        row.status !== "eliminated" &&
        row.entry.user.name,
    );
  const dbLowestRound = await getDbLowestRoundSummary(tournament.id);
  const lowestRound = dbLowestRound ?? getLowestRoundSummary(tournament.id);
  const backHref =
    user.role === "admin"
      ? `/tournaments/${tournament.id}/leaderboard`
      : `/tournaments/${tournament.id}/players`;
  const backLabel = user.role === "admin" ? "Current Standings" : "Field Results";

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament} activeNav="results">
        <main className="space-y-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-bold text-primary"
          >
            <ArrowLeft size={16} /> {backLabel}
          </Link>

          <section className="event-hero overflow-hidden rounded-lg text-white scorecard-shadow">
            <div className="p-5 sm:p-7">
              <p className="text-sm font-bold uppercase tracking-wide text-white/75">
                Final results
              </p>
              <h1 className="mt-1 text-4xl font-bold leading-none">
                {tournament.name} {tournament.year}
              </h1>
              <p className="mt-2 text-white/85">
                Tournament complete
              </p>
            </div>
          </section>

          {winnerRow ? <WinnerBanner name={winnerRow.entry.user.name} /> : null}

          <section className="paper-panel rounded-lg border border-border p-4 scorecard-shadow">
            <div className="flex gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary text-white">
                <Trophy />
              </span>
              <div>
                <h2 className="text-xl font-black">Lowest round</h2>
                {lowestRound.scoreToPar === null ? (
                  <p className="mt-1 text-muted">No picked golfer round scores have been recorded yet.</p>
                ) : (
                  <>
                    <p className="mt-1 text-lg font-bold">
                      {lowestRound.golfers.map((golfer) => golfer.golfer.name).join(", ")} shot{" "}
                      {formatScoreOrLabel(lowestRound.scoreToPar)} in round{" "}
                      {lowestRound.roundNumber}
                      {lowestRound.countback
                        ? `, winning on ${lowestRound.countback.toUpperCase()} countback.`
                        : "."}
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

          <section className="overflow-hidden rounded-lg border border-border bg-surface scorecard-shadow">
            <div className="border-b border-border p-4">
              <h2 className="text-xl font-black">Final leaderboard</h2>
              <p className="mt-1 text-sm text-muted">Lowest combined score wins.</p>
            </div>
            <div className="divide-y divide-border">
              {rows.map((row) => (
                <details
                  key={row.entry.id}
                  className="group"
                >
                  <summary className="grid cursor-pointer list-none grid-cols-[3.25rem_1fr_auto] items-center gap-3 p-4 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                    <span
                      className={`flex size-11 items-center justify-center rounded-md border text-lg font-black ${
                        podiumStyles[row.rank] ?? "border-border bg-slate-50 text-primary"
                      }`}
                    >
                      {row.rank <= 3 ? <Medal size={22} /> : row.rank}
                    </span>
                    <span>
                      <span className="block text-lg font-black">{row.entry.user.name}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                        <CutStatusBadge status={row.status} />
                        <span className="font-bold text-primary group-open:hidden">Show team</span>
                        <span className="hidden font-bold text-primary group-open:inline">Hide team</span>
                      </span>
                    </span>
                    <span className="font-mono text-2xl font-black">
                      {formatScoreOrLabel(row.score, "-")}
                    </span>
                  </summary>
                  <div className="border-t border-border bg-slate-50 px-4 py-2">
                    {row.entry.picks.map((pick) => (
                      <PlayerScoreRow key={pick.id} pick={pick} cutFinalized />
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </section>
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}

function WinnerBanner({ name }: { name: string }) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 scorecard-shadow">
      <p className="sport-label text-emerald-800">Fantasy winner</p>
      <h2 className="mt-1 text-2xl font-black text-primary">
        Congratulations {name}
      </h2>
    </section>
  );
}
