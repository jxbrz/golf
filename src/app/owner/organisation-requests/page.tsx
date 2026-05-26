import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import {
  approveOrganisationRequestAction,
  rejectOrganisationRequestAction,
} from "@/app/actions";
import { AppShell } from "@/components/layout/AppShell";
import { MajorThemeProvider } from "@/components/theme/MajorThemeProvider";
import { requirePlatformAdminOrOwner } from "@/lib/auth";
import { listOrganisationRequests } from "@/lib/db-data/organisations";
import { getActiveTournament } from "@/lib/mock-data/store";

export default async function OwnerOrganisationRequestsPage() {
  await requirePlatformAdminOrOwner();
  const active = getActiveTournament();
  const requests = await listOrganisationRequests();
  const grouped = {
    pending: requests.filter((request) => request.status === "pending"),
    approved: requests.filter((request) => request.status === "approved"),
    rejected: requests.filter((request) => request.status === "rejected"),
  };

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
            <h1 className="mt-1 text-3xl font-black">Organisation requests</h1>
            <p className="mt-1 text-muted">
              Review access requests and create private Major Picks organisations.
            </p>
          </section>
          {(["pending", "approved", "rejected"] as const).map((status) => (
            <section key={status} className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
              <h2 className="text-xl font-black capitalize">{status}</h2>
              <div className="mt-4 grid gap-3">
                {grouped[status].length ? (
                  grouped[status].map((request) => (
                    <article key={request.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm font-black uppercase text-muted">
                            {request.organisationType.replaceAll("_", " ")} · {request.expectedPlayers} players
                          </p>
                          <h3 className="mt-1 text-xl font-black">{request.organisationName}</h3>
                          <p className="mt-1 font-semibold text-muted">
                            {request.contactName} · {request.email}
                          </p>
                          {request.message ? (
                            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-primary/78">
                              {request.message}
                            </p>
                          ) : null}
                          <p className="mt-3 text-xs font-black uppercase text-muted">
                            Requested {formatDate(request.createdAt)}
                          </p>
                        </div>
                        {request.status === "pending" ? (
                          <div className="flex gap-2">
                            <form action={approveOrganisationRequestAction}>
                              <input type="hidden" name="requestId" value={request.id} />
                              <button className="app-button h-11 px-4" type="submit">
                                <CheckCircle2 size={17} />
                                Approve
                              </button>
                            </form>
                            <form action={rejectOrganisationRequestAction}>
                              <input type="hidden" name="requestId" value={request.id} />
                              <button
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-white px-4 font-black text-primary"
                                type="submit"
                              >
                                <XCircle size={17} />
                                Reject
                              </button>
                            </form>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-4 text-sm font-semibold text-muted">
                    No {status} requests.
                  </p>
                )}
              </div>
            </section>
          ))}
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
