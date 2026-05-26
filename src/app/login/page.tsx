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
  if (user) redirect("/app");
  const { error } = await searchParams;
  const tournament = getActiveTournament();
  const theme = majorThemes[tournament.majorKey];
  const showDemoAccounts =
    process.env.NODE_ENV !== "production" || process.env.SHOW_DEMO_ACCOUNTS === "true";

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <main className="flex min-h-screen w-full items-center px-4 py-8">
        <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1fr_26rem] lg:items-stretch">
          <section className="event-hero hidden overflow-hidden rounded-lg p-7 text-white scorecard-shadow lg:flex lg:flex-col lg:justify-between">
            <div>
              <MajorMark majorKey={tournament.majorKey} size="lg" />
              <h1 className="mt-8 max-w-xl text-6xl font-black leading-tight">Major Picks</h1>
              <p className="mt-4 max-w-md text-lg font-semibold leading-8 text-white/78">
                Sign in to your private Major Picks league for {theme.label} {tournament.year}.
              </p>
            </div>
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-md border border-white/15">
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
        <section className="app-panel">
          <div className="app-panel-header p-5">
            <p className="sport-label">Private competition</p>
            <h1 className="mt-1 text-3xl font-black">Sign in</h1>
            <p className="mt-2 font-semibold text-muted">
              Access your league, manage your picks and follow the standings.
            </p>
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
                className="mt-1 h-12 w-full rounded-md border border-border bg-white px-3 text-base font-semibold outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-black uppercase text-muted">Password</span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1 h-12 w-full rounded-md border border-border bg-white px-3 text-base font-semibold outline-none focus:border-primary"
              />
            </label>
            <button className="h-12 w-full rounded-md bg-primary px-4 text-base font-black text-white">
              Sign in
            </button>
          </form>
        </section>
        {showDemoAccounts ? (
          <section className="app-panel mt-4 p-4 text-sm">
            <p className="sport-label">Starter accounts</p>
            <p className="mt-2 text-muted">Admin: admin@majorpicks.local / Admin123!</p>
            <p className="mt-1 text-muted">Players: player1@majorpicks.local or player2@majorpicks.local / Player123!</p>
          </section>
        ) : null}
          </div>
        </div>
      </main>
    </MajorThemeProvider>
  );
}
