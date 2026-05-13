import { notFound } from "next/navigation";
import { AdminScoreEditor } from "@/components/admin/AdminScoreEditor";
import { AppShell } from "@/components/layout/AppShell";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireAdminUser } from "@/lib/auth";
import { getTournament, getTournamentGolfers } from "@/lib/mock-data/store";

export default async function AdminScoresPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const user = await requireAdminUser();

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        <main className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h1 className="text-3xl font-black">Scores</h1>
            <p className="mt-1 text-muted">
              Edit scores, cut status, WD/DQ, and positions. Keep changes simple and deliberate.
            </p>
          </section>
          <AdminScoreEditor
            tournamentId={tournament.id}
            adminUser={user}
            golfers={getTournamentGolfers(tournament.id)}
          />
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}
