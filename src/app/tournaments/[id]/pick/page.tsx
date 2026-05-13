import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PickBuilder } from "@/components/picks/PickBuilder";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { canSubmitPicks, getCurrentUser, getEntry, getTournament, getTournamentGolfers } from "@/lib/mock-data/store";

export default async function PickPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const cookieStore = await cookies();
  const user = getCurrentUser(cookieStore.get("mockUserId")?.value);
  const entry = getEntry(tournament.id, user.id);
  const locked = Boolean(entry?.submittedAt) || !canSubmitPicks(tournament);

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        <main className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h1 className="text-3xl font-black">Pick your team</h1>
            <p className="mt-1 text-muted">
              Pick exactly 4 golfers under the 90 point cap. Once submitted, your team is locked.
            </p>
            {locked ? (
              <p className="mt-3 rounded-md bg-amber-50 p-3 font-bold text-amber-900">
                Team selection is locked for this user or tournament.
              </p>
            ) : null}
          </section>
          <PickBuilder
            tournamentId={tournament.id}
            userId={user.id}
            golfers={getTournamentGolfers(tournament.id)}
            locked={locked}
          />
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}
