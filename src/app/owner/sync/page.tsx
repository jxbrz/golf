import Link from "next/link";
import { ArrowLeft, RadioTower } from "lucide-react";
import { OwnerShell } from "@/components/layout/OwnerShell";

export default function OwnerSyncPage() {
  return (
    <OwnerShell>
      <div className="space-y-4">
        <Link href="/owner" className="inline-flex items-center gap-2 text-sm font-black text-primary/72">
          <ArrowLeft size={17} />
          Back to owner dashboard
        </Link>
        <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
          <p className="sport-label">Platform owner</p>
          <h1 className="mt-1 text-3xl font-black">Sync status</h1>
          <p className="mt-1 text-muted">
            Provider sync, score imports and global golf data health live at platform level.
          </p>
        </section>
        <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
          <RadioTower className="text-[var(--secondary)]" />
          <h2 className="mt-3 text-xl font-black">Sync dashboard</h2>
          <p className="mt-1 text-sm font-semibold text-muted">
            Detailed provider health and sync history will be expanded here. Existing per-tournament sync tools remain under global tournament controls.
          </p>
        </section>
      </div>
    </OwnerShell>
  );
}
