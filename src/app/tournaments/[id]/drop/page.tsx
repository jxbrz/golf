import { notFound, redirect } from "next/navigation";
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
  if (tournament.status === "final" && user.role !== "admin") {
    redirect(`/tournaments/${tournament.id}/results`);
  }
  const entry = getEntry(tournament.id, user.id);

  return (
    <MajorThemeProvider majorKey={tournament.majorKey}>
      <AppShell tournament={tournament}>
        {entry?.status === "drop_required" ? (
          <DropPlayerForm entry={entry} tournament={tournament} />
        ) : (
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h1 className="text-2xl font-black">No manual drop needed</h1>
            <p className="mt-1 text-muted">
              The standings now count the best 3 available scores automatically.
            </p>
          </section>
        )}
      </AppShell>
    </MajorThemeProvider>
  );
}
