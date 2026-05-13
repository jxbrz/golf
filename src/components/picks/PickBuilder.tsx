"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import { submitEntryAction } from "@/app/actions";
import { BudgetBar } from "@/components/picks/BudgetBar";
import { FloatingBudgetBar } from "@/components/picks/FloatingBudgetBar";
import type { TournamentGolfer } from "@/lib/types";
import { cn, formatScore } from "@/lib/utils";

export function PickBuilder({
  tournamentId,
  golfers,
  locked,
}: {
  tournamentId: string;
  golfers: Array<TournamentGolfer & { golfer: { name: string; country: string | null } }>;
  locked: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const summaryRef = useRef<HTMLElement | null>(null);
  const selectedGolfers = golfers.filter((golfer) => selected.includes(golfer.id));
  const used = selectedGolfers.reduce((total, golfer) => total + golfer.pointValue, 0);
  const filtered = useMemo(
    () =>
      golfers.filter((golfer) =>
        golfer.golfer.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [golfers, query],
  );
  const valid = selected.length === 4 && used <= 90 && !locked;
  const showFloatingBudget = !locked && selected.length > 0 && !summaryVisible;

  useEffect(() => {
    const element = summaryRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setSummaryVisible(entry.isIntersecting),
      { threshold: 0.25 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function toggle(id: string) {
    if (locked) return;
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 4
          ? [...current, id]
          : current,
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <FloatingBudgetBar used={used} visible={showFloatingBudget} />
      <section className="rounded-lg border border-border bg-surface p-4 scorecard-shadow">
        <label className="mb-3 flex h-12 items-center gap-2 rounded-md border border-border bg-white px-3">
          <Search size={20} className="text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search golfers"
            className="w-full bg-transparent text-base outline-none"
          />
        </label>
        <div className="divide-y divide-border">
          {filtered.map((golfer) => {
            const chosen = selected.includes(golfer.id);
            const unaffordable = !chosen && used + golfer.pointValue > 90;
            return (
              <button
                key={golfer.id}
                type="button"
                onClick={() => toggle(golfer.id)}
                disabled={locked || unaffordable || (!chosen && selected.length === 4)}
                className={cn(
                  "grid w-full grid-cols-[1fr_auto] gap-3 rounded-md px-2 py-3 text-left transition",
                  chosen &&
                    "border border-emerald-500 bg-emerald-100 text-emerald-950 ring-2 ring-emerald-500/25",
                  unaffordable && "opacity-45",
                )}
              >
                <span>
                  <span className="flex items-center gap-2 text-base font-bold">
                    {chosen ? <CheckCircle2 size={18} className="text-emerald-700" /> : null}
                    {golfer.golfer.name}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {golfer.totalScore === null
                      ? "Not started"
                      : `${golfer.position ?? "-"} - ${formatScore(golfer.totalScore)}`}{" "}
                    - {golfer.golfer.country}
                  </span>
                </span>
                <span className="flex size-11 items-center justify-center rounded-md border border-border font-mono text-lg font-black">
                  {golfer.pointValue}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <aside
        ref={summaryRef}
        className="rounded-lg border border-border bg-surface p-4 scorecard-shadow lg:sticky lg:top-4 lg:self-start"
      >
        <h2 className="text-xl font-black">Selected team</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Pick 4 golfers. Submitted teams are locked.</p>
        <BudgetBar used={used} />
        <div className="my-4 min-h-40 divide-y divide-border">
          {selectedGolfers.length ? (
            selectedGolfers.map((golfer) => (
              <div key={golfer.id} className="flex items-center justify-between gap-3 py-3">
                <span className="font-bold">{golfer.golfer.name}</span>
                <span className="font-mono font-black">{golfer.pointValue}</span>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-muted">No players selected yet.</p>
          )}
        </div>
        <form action={submitEntryAction}>
          <input type="hidden" name="tournamentId" value={tournamentId} />
          <input type="hidden" name="pickIds" value={selected.join(",")} />
          <button
            disabled={!valid}
            className="h-12 w-full rounded-md bg-primary px-4 text-base font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
          >
            Submit locked team
          </button>
        </form>
      </aside>
    </div>
  );
}
