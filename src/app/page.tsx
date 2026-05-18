import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EntryTeamCard } from "@/components/leaderboard/EntryTeamCard";
import { GroupLeaderboard } from "@/components/leaderboard/GroupLeaderboard";
import { MajorMark } from "@/components/theme/MajorMark";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { TournamentHeader } from "@/components/tournaments/TournamentHeader";
import { requireCurrentUser } from "@/lib/auth";
import {
  getActiveTournament,
  getEntry,
  getLeaderboard,
} from "@/lib/mock-data/store";

export default async function Home() {
  const tournament = getActiveTournament();
  const user = await requireCurrentUser();
  if (tournament.status === "final" && user.role !== "admin") {
    redirect(`/tournaments/${tournament.id}/results`);
  }
  const entry = getEntry(tournament.id, user.id);
  const rows = getLeaderboard(tournament.id);
  const stage = homeStageCopy(tournament.status, entry?.status);

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        {entry ? (
          <main className="space-y-4">
            <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
              <div className="flex items-start gap-3">
                <MajorMark majorKey={tournament.majorKey} size="md" />
                <div>
                  <p className="text-sm font-bold uppercase text-muted">
                    {tournament.name} {tournament.year}
                  </p>
                  <h1 className="text-2xl font-black">{stage.title}</h1>
                  <p className="mt-1 text-sm text-muted">
                    {stage.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/tournaments/${tournament.id}/leaderboard`}
                      className="rounded-md bg-primary px-3 py-2 text-sm font-black text-white"
                    >
                      Current Standings
                    </Link>
                    <Link
                      href={`/tournaments/${tournament.id}/players`}
                      className="rounded-md border border-border bg-white px-3 py-2 text-sm font-black text-primary"
                    >
                      Field Leaderboard
                    </Link>
                  </div>
                </div>
              </div>
            </section>
            <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
              <GroupLeaderboard
                rows={rows}
                tournament={tournament}
                currentUserId={user.id}
                title="Current standings"
              />
              <div className="space-y-4">
                <EntryTeamCard entry={entry} />
                {entry.status === "drop_required" ? (
                  <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
                    <h2 className="text-lg font-black">Cut being processed</h2>
                    <p className="mt-1 text-sm text-muted">
                      Your best 3 scores will count automatically once the standings refresh.
                    </p>
                  </section>
                ) : null}
              </div>
            </div>
          </main>
        ) : (
          <>
            <TournamentHeader tournament={tournament} entrySubmitted={false} />
            <main className="grid gap-4 lg:grid-cols-[1fr_22rem]">
              <div className="space-y-4">
                <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-1 shrink-0 text-secondary" />
                    <div>
                      <h2 className="text-xl font-black">Pick your team</h2>
                      <p className="mt-1 text-muted">
                        Choose 4 golfers with a combined value of 90 points or less.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/tournaments/${tournament.id}/pick`}
                          className="rounded-md bg-primary px-4 py-3 font-black text-white"
                        >
                          Pick Team
                        </Link>
                        <Link
                          href={`/tournaments/${tournament.id}/leaderboard`}
                          className="rounded-md border border-border bg-white px-4 py-3 font-black text-primary"
                        >
                          Current Standings
                        </Link>
                        <Link
                          href={`/tournaments/${tournament.id}/players`}
                          className="rounded-md border border-border bg-white px-4 py-3 font-black text-primary"
                        >
                          Field Leaderboard
                        </Link>
                      </div>
                    </div>
                  </div>
                </section>
                <GroupLeaderboard
                  rows={rows}
                  tournament={tournament}
                  currentUserId={user.id}
                  preview
                  title="Current standings"
                />
              </div>
              <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
                <h2 className="text-lg font-black">Simple rules</h2>
                <ul className="mt-3 space-y-3 text-sm text-muted">
                  <li>Pick exactly 4 golfers.</li>
                  <li>Stay at 90 points or less.</li>
                  <li>Teams cannot be changed after submission.</li>
                  <li>After the cut, 3 golfers count.</li>
                </ul>
              </section>
            </main>
          </>
        )}
      </AppShell>
    </MajorThemeProvider>
  );
}

function homeStageCopy(tournamentStatus: string, entryStatus?: string) {
  if (entryStatus === "drop_required") {
    return {
      title: "Cut pending",
      description: "Your score will use the best 3 golfers once the cut is processed.",
    };
  }

  const copy: Record<string, { title: string; description: string }> = {
    picks_open: {
      title: "Team submitted",
      description: "Your team is locked in. Current standings will come alive when play starts.",
    },
    picks_locked: {
      title: "Teams are locked",
      description: "Picks are closed. Next up is the first round leaderboard.",
    },
    round_1: {
      title: "Round 1 live",
      description: "Track the current standings and the field leaderboard as scores move.",
    },
    round_2: {
      title: "Round 2 live",
      description: "Friday scores are in progress. The cut comes next.",
    },
    drop_open: {
      title: "Cut processed",
      description: "Teams with at least 3 golfers through now count their best 3 scores.",
    },
    round_3: {
      title: "Saturday standings",
      description: "After the cut, only 3 golfers count for each team.",
    },
    round_4: {
      title: "Sunday standings",
      description: "Final-round scores are shaping the result.",
    },
    final: {
      title: "Results are ready",
      description: "The final podium and lowest-round banner are available.",
    },
  };

  return copy[tournamentStatus] ?? {
    title: "Current standings",
    description: "Check where everyone stands from first to last.",
  };
}
