import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { getSessionUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/");
  const { error } = await searchParams;

  return (
    <MajorThemeProvider majorKey="us_open">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
        <section className="overflow-hidden rounded-lg border border-border bg-surface scorecard-shadow">
          <div className="bg-primary p-5 text-white">
            <p className="text-sm font-bold uppercase tracking-wide text-white/75">
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
      </main>
    </MajorThemeProvider>
  );
}
