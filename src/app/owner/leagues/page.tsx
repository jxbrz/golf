import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OwnerShell } from "@/components/layout/OwnerShell";
import { listPlatformLeagues } from "@/lib/db-data/organisations";

export default async function OwnerLeaguesPage() {
  const rows = await listPlatformLeagues();

  return (
    <OwnerShell>
        <div className="space-y-4">
          <Link href="/owner" className="inline-flex items-center gap-2 text-sm font-black text-primary/72">
            <ArrowLeft size={17} />
            Back to owner dashboard
          </Link>
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <p className="sport-label">Platform owner</p>
            <h1 className="mt-1 text-3xl font-black">All leagues</h1>
            <p className="mt-1 text-muted">View leagues across every organisation.</p>
          </section>
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <div className="grid gap-2">
              {rows.length ? (
                rows.map(({ league, organisation }) => (
                  <div key={league.id} className="rounded-md border border-border p-3">
                    <p className="font-black">{league.name}</p>
                    <p className="text-sm font-semibold text-muted">
                      {organisation?.name ?? "Unknown organisation"} · {league.seasonYear} · {league.status}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-border p-3 text-sm font-semibold text-muted">
                  No leagues found.
                </p>
              )}
            </div>
          </section>
        </div>
    </OwnerShell>
  );
}
