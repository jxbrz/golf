import { notFound } from "next/navigation";
import { DropPlayerForm } from "@/components/drop/DropPlayerForm";
import { AppShell } from "@/components/layout/AppShell";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requireCurrentUser } from "@/lib/auth";
import { getEntry, getTournament } from "@/lib/mock-data/store";

export default async function DropPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = getTournament(id);
  if (!tournament) notFound();
  const user = await requireCurrentUser();
  const entry = getEntry(tournament.id, user.id);

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        {entry?.status === "drop_required" ? (
          <DropPlayerForm entry={entry} tournament={tournament} />
        ) : (
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h1 className="text-2xl font-black">No drop needed</h1>
            <p className="mt-1 text-muted">This entry does not currently need to drop a player.</p>
          </section>
        )}
      </AppShell>
    </MajorThemeProvider>
  );
}
