import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarClock, Flag, Trophy, UsersRound } from "lucide-react";
import { AppShell, HeaderInfoButton } from "@/components/layout/AppShell";
import { FieldLeaderboard } from "@/components/leaderboard/FieldLeaderboard";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireCurrentUser } from "@/lib/auth";
import { getFieldLeaderboard, getTournament, getTournamentGolfers } from "@/lib/mock-data/store";
import { majorThemes } from "@/lib/theme/major-themes";
import { formatScoreOrLabel } from "@/lib/utils";

export default async function PlayersLeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireCurrentUser();
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const fieldIsLive = !["draft", "picks_open", "picks_locked"].includes(tournament.status);
  const title = tournament.status === "final" ? "Tournament field results" : "Tournament field leaderboard";
  const field = getFieldLeaderboard(tournament.id);
  const allGolfers = getTournamentGolfers(tournament.id);
  const theme = majorThemes[tournament.majorKey];
  const leader = fieldIsLive ? field.find((golfer) => golfer.totalScore !== null) : null;
  const madeCut = allGolfers.filter((golfer) => golfer.madeCut === true).length;
  const scored = allGolfers.filter((golfer) => golfer.totalScore !== null).length;

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell
        tournament={tournament}
        screenTitle="Field"
        screenSubtitle={theme.label}
        backHref="/"
        activeNav="field"
        rightSlot={<HeaderInfoButton />}
      >
        <main className="space-y-4">
          <section className="standings-status-card overflow-hidden rounded-lg border border-white/16 bg-[var(--nav)] text-white scorecard-shadow">
            <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-[11px] font-black uppercase text-[var(--secondary)]">
                  {tournament.name} {tournament.year}
                </p>
                <h1 className="mt-1 text-3xl font-bold leading-none sm:text-4xl">{title}</h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold text-white/72">
                  {fieldIsLive
                    ? "Follow the full field, live scoring, cut status, and player costs in one place."
                    : "The full field leaderboard will appear once round 1 is underway."}
                </p>
              </div>
              <Link
                href={`/tournaments/${tournament.id}/leaderboard`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-black text-primary"
              >
                Fantasy standings <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-3 border-t border-white/10 text-center">
              <FieldHeroMetric icon={<UsersRound size={17} />} label="Field" value={String(allGolfers.length)} />
              <FieldHeroMetric icon={<Trophy size={17} />} label="Leader" value={leader ? formatScoreOrLabel(leader.totalScore, "-") : "-"} />
              <FieldHeroMetric
                icon={<Flag size={17} />}
                label={fieldIsLive ? "Cut Made" : "Scored"}
                value={fieldIsLive ? (madeCut ? String(madeCut) : `${scored}/${allGolfers.length}`) : "Not live"}
              />
            </div>
          </section>
          {fieldIsLive ? (
            <FieldLeaderboard
              golfers={field}
              majorKey={tournament.majorKey}
              title={title}
            />
          ) : (
            <FieldPendingState tournamentName={tournament.name} year={tournament.year} />
          )}
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}

function FieldPendingState({
  tournamentName,
  year,
}: {
  tournamentName: string;
  year: number;
}) {
  return (
    <section className="paper-panel rounded-lg border border-border p-5 text-center scorecard-shadow">
      <span className="mx-auto flex size-12 items-center justify-center rounded-md bg-[var(--rough)] text-primary">
        <CalendarClock size={24} />
      </span>
      <h2 className="mt-4 text-2xl font-black">Tournament field leaderboard opens after round 1 starts</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-muted">
        {tournamentName} {year} scores are hidden until the first round is underway.
      </p>
    </section>
  );
}

function FieldHeroMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <span className="border-r border-white/10 p-3 last:border-r-0">
      <span className="mx-auto flex size-8 items-center justify-center rounded-md bg-white/8 text-[var(--secondary)]">
        {icon}
      </span>
      <span className="mt-2 block text-[10px] font-black uppercase text-white/58">{label}</span>
      <span className="block truncate font-mono text-lg font-black text-white">{value}</span>
    </span>
  );
}
