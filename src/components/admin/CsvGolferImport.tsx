import { importGolfersAction } from "@/app/actions";

export function CsvGolferImport({ tournamentId }: { tournamentId: string }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
      <h2 className="text-xl font-black">Import golfers</h2>
      <p className="mt-1 text-sm text-muted">
        Paste CSV with columns: name, points. Optional: country, providerPlayerId.
      </p>
      <form action={importGolfersAction} className="mt-4 space-y-3">
        <input type="hidden" name="tournamentId" value={tournamentId} />
        <textarea
          name="csv"
          rows={8}
          className="w-full rounded-md border border-border p-3 font-mono text-sm"
          defaultValue={"name,points,country\nExample Player,12,USA"}
        />
        <button className="h-11 rounded-md bg-primary px-4 font-black text-white">
          Import CSV
        </button>
      </form>
    </section>
  );
}
