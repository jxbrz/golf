import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OwnerShell } from "@/components/layout/OwnerShell";
import { listPlatformUsers } from "@/lib/db-data/organisations";

export default async function OwnerUsersPage() {
  const users = await listPlatformUsers();

  return (
    <OwnerShell>
        <div className="space-y-4">
          <Link href="/owner" className="inline-flex items-center gap-2 text-sm font-black text-primary/72">
            <ArrowLeft size={17} />
            Back to owner dashboard
          </Link>
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <p className="sport-label">Platform owner</p>
            <h1 className="mt-1 text-3xl font-black">Platform users</h1>
            <p className="mt-1 text-muted">View users known to the platform.</p>
          </section>
          <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
            <div className="grid gap-2">
              {users.length ? (
                users.map((user) => (
                  <div key={user.id} className="rounded-md border border-border p-3">
                    <p className="font-black">{user.name}</p>
                    <p className="text-sm font-semibold text-muted">
                      {user.email} · {user.role} · joined {formatDate(user.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-border p-3 text-sm font-semibold text-muted">
                  No database users found.
                </p>
              )}
            </div>
          </section>
        </div>
    </OwnerShell>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}
