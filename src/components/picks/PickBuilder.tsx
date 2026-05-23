"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Plus, Search, X } from "lucide-react";
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
  const pickableGolfers = useMemo(
    () => golfers.filter((golfer) => golfer.pointValue !== null),
    [golfers],
  );
  const selectedGolfers = pickableGolfers.filter((golfer) => selected.includes(golfer.id));
  const used = selectedGolfers.reduce((total, golfer) => total + (golfer.pointValue ?? 0), 0);
  const filtered = useMemo(
    () =>
      pickableGolfers.filter((golfer) =>
        golfer.golfer.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [pickableGolfers, query],
  );
  const valid = selected.length === 4 && used <= 90 && !locked;
  const showFloatingBudget = !locked && selected.length > 0 && !summaryVisible;
  const submitLabel = selected.length < 4 ? `Pick ${4 - selected.length} more` : used > 90 ? "Over budget" : "Submit team";

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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <FloatingBudgetBar used={used} visible={showFloatingBudget} />
      <MobilePickDock
        tournamentId={tournamentId}
        selectedIds={selected}
        selectedGolfers={selectedGolfers}
        used={used}
        valid={valid}
        label={submitLabel}
        visible={!locked && selected.length > 0 && !summaryVisible}
      />
      <section className="app-panel">
        <div className="app-panel-header p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="sport-label">Pick Team</p>
              <h2 className="mt-1 text-2xl font-black">Available golfers</h2>
              <p className="mt-1 text-sm font-semibold text-muted">Only priced sweepstake players can be selected.</p>
            </div>
            <div className="rounded-md bg-primary px-3 py-2 text-sm font-black text-white">
              {selected.length}/4 selected
            </div>
          </div>
        </div>
        <div className="p-4">
        <label className="mb-3 flex h-12 items-center gap-2 rounded-md border border-border bg-white px-3 shadow-sm">
          <Search size={20} className="text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search golfers"
            className="w-full bg-transparent text-base outline-none"
          />
        </label>
        <div className="overflow-hidden rounded-md border border-border">
          {filtered.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm font-semibold text-muted">
              No priced sweepstake golfers match that search.
            </p>
          ) : null}
          {filtered.map((golfer) => {
            const chosen = selected.includes(golfer.id);
            const unaffordable = !chosen && used + (golfer.pointValue ?? 0) > 90;
            return (
              <button
                key={golfer.id}
                type="button"
                onClick={() => toggle(golfer.id)}
                disabled={locked || unaffordable || (!chosen && selected.length === 4)}
                className={cn(
                  "grid w-full grid-cols-[1fr_auto] gap-3 border-b border-border bg-white px-3 py-3 text-left transition last:border-b-0 hover:bg-slate-50",
                  chosen &&
                    "bg-emerald-50 text-emerald-950 ring-1 ring-inset ring-emerald-500",
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
                <span className="flex size-11 items-center justify-center rounded-md bg-primary font-mono text-lg font-black text-white">
                  {chosen ? <CheckCircle2 size={18} /> : golfer.pointValue}
                </span>
              </button>
            );
          })}
        </div>
        </div>
      </section>

      <aside
        ref={summaryRef}
        className="app-panel p-4 lg:sticky lg:top-7 lg:self-start"
      >
        <p className="sport-label">Budget</p>
        <h2 className="mt-1 text-xl font-black">Team sheet</h2>
        <p className="mb-4 mt-1 text-sm font-semibold text-muted">Four names. Ninety points. No changes after submission.</p>
        <BudgetBar used={used} />
        <div className="my-4 min-h-40 overflow-hidden rounded-md border border-border">
          {selectedGolfers.length ? (
            selectedGolfers.map((golfer) => (
              <div key={golfer.id} className="flex items-center justify-between gap-3 border-b border-border bg-white px-3 py-3 last:border-b-0">
                <span className="min-w-0">
                  <span className="block truncate font-black">{golfer.golfer.name}</span>
                  <span className="mt-0.5 block text-xs font-semibold text-muted">{golfer.golfer.country ?? "INT"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => toggle(golfer.id)}
                  className="flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1 text-sm font-black text-primary"
                >
                  <span className="font-mono">{golfer.pointValue}</span>
                  <X size={14} />
                </button>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-muted">No players selected yet.</p>
          )}
        </div>
        <form action={submitEntryAction}>
          <input type="hidden" name="tournamentId" value={tournamentId} />
          <input type="hidden" name="pickIds" value={selected.join(",")} />
          <button disabled={!valid} className="app-button h-12 w-full disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none">
            Submit Team
            <ArrowRight size={18} />
          </button>
        </form>
      </aside>
    </div>
  );
}

function MobilePickDock({
  tournamentId,
  selectedIds,
  selectedGolfers,
  used,
  valid,
  label,
  visible,
}: {
  tournamentId: string;
  selectedIds: string[];
  selectedGolfers: Array<TournamentGolfer & { golfer: { name: string; country: string | null } }>;
  used: number;
  valid: boolean;
  label: string;
  visible: boolean;
}) {
  return (
    <div
      className={`fixed inset-x-3 bottom-20 z-30 rounded-lg border border-white/10 bg-[var(--nav)] p-3 text-white shadow-2xl transition-all duration-200 lg:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase text-white/60">My picks</p>
          <p className="font-mono text-sm font-black">{used}/90 points</p>
        </div>
        <div className="flex -space-x-2">
          {selectedGolfers.map((golfer) => (
            <span
              key={golfer.id}
              className="flex size-8 items-center justify-center rounded-full border border-white/30 bg-[var(--secondary)] text-xs font-black text-primary"
              title={golfer.golfer.name}
            >
              {golfer.golfer.name.slice(0, 1)}
            </span>
          ))}
          {Array.from({ length: Math.max(0, 4 - selectedGolfers.length) }).map((_, index) => (
            <span
              key={index}
              className="flex size-8 items-center justify-center rounded-full border border-dashed border-white/30 text-white/50"
            >
              <Plus size={14} />
            </span>
          ))}
        </div>
      </div>
      <form action={submitEntryAction}>
        <input type="hidden" name="tournamentId" value={tournamentId} />
        <input type="hidden" name="pickIds" value={selectedIds.join(",")} />
        <button
          disabled={!valid}
          className="app-button h-12 w-full disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
        >
          {label}
          <ArrowRight size={17} />
        </button>
      </form>
    </div>
  );
}
