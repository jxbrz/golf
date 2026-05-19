import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { CalendarDays, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
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
        <main className="space-y-5">
          <WelcomeHero
            entrySubmitted={Boolean(entry?.submittedAt)}
            locked={tournament.status === "picks_locked"}
            tournament={tournament}
          />
          {entry?.submittedAt ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
              <section className="paper-panel rounded-lg border border-border p-5 scorecard-shadow">
                <div className="flex items-start gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-800">
                    <CheckCircle2 />
                  </span>
                  <div>
                    <h2 className="text-2xl font-black">Thanks for your picks.</h2>
                    <p className="mt-2 text-muted">
                      Your team is saved. Come back after round one to see how you are doing.
                    </p>
                    <Link
                      href={`/tournaments/${tournament.id}/pick`}
                      className="mt-4 inline-flex h-11 items-center rounded-md bg-primary px-4 font-black text-white"
                    >
                      Review team
                    </Link>
                  </div>
                </div>
              </section>
              <EntryTeamCard entry={entry} />
            </div>
          ) : (
            <section className="paper-panel rounded-lg border border-border p-5 scorecard-shadow">
              <h2 className="text-xl font-black">How it works</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Rule number="1" title="Pick 4 golfers" text="Choose your team before picks lock." />
                <Rule number="2" title="Stay under 90" text="Each golfer has a cost from 55 down to 1." />
                <Rule number="3" title="Best 3 count" text="After the cut, you may need to drop one." />
              </div>
            </section>
          )}
        </main>
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
    <section className="event-hero overflow-hidden rounded-xl text-white scorecard-shadow">
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_18rem] lg:items-end">
        <div>
          <div className="flex items-center gap-3">
            <MajorMark majorKey={tournament.majorKey} size="lg" />
            <div>
              <p className="text-sm font-black uppercase tracking-wide" style={{ color: theme.secondary }}>
                {theme.label}
              </p>
              <p className="text-sm font-semibold text-white/75">{tournament.year} private sweepstake</p>
            </div>
          </div>
          <h1 className="mt-7 max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-xl text-base font-medium leading-7 text-white/82">
            {body}
          </p>
          {!entrySubmitted && !locked ? (
            <Link
              href={`/tournaments/${tournament.id}/pick`}
              className="mt-6 inline-flex h-12 items-center rounded-md px-5 text-base font-black text-primary"
              style={{ backgroundColor: theme.secondary }}
            >
              Select your picks
            </Link>
          ) : null}
        </div>

        <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur">
          <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-md border border-white/15">
            <Image
              src="/images/aronimink-clubhouse.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 18rem, 100vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="space-y-3 text-sm font-semibold text-white/85">
            <span className="flex items-center gap-2">
              <MapPin size={16} /> {tournament.venue}
            </span>
            <span className="flex items-center gap-2">
              <CalendarDays size={16} /> Picks lock {formatDateTime(tournament.pickDeadline)}
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} /> Four golfers, best three scores
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Rule({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <span className="flex size-9 items-center justify-center rounded-md bg-primary font-mono font-black text-white">
        {number}
      </span>
      <h3 className="mt-3 font-black">{title}</h3>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </div>
  );
}
