import { redirect } from "next/navigation";
import Image from "next/image";
import { loginAction } from "@/app/actions";
import { MajorMark } from "@/components/theme/MajorMark";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { getSessionUser } from "@/lib/auth";
import { getActiveTournament } from "@/lib/mock-data/store";
import { majorThemes } from "@/lib/theme/major-themes";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/");
  const { error } = await searchParams;
  const tournament = getActiveTournament();
  const theme = majorThemes[tournament.majorKey];

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <main className="flex min-h-screen w-full items-center px-4 py-8">
        <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_25rem] lg:items-stretch">
          <section className="event-hero hidden overflow-hidden rounded-xl p-7 text-white scorecard-shadow lg:flex lg:flex-col lg:justify-between">
            <div>
              <MajorMark majorKey={tournament.majorKey} size="lg" />
              <h1 className="mt-8 max-w-xl text-5xl font-black leading-tight">Major Picks</h1>
              <p className="mt-4 max-w-md text-lg font-semibold leading-8 text-white/82">
                {theme.label} {tournament.year}, built for one private sweepstake.
              </p>
            </div>
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg border border-white/15">
              <Image
                src="/images/aronimink-clubhouse.jpg"
                alt=""
                fill
                sizes="(min-width: 1024px) 34rem, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </section>
          <div className="flex flex-col justify-center">
        <section className="overflow-hidden rounded-lg border border-border bg-surface scorecard-shadow">
          <div className="bg-primary p-5 text-white">
            <p className="text-sm font-bold uppercase tracking-wide" style={{ color: theme.secondary }}>
              Private competition
            </p>
            <h1 className="mt-1 text-3xl font-black">Major Picks</h1>
            <p className="mt-2 text-white/85">Sign in to pick your team and follow the scores.</p>
          </div>
          <form action={loginAction} className="space-y-4 p-5">
            {error ? (
              <p className="rounded-md bg-rose-50 p-3 text-sm font-bold text-rose-800">
                Email or password was not recognised.
              </p>
            ) : null}
            <label className="block">
              <span className="text-sm font-black uppercase text-muted">Email</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 h-12 w-full rounded-md border border-border px-3 text-base font-semibold"
              />
            </label>
            <label className="block">
              <span className="text-sm font-black uppercase text-muted">Password</span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1 h-12 w-full rounded-md border border-border px-3 text-base font-semibold"
              />
            </label>
            <button className="h-12 w-full rounded-md bg-primary px-4 text-base font-black text-white">
              Sign in
            </button>
          </form>
        </section>
        <section className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm scorecard-shadow">
          <p className="font-black">Starter accounts</p>
          <p className="mt-2 text-muted">Admin: admin@majorpicks.local / Admin123!</p>
          <p className="mt-1 text-muted">Players: player1@majorpicks.local or player2@majorpicks.local / Player123!</p>
        </section>
          </div>
        </div>
      </main>
    </MajorThemeProvider>
  );
}
