import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, CheckCircle2, LockKeyhole, MapPin, Trophy, UsersRound } from "lucide-react";
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
                    <Link href={`/tournaments/${tournament.id}/pick`} className="app-button mt-4">
                      Review team
                      <ArrowRight size={17} />
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
    ? "Team submitted"
    : locked
      ? "Picks locked"
      : "Pick your team";
  const body = entrySubmitted
    ? "You are in. Standings open once play starts."
    : locked
      ? "The game is closed and ready for round one."
      : "Choose 4 golfers. Stay under 90 points. Submit once.";

  return (
    <section className="event-hero overflow-hidden rounded-lg text-white scorecard-shadow">
      <div className="p-4 sm:p-6 lg:p-7">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MajorMark majorKey={tournament.majorKey} size="lg" />
            <div>
              <h2 className="app-display text-2xl font-bold leading-6">{theme.shortLabel}</h2>
              <p className="text-xs font-bold uppercase text-white/62">{tournament.name} {tournament.year}</p>
            </div>
          </div>
          <span className="game-chip">{tournament.status.replaceAll("_", " ")}</span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_22rem] lg:items-stretch">
          <div className="relative min-h-52 overflow-hidden rounded-lg border border-white/12">
            <Image
              src="/images/aronimink-clubhouse.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 48rem, 100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgb(0_28_61_/_0.82)] via-[rgb(0_28_61_/_0.2)] to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="app-display text-4xl font-bold leading-none sm:text-5xl">{title}</h1>
              <p className="mt-2 max-w-xl text-sm font-bold leading-6 text-white/82">{body}</p>
            </div>
          </div>

          <div className="rounded-lg border border-white/12 bg-white p-4 text-primary shadow-2xl">
            <p className="sport-label">Your status</p>
            <h3 className="mt-1 text-3xl font-bold">{entrySubmitted ? "Locked in" : locked ? "Closed" : "Not submitted"}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">
              {entrySubmitted
                ? "Your 4 golfers are saved. Watch the standings once play starts."
                : locked
                  ? "Picks are locked for this test weekend."
                  : "You have 90 points to build a team of 4."}
            </p>
            {!entrySubmitted && !locked ? (
              <Link
                href={`/tournaments/${tournament.id}/pick`}
                className="app-button mt-4 w-full"
              >
                Pick Team
                <ArrowRight size={18} />
              </Link>
            ) : null}
            <div className="mt-4 grid gap-2">
              <HeroStat icon={<UsersRound size={17} />} label="Roster" value="4 golfers" />
              <HeroStat icon={<Trophy size={17} />} label="Scoring" value="Best 3 count" />
              <HeroStat icon={<LockKeyhole size={17} />} label="Lock" value={formatDateTime(tournament.pickDeadline)} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <HeroStat icon={<MapPin size={17} />} label="Venue" value={tournament.venue.split(",")[0]} dark />
          <HeroStat icon={<CalendarDays size={17} />} label="Weekend" value="Thu to Sun" dark />
          <HeroStat icon={<Trophy size={17} />} label="Drop rule" value="Drop 1 if all 4 make cut" dark />
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  icon,
  label,
  value,
  dark = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div className={dark ? "rounded-md border border-white/12 bg-white/8 p-3" : "rounded-md border border-border bg-[var(--rough)] p-3"}>
      <div className={dark ? "flex items-center gap-2 text-white/68" : "flex items-center gap-2 text-muted"}>
        {icon}
        <span className="text-xs font-black uppercase">{label}</span>
      </div>
      <p className={dark ? "mt-2 line-clamp-2 text-sm font-black text-white" : "mt-2 line-clamp-2 text-sm font-black text-primary"}>{value}</p>
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
