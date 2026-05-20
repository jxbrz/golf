import { importGolfersAction } from "@/app/actions";

export function CsvGolferImport({ tournamentId }: { tournamentId: string }) {
  return (
    <section className="app-panel p-4">
      <p className="sport-label">Field setup</p>
      <h2 className="mt-1 text-xl font-black">Import golfers</h2>
      <p className="mt-1 text-sm font-semibold text-muted">
        Paste CSV with columns: name, points. Optional: country, providerPlayerId.
      </p>
      <form action={importGolfersAction} className="mt-4 space-y-3">
        <input type="hidden" name="tournamentId" value={tournamentId} />
        <textarea
          name="csv"
          rows={8}
          className="w-full rounded-md border border-border bg-white p-3 font-mono text-sm outline-none focus:border-primary"
          defaultValue={"name,points,country\nExample Player,12,USA"}
        />
        <button className="app-button">
          Import CSV
        </button>
      </form>
    </section>
  );
}
