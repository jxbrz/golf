import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { CalendarDays, CheckCircle2, MapPin, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EntryTeamCard } from "@/components/leaderboard/EntryTeamCard";
import { MajorMark } from "@/components/theme/MajorMark";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireCurrentUser } from "@/lib/auth";
import { getActiveTournament, getEntry } from "@/lib/mock-data/store";
import { majorThemes } from "@/lib/theme/major-themes";
import { formatDateTime } from "@/lib/utils";

export default async function Home() {
  const tournament = getActiveTournament();
  const user = await requireCurrentUser();
  const entry = getEntry(tournament.id, user.id);
  const prePlay = ["draft", "picks_open", "picks_locked"].includes(tournament.status);

  if (tournament.status === "final" && user.role !== "admin") {
    redirect(`/tournaments/${tournament.id}/results`);
  }

  if (!prePlay && user.role !== "admin") {
    redirect(`/tournaments/${tournament.id}/leaderboard`);
  }

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        <div className="space-y-5">
          <WelcomeHero
            entrySubmitted={Boolean(entry?.submittedAt)}
            locked={tournament.status === "picks_locked"}
            tournament={tournament}
          />
          {entry?.submittedAt ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
              <section className="app-panel p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-800">
                    <CheckCircle2 />
                  </span>
                  <div>
                    <p className="sport-label">Team status</p>
                    <h2 className="mt-1 text-2xl font-black">Thanks for your picks.</h2>
                    <p className="mt-2 text-muted">
                      Your team is saved. Come back after round one to see how you are doing.
                    </p>
                    <Link
                      href={`/tournaments/${tournament.id}/pick`}
                      className="app-button mt-4"
                    >
                      Review team
                    </Link>
                  </div>
                </div>
              </section>
              <EntryTeamCard entry={entry} />
            </div>
          ) : (
            <section className="app-panel p-5">
              <p className="sport-label">Rules</p>
              <h2 className="mt-1 text-xl font-black">How it works</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Rule number="1" title="Pick 4 golfers" text="Choose your team before picks lock." />
                <Rule number="2" title="Stay under 90" text="Each golfer has a cost from 55 down to 1." />
                <Rule number="3" title="Best 3 count" text="After the cut, you may need to drop one." />
              </div>
            </section>
          )}
        </div>
      </AppShell>
    </MajorThemeProvider>
  );
}

function WelcomeHero({
  tournament,
  entrySubmitted,
  locked,
}: {
  tournament: ReturnType<typeof getActiveTournament>;
  entrySubmitted: boolean;
  locked: boolean;
}) {
  const theme = majorThemes[tournament.majorKey];
  const title = entrySubmitted
    ? "Your team is in."
    : locked
      ? "Picks are locked."
      : "Welcome. Select your picks.";
  const body = entrySubmitted
    ? "Nothing else to do yet. We will open the standings once the first round is in."
    : locked
      ? "The field is closed and the tournament is ready to begin."
      : "Pick 4 golfers under the 90 point cap. Once you submit, your team is locked.";

  return (
    <section className="event-hero overflow-hidden rounded-lg text-white scorecard-shadow">
      <div className="grid gap-0 lg:grid-cols-[1fr_24rem]">
        <div className="p-5 sm:p-7 lg:p-8">
          <div className="flex items-center gap-3">
            <MajorMark majorKey={tournament.majorKey} size="lg" />
            <div>
              <h2 className="text-lg font-black leading-5">{tournament.name}</h2>
              <p className="text-sm font-semibold text-white/68">{theme.label} {tournament.year}</p>
            </div>
          </div>
          <h1 className="mt-8 max-w-2xl text-4xl font-black leading-tight sm:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-white/78">
            {body}
          </p>
          {!entrySubmitted && !locked ? (
            <Link
              href={`/tournaments/${tournament.id}/pick`}
              className="mt-7 inline-flex h-12 items-center rounded-md px-5 text-base font-black text-primary"
              style={{ backgroundColor: theme.secondary }}
            >
              Select your picks
            </Link>
          ) : null}
          <div className="mt-8 grid max-w-2xl gap-2 sm:grid-cols-3">
            <HeroStat icon={<MapPin size={17} />} label="Venue" value={tournament.venue.split(",")[0]} />
            <HeroStat icon={<CalendarDays size={17} />} label="Picks lock" value={formatDateTime(tournament.pickDeadline)} />
            <HeroStat icon={<Trophy size={17} />} label="Format" value="Four picks, best three" />
          </div>
        </div>

        <div className="relative min-h-72 border-t border-white/10 lg:border-l lg:border-t-0">
          <Image
            src="/images/aronimink-clubhouse.jpg"
            alt=""
            fill
            sizes="(min-width: 1024px) 24rem, 100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgb(9_37_29_/_0.82)] via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 rounded-md border border-white/16 bg-[rgb(9_37_29_/_0.7)] p-3 backdrop-blur">
            <p className="text-sm font-black">Live-event rehearsal</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/72">
              Use admin controls to move the tournament through rounds with mock live data.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/12 bg-white/8 p-3">
      <div className="flex items-center gap-2 text-white/68">
        {icon}
        <span className="text-xs font-black uppercase">{label}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function Rule({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-md border border-border bg-white p-4">
      <span className="flex size-9 items-center justify-center rounded-md bg-[var(--rough)] font-mono font-black text-primary">
        {number}
      </span>
      <h3 className="mt-3 font-black">{title}</h3>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </div>
  );
}
