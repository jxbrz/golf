import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminEntriesEditor } from "@/components/admin/AdminEntriesEditor";
import { AppShell } from "@/components/layout/AppShell";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requirePlatformAdminOrOwner } from "@/lib/auth";
import { getDbAdminEntryRows } from "@/lib/db-data/entries";
import {
  getAdminEntryRows,
  getTournament,
  getTournamentGolfers,
} from "@/lib/mock-data/store";

export default async function AdminEntriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  await requirePlatformAdminOrOwner();
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const dbRows = await getDbAdminEntryRows(tournament.id);

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        <main className="space-y-4">
          <Link
            href={`/admin/tournaments/${tournament.id}`}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-bold text-primary"
          >
            <ArrowLeft size={16} /> Admin
          </Link>
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h1 className="text-3xl font-black">Entries</h1>
            <p className="mt-1 text-muted">
              Review and correct submitted teams for this tournament.
            </p>
          </section>
          <AdminEntriesEditor
            tournamentId={tournament.id}
            rows={dbRows.length ? dbRows : getAdminEntryRows(tournament.id)}
            golfers={getTournamentGolfers(tournament.id)}
            error={error}
          />
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}
