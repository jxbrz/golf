import Link from "next/link";
import { Activity, Building2, ClipboardList, Flag, Inbox, ListChecks, RadioTower, UsersRound } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requirePlatformAdminOrOwner } from "@/lib/auth";
import { listOrganisationRequests, listOrganisations } from "@/lib/db-data/organisations";
import { getActiveTournament, getStore } from "@/lib/mock-data/store";

export default async function OwnerPage() {
  await requirePlatformAdminOrOwner();
  const active = getActiveTournament();
  const store = getStore();
  const [requests, organisations] = await Promise.all([
    listOrganisationRequests(),
    listOrganisations(),
  ]);
  const pendingRequests = requests.filter((request) => request.status === "pending").length;

  return (
    <MajorThemeProvider majorKey={active.majorKey}>
      <AppShell tournament={active}>
        <main className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <p className="sport-label">Platform owner</p>
            <h1 className="mt-1 text-3xl font-black">Owner dashboard</h1>
            <p className="mt-1 text-muted">
              Manage platform onboarding, organisations and global golf data from one place.
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <Metric icon={<Inbox />} label="Pending requests" value={String(pendingRequests)} />
            <Metric icon={<Building2 />} label="Organisations" value={String(organisations.length)} />
            <Metric icon={<Flag />} label="Global tournaments" value={String(store.tournaments.length)} />
          </section>

          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h2 className="text-xl font-black">Platform controls</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <OwnerLink href="/owner/organisation-requests" icon={<Inbox />} label="Organisation requests" />
              <OwnerLink href="/owner/organisations" icon={<Building2 />} label="All organisations" />
              <OwnerLink href="/owner/leagues" icon={<ListChecks />} label="All leagues" />
              <OwnerLink href="/owner/users" icon={<UsersRound />} label="Platform users" />
              <OwnerLink href={`/owner/tournaments/${active.id}`} icon={<ClipboardList />} label="Global tournament control" />
              <OwnerLink href={`/owner/tournaments/${active.id}/scores`} icon={<RadioTower />} label="Scores and sync" />
              <OwnerLink href={`/owner/tournaments/${active.id}/entries`} icon={<UsersRound />} label="Global entries" />
              <OwnerLink href="/admin" icon={<Activity />} label="Organisation admin area" />
            </div>
          </section>
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
      <span className="text-[var(--secondary)]">{icon}</span>
      <p className="mt-3 text-sm font-black uppercase text-muted">{label}</p>
      <p className="mt-1 text-3xl font-black text-primary">{value}</p>
    </section>
  );
}

function OwnerLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="rounded-lg border border-border p-4 font-black text-primary">
      <span className="mb-2 block text-[var(--secondary)]">{icon}</span>
      {label}
    </Link>
  );
}
