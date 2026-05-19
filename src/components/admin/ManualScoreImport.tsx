import { importScoresAction } from "@/app/actions";

export function ManualScoreImport({ tournamentId }: { tournamentId: string }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
      <div>
        <p className="text-sm font-bold uppercase text-muted">No-API fallback</p>
        <h2 className="text-xl font-black">Import scores from CSV</h2>
        <p className="mt-1 text-sm text-muted">
          Paste leaderboard rows after each round. Unknown players are added to the field with cost N/A.
        </p>
      </div>
      <form action={importScoresAction} className="mt-4 space-y-3">
        <input type="hidden" name="tournamentId" value={tournamentId} />
        <textarea
          name="csv"
          rows={8}
          className="w-full rounded-md border border-border p-3 font-mono text-sm"
          placeholder={`name,position,total,today,round,thru,status,madeCut,r1,r2,r3,r4\nScottie Scheffler,1,-8,-3,4,18,finished,true,-2,-1,-2,-3\nCorey Conners,CUT,+8,+2,2,18,cut,false,E,+8,,`}
        />
        <button className="h-11 rounded-md bg-primary px-4 font-black text-white">
          Import scores
        </button>
      </form>
    </section>
  );
}
