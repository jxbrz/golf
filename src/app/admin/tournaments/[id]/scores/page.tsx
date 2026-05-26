import { notFound } from "next/navigation";
import { AdminScoreEditor } from "@/components/admin/AdminScoreEditor";
import { ManualScoreImport } from "@/components/admin/ManualScoreImport";
import { AppShell } from "@/components/layout/AppShell";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requirePlatformAdminOrOwner } from "@/lib/auth";
import { getTournament, getTournamentGolfers } from "@/lib/mock-data/store";

export default async function AdminScoresPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ imported?: string }>;
}) {
  const { id } = await params;
  const { imported } = await searchParams;
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const user = await requirePlatformAdminOrOwner();

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
          {imported ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-900 scorecard-shadow">
              Scores imported. No API calls were used.
            </p>
          ) : null}
          <ManualScoreImport tournamentId={tournament.id} />
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
