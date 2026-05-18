import Link from "next/link";
import { applyOddsPricingAction } from "@/app/actions";
import type { OddsPricingPreview } from "@/lib/odds/providers";

export function OddsPricingPanel({
  tournamentId,
  preview,
}: {
  tournamentId: string;
  preview?: OddsPricingPreview;
}) {
  return (
    <section id="odds" className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-muted">Sweepstake pricing</p>
          <h2 className="text-xl font-black">Odds-based costs</h2>
          <p className="mt-1 text-sm text-muted">
            Rank outright winner odds into costs: favourite 55, 55th favourite 1.
          </p>
        </div>
        <Link
          href={`/admin/tournaments/${tournamentId}?odds=preview#odds`}
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 font-black text-white"
        >
          Preview Odds Pricing
        </Link>
      </div>

      {preview?.error ? (
        <p className="mt-4 rounded-md bg-rose-50 p-3 text-sm font-bold text-rose-800">
          {preview.error}
        </p>
      ) : null}

      {preview && !preview.error ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-2 text-sm sm:grid-cols-4">
            <Stat label="Provider" value={preview.provider} />
            <Stat label="Sport key" value={preview.sportKey} />
            <Stat label="Matched" value={`${preview.matchedCount}/55`} />
            <Stat label="Unmatched" value={String(preview.unmatched.length)} />
          </div>

          {preview.unmatched.length ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-black text-amber-900">Review unmatched runners before applying</p>
              <p className="mt-1 text-amber-900/80">
                These odds names did not match the tournament field and will not receive costs.
              </p>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[3rem_3.5rem_1fr_1fr_4rem] gap-2 bg-slate-50 px-3 py-2 text-xs font-black uppercase text-muted">
              <span>Rank</span>
              <span>Cost</span>
              <span>Odds runner</span>
              <span>Matched golfer</span>
              <span className="text-right">Odds</span>
            </div>
            <div className="max-h-96 overflow-auto divide-y divide-border">
              {preview.rows.map((row) => (
                <div
                  key={`${row.rank}-${row.runnerName}`}
                  className="grid grid-cols-[3rem_3.5rem_1fr_1fr_4rem] gap-2 px-3 py-2 text-sm"
                >
                  <span className="font-mono font-black">{row.rank}</span>
                  <span className="font-mono font-black">{row.cost}</span>
                  <span className="min-w-0 truncate font-semibold">{row.runnerName}</span>
                  <span className={row.matchedGolferName ? "min-w-0 truncate" : "font-bold text-rose-800"}>
                    {row.matchedGolferName ?? "Unmatched"}
                  </span>
                  <span className="text-right font-mono">
                    {row.averageDecimalOdds.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form action={applyOddsPricingAction}>
            <input type="hidden" name="tournamentId" value={tournamentId} />
            <button className="h-11 rounded-md bg-primary px-4 font-black text-white">
              Apply Matched Top 55 Costs
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md bg-slate-50 p-3">
      <span className="block text-xs font-black uppercase text-muted">{label}</span>
      <span className="mt-1 block truncate font-mono font-black text-primary">{value}</span>
    </span>
  );
}
