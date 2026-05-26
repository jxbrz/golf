import Link from "next/link";
import { ArrowLeft, Building2, UsersRound } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requirePlatformAdminOrOwner } from "@/lib/auth";
import { listOrganisations } from "@/lib/db-data/organisations";
import { getActiveTournament } from "@/lib/mock-data/store";

export default async function OwnerOrganisationsPage() {
  await requirePlatformAdminOrOwner();
  const active = getActiveTournament();
  const rows = await listOrganisations();

  return (
    <MajorThemeProvider majorKey={active.majorKey}>
      <AppShell tournament={active}>
        <main className="space-y-4">
          <Link href="/owner" className="inline-flex items-center gap-2 text-sm font-black text-primary/72">
            <ArrowLeft size={17} />
            Back to owner dashboard
          </Link>
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <p className="sport-label">Platform owner</p>
            <h1 className="mt-1 text-3xl font-black">All organisations</h1>
            <p className="mt-1 text-muted">View every club, society and group using Major Picks.</p>
          </section>

          <section className="grid gap-3">
            {rows.length ? (
              rows.map(({ organisation, memberCount, leagueCount }) => (
                <Link
                  key={organisation.id}
                  href={`/owner/organisations/${organisation.id}`}
                  className="rounded-lg border border-border bg-surface p-4 scorecard-shadow"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase text-muted">
                        {organisation.type.replaceAll("_", " ")}
                      </p>
                      <h2 className="mt-1 text-xl font-black">{organisation.name}</h2>
                      <p className="mt-1 text-sm font-semibold text-muted">
                        Created {formatDate(organisation.createdAt)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm font-black text-primary sm:min-w-56">
                      <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2">
                        <UsersRound size={16} />
                        {memberCount} members
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2">
                        <Building2 size={16} />
                        {leagueCount} leagues
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-surface p-4 text-sm font-semibold text-muted">
                No organisations yet.
              </p>
            )}
          </section>
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}
