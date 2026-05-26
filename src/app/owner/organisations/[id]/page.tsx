import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Copy, MailPlus } from "lucide-react";
import { createInviteAction } from "@/app/actions";
import { OwnerShell } from "@/components/layout/OwnerShell";
import { getOrganisationDetail } from "@/lib/db-data/organisations";

export default async function OwnerOrganisationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invite?: string; inviteError?: string }>;
}) {
  const { id } = await params;
  const { invite, inviteError } = await searchParams;
  const detail = await getOrganisationDetail(id);
  if (!detail) notFound();

  const joinLink = invite ? `/join/${invite}` : null;

  return (
    <OwnerShell>
        <div className="space-y-4">
          <Link href="/owner/organisations" className="inline-flex items-center gap-2 text-sm font-black text-primary/72">
            <ArrowLeft size={17} />
            Back to all organisations
          </Link>

          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <p className="sport-label">Platform organisation · {detail.organisation.type.replaceAll("_", " ")}</p>
            <h1 className="mt-1 text-3xl font-black">{detail.organisation.name}</h1>
            <p className="mt-1 text-muted">
              {detail.members.length} members · {detail.leagues.length} leagues · created{" "}
              {formatDate(detail.organisation.createdAt)}
            </p>
          </section>

          {joinLink ? (
            <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 scorecard-shadow">
              <p className="sport-label text-emerald-800">Invite created</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="rounded-md bg-white px-3 py-2 text-sm font-black text-primary">{joinLink}</code>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-900">
                  <Copy size={15} />
                  Share this link with the invited player.
                </span>
              </div>
            </section>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
            <section className="space-y-4">
              <Panel title="Leagues">
                {detail.leagues.length ? (
                  <div className="grid gap-2">
                    {detail.leagues.map((league) => (
                      <div key={league.id} className="rounded-md border border-border p-3">
                        <p className="font-black">{league.name}</p>
                        <p className="text-sm font-semibold text-muted">
                          {league.seasonYear} · {league.status}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No leagues yet." />
                )}
              </Panel>

              <Panel title="Members">
                {detail.members.length ? (
                  <div className="grid gap-2">
                    {detail.members.map(({ member, user }) => (
                      <div key={member.id} className="rounded-md border border-border p-3">
                        <p className="font-black">{user?.name ?? member.userId}</p>
                        <p className="text-sm font-semibold text-muted">
                          {user?.email ?? "No email"} · {member.role}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No members yet." />
                )}
              </Panel>

              <Panel title="Invites">
                {detail.invites.length ? (
                  <div className="grid gap-2">
                    {detail.invites.map((inviteRow) => (
                      <div key={inviteRow.id} className="rounded-md border border-border p-3">
                        <p className="font-black">{inviteRow.email}</p>
                        <p className="text-sm font-semibold text-muted">
                          {inviteRow.role} · {inviteRow.status} · expires {formatDate(inviteRow.expiresAt)}
                        </p>
                        <code className="mt-2 inline-block rounded bg-[#f8fafc] px-2 py-1 text-xs font-black text-primary">
                          /join/{inviteRow.inviteCode}
                        </code>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No invites yet." />
                )}
              </Panel>
            </section>

            <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
              <div className="flex items-center gap-2">
                <MailPlus size={20} />
                <h2 className="text-xl font-black">Create invite</h2>
              </div>
              {inviteError ? (
                <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
                  Check the invite details and try again.
                </p>
              ) : null}
              <form action={createInviteAction} className="mt-4 grid gap-3">
                <input type="hidden" name="organisationId" value={detail.organisation.id} />
                <input type="hidden" name="returnTo" value={`/owner/organisations/${detail.organisation.id}`} />
                <label className="block">
                  <span className="text-sm font-black uppercase text-muted">Email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    className="mt-2 h-11 w-full rounded-md border border-border px-3 font-semibold outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-black uppercase text-muted">Role</span>
                  <select
                    name="role"
                    defaultValue="player"
                    className="mt-2 h-11 w-full rounded-md border border-border px-3 font-semibold outline-none focus:border-primary"
                  >
                    <option value="player">Player</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-black uppercase text-muted">League</span>
                  <select
                    name="leagueId"
                    required
                    className="mt-2 h-11 w-full rounded-md border border-border px-3 font-semibold outline-none focus:border-primary"
                  >
                    {detail.leagues.map((league) => (
                      <option key={league.id} value={league.id}>
                        {league.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-black uppercase text-muted">Expiry date</span>
                  <input
                    name="expiresAt"
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    className="mt-2 h-11 w-full rounded-md border border-border px-3 font-semibold outline-none focus:border-primary"
                  />
                </label>
                <button className="app-button h-11 w-full" type="submit" disabled={detail.leagues.length === 0}>
                  Create invite
                </button>
              </form>
            </section>
          </div>
        </div>
    </OwnerShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
      <h2 className="text-xl font-black">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed border-border p-3 text-sm font-semibold text-muted">{text}</p>;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}
