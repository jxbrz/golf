import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { OwnerShell } from "@/components/layout/OwnerShell";

export default function OwnerSettingsPage() {
  return (
    <OwnerShell>
      <div className="space-y-4">
        <Link href="/owner" className="inline-flex items-center gap-2 text-sm font-black text-primary/72">
          <ArrowLeft size={17} />
          Back to owner dashboard
        </Link>
        <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
          <p className="sport-label">Platform owner</p>
          <h1 className="mt-1 text-3xl font-black">Platform settings</h1>
          <p className="mt-1 text-muted">
            Product-wide configuration for Major Picks, separate from organisation and player settings.
          </p>
        </section>
        <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
          <Settings className="text-[var(--secondary)]" />
          <h2 className="mt-3 text-xl font-black">Settings workspace</h2>
          <p className="mt-1 text-sm font-semibold text-muted">
            Billing, provider credentials, feature flags and operational settings can be added here without touching the game dashboard.
          </p>
        </section>
      </div>
    </OwnerShell>
  );
}
