import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CutStatusBadge } from "@/components/leaderboard/CutStatusBadge";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireCurrentUser } from "@/lib/auth";
import { getTournamentGolferScorecard } from "@/lib/mock-data/store";
import { formatDateTime, formatScore } from "@/lib/utils";

export default async function GolferScorecardPage({
  params,
}: {
  params: Promise<{ id: string; golferId: string }>;
}) {
  const { id, golferId } = await params;
  await requireCurrentUser();
  const data = getTournamentGolferScorecard(id, golferId);
  if (!data) notFound();

  const { tournament, tournamentGolfer, roundScores } = data;

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        <main className="space-y-4">
          <Link
            href={`/tournaments/${tournament.id}/players`}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-bold text-primary"
          >
            <ArrowLeft size={16} /> Field leaderboard
          </Link>

          <section className="overflow-hidden rounded-lg border border-border bg-surface scorecard-shadow">
            <div className="bg-primary p-5 text-white">
              <p className="text-sm font-bold uppercase tracking-wide text-white/75">
                Player scorecard
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">
                {tournamentGolfer.golfer.name}
              </h1>
              <p className="mt-2 text-white/85">
                {tournamentGolfer.golfer.country ?? "Country not set"} · {tournament.name}{" "}
                {tournament.year}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-border p-4 sm:grid-cols-4">
              <Stat label="Position" value={tournamentGolfer.position ?? "-"} />
              <Stat label="Total" value={formatScore(tournamentGolfer.totalScore)} />
              <Stat label="Today" value={formatScore(tournamentGolfer.todayScore)} />
              <Stat label="Points" value={String(tournamentGolfer.pointValue)} />
            </div>

            <div className="p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-black">Rounds</h2>
                <CutStatusBadge
                  status={
                    tournamentGolfer.madeCut === true && tournamentGolfer.status !== "cut"
                      ? "made_cut"
                      : tournamentGolfer.status
                  }
                />
              </div>
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="grid grid-cols-[4rem_1fr_1fr_1fr] bg-slate-50 px-3 py-2 text-xs font-black uppercase text-muted">
                  <span>Round</span>
                  <span>Score</span>
                  <span>Strokes</span>
                  <span>Thru</span>
                </div>
                {roundScores.map((round) => (
                  <div
                    key={round.id}
                    className="grid grid-cols-[4rem_1fr_1fr_1fr] items-center border-t border-border px-3 py-4"
                  >
                    <span className="font-mono text-lg font-black">R{round.roundNumber}</span>
                    <span className="font-mono text-xl font-black">
                      {formatScore(round.scoreToPar)}
                    </span>
                    <span className="font-semibold">{round.strokes ?? "-"}</span>
                    <span className="font-semibold">{round.thru ?? "-"}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">
                Last updated {formatDateTime(tournamentGolfer.lastSyncedAt ?? tournamentGolfer.updatedAt)}.
              </p>
            </div>
          </section>
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl font-black">{value}</p>
    </div>
  );
}
