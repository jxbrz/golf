import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { CutStatusBadge } from "@/components/leaderboard/CutStatusBadge";
import { majorThemes } from "@/lib/theme/major-themes";
import type { Tournament } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function TournamentHeader({
  tournament,
  entrySubmitted = false,
}: {
  tournament: Tournament;
  entrySubmitted?: boolean;
}) {
  const theme = majorThemes[tournament.majorKey];
  return (
    <section className="mb-4 overflow-hidden rounded-lg bg-primary text-white scorecard-shadow">
      <div className="border-b border-white/15 px-4 py-5 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-wide" style={{ color: theme.secondary }}>
          {theme.label}
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
          {tournament.name} {tournament.year}
        </h1>
        <div className="mt-3 flex flex-col gap-2 text-sm text-white/85 sm:flex-row sm:items-center sm:gap-5">
          <span className="flex items-center gap-2">
            <MapPin size={16} /> {tournament.venue}
          </span>
          <span className="flex items-center gap-2">
            <CalendarDays size={16} /> Picks lock {formatDateTime(tournament.pickDeadline)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <CutStatusBadge status={tournament.status === "drop_open" ? "needs_drop" : "active"} />
        {tournament.status === "final" ? (
          <Link
            href={`/tournaments/${tournament.id}/results`}
            className="rounded-md bg-white px-3 py-2 text-sm font-bold text-primary"
          >
            Final Results
          </Link>
        ) : entrySubmitted ? (
          <Link
            href={`/tournaments/${tournament.id}/pick`}
            className="rounded-md bg-white px-3 py-2 text-sm font-bold text-primary"
          >
            View Team
          </Link>
        ) : (
          <Link
            href={`/tournaments/${tournament.id}/pick`}
            className="rounded-md bg-white px-3 py-2 text-sm font-bold text-primary"
          >
            Pick Team
          </Link>
        )}
        <Link href={`/tournaments/${tournament.id}/leaderboard`} className="rounded-md border border-white/25 px-3 py-2 text-sm font-bold text-white">
          Live Leaderboard
        </Link>
      </div>
    </section>
  );
}
