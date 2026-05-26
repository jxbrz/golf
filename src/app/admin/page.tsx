import Link from "next/link";
import { Building2, MailPlus, Trophy, UsersRound } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { getUserOrganisationMemberships, requireCurrentUser } from "@/lib/auth";
import { getActiveTournament } from "@/lib/mock-data/store";

export default async function AdminPage() {
  const user = await requireCurrentUser();
  const active = getActiveTournament();
  const memberships = (await getUserOrganisationMemberships(user.id)).filter(({ membership }) =>
    ["owner", "admin"].includes(membership.role),
  );

  return (
    <MajorThemeProvider majorKey={active.majorKey}>
      <AppShell tournament={active}>
        <main className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <p className="sport-label">Organisation admin</p>
            <h1 className="mt-1 text-3xl font-black">Admin</h1>
            <p className="mt-1 text-muted">
              Manage your organisation, members, invites and local competition operations. Global
              tournament timing, scores, odds and live data are handled centrally by the platform.
            </p>
          </section>

          {user.role === "owner" || user.role === "admin" ? (
            <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
              <p className="sport-label">Platform access</p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-muted">
                  Use the owner area for global tournaments, score sync, odds and platform onboarding.
                </p>
                <Link href="/owner" className="app-button h-11 px-4">
                  Owner dashboard
                </Link>
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h2 className="text-xl font-black">Your organisations</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {memberships.length ? (
                memberships.map(({ organisation, membership }) => (
                  <Link
                    key={membership.id}
                    href={`/admin/organisations/${organisation.id}`}
                    className="rounded-lg border border-border p-4 font-black text-primary"
                  >
                    <Building2 className="mb-2 text-[var(--secondary)]" />
                    {organisation.name}
                    <p className="mt-2 text-sm font-bold uppercase text-muted">{membership.role}</p>
                  </Link>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm font-semibold text-muted sm:col-span-2">
                  You do not administer any organisations yet.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <h2 className="text-xl font-black">Organisation admin scope</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <ScopeCard icon={<UsersRound />} label="Members" />
              <ScopeCard icon={<MailPlus />} label="Invites" />
              <ScopeCard icon={<Trophy />} label="Local entries and results" />
            </div>
          </section>
        </main>
      </AppShell>
    </MajorThemeProvider>
  );
}

function ScopeCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-lg border border-border p-4 font-black text-primary">
      <span className="mb-2 block text-[var(--secondary)]">{icon}</span>
      {label}
    </div>
  );
}
