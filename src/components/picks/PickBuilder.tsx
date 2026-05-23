"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronUp,
  ListFilter,
  Plus,
  Search,
  X,
} from "lucide-react";
import { submitEntryAction } from "@/app/actions";
import { GolferHeadshot } from "@/components/golfers/GolferHeadshot";
import { BudgetBar } from "@/components/picks/BudgetBar";
import type { TournamentGolfer } from "@/lib/types";
import { cn, formatScore } from "@/lib/utils";

type PickableGolfer = TournamentGolfer & { golfer: { name: string; country: string | null } };

export function PickBuilder({
  tournamentId,
  golfers,
  locked,
}: {
  tournamentId: string;
  golfers: PickableGolfer[];
  locked: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "affordable" | "value" | "selected">("all");

  const pickableGolfers = useMemo(
    () => golfers.filter((golfer) => golfer.pointValue !== null),
    [golfers],
  );
  const selectedGolfers = pickableGolfers.filter((golfer) => selected.includes(golfer.id));
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const used = selectedGolfers.reduce((total, golfer) => total + (golfer.pointValue ?? 0), 0);
  const filtered = useMemo(
    () => {
      const search = query.trim().toLowerCase();
      return pickableGolfers.filter((golfer) => {
        const matchesSearch = golfer.golfer.name.toLowerCase().includes(search);
        const chosen = selectedSet.has(golfer.id);
        const affordable = chosen || selected.length < 4 && used + (golfer.pointValue ?? 0) <= 90;
        const valuePick = (golfer.pointValue ?? 0) <= 25;

        if (!matchesSearch) return false;
        if (filterMode === "affordable") return affordable;
        if (filterMode === "value") return valuePick;
        if (filterMode === "selected") return chosen;
        return true;
      });
    },
    [filterMode, pickableGolfers, query, selected.length, selectedSet, used],
  );
  const visibleGolfers = tab === "mine" ? selectedGolfers : filtered;
  const valid = selected.length === 4 && used <= 90 && !locked;
  const submitLabel = selected.length < 4 ? `Pick ${4 - selected.length} more` : used > 90 ? "Over budget" : "Submit team";

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
      <MobilePickDock
        tournamentId={tournamentId}
        selectedIds={selected}
        selectedGolfers={selectedGolfers}
        used={used}
        valid={valid}
        label={submitLabel}
        visible={!locked && selected.length > 0}
      />

      <section className="space-y-3">
        <BudgetBar used={used} />

        <div className="mock-tabs">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={tab === "all" ? "active" : ""}
          >
            All Golfers
          </button>
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={tab === "mine" ? "active" : ""}
          >
            My Picks ({selected.length}/4)
          </button>
        </div>

        <div className="relative grid grid-cols-[1fr_5.5rem] gap-2">
          <label className="flex h-11 items-center gap-2 rounded-md border border-border bg-white px-3 shadow-sm">
            <Search size={18} className="text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search golfers"
              className="w-full bg-transparent text-sm font-semibold outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => setFilterOpen((open) => !open)}
            className="flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold text-primary shadow-sm"
            aria-expanded={filterOpen}
            aria-controls="pick-filter-menu"
          >
            {filterMode === "all" ? "Filter" : filterLabels[filterMode]}
            <ListFilter size={17} />
          </button>
          {filterOpen ? (
            <div
              id="pick-filter-menu"
              className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-lg border border-border bg-white shadow-xl"
            >
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFilterMode(option.value);
                    setFilterOpen(false);
                    if (option.value === "selected") setTab("all");
                  }}
                  className="grid w-full grid-cols-[1rem_1fr] items-start gap-3 border-b border-border px-3 py-3 text-left last:border-b-0 hover:bg-slate-50"
                >
                  <span className="pt-0.5 text-[var(--fairway)]">
                    {filterMode === option.value ? <Check size={15} strokeWidth={3} /> : null}
                  </span>
                  <span>
                    <span className="block text-sm font-black text-primary">{option.label}</span>
                    <span className="mt-0.5 block text-xs font-semibold text-muted">{option.detail}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p className="mb-2 px-1 text-[11px] font-black uppercase text-muted">
            {tab === "mine" ? "Selected Players" : "Top Players"}
          </p>
          <div className="mock-card overflow-hidden">
            {visibleGolfers.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm font-semibold text-muted">
                {tab === "mine" ? "Your selected golfers will appear here." : "No priced sweepstake golfers match that search."}
              </p>
            ) : null}
            {visibleGolfers.map((golfer) => {
              const chosen = selectedSet.has(golfer.id);
              const unaffordable = !chosen && used + (golfer.pointValue ?? 0) > 90;
              const disabled = locked || unaffordable || (!chosen && selected.length === 4);
              return (
                <button
                  key={golfer.id}
                  type="button"
                  onClick={() => toggle(golfer.id)}
                  disabled={disabled}
                  className={cn(
                    "grid w-full grid-cols-[2.8rem_1fr_3.35rem_2.5rem] items-center gap-2 border-b border-border bg-white px-3 py-2.5 text-left transition last:border-b-0 hover:bg-slate-50",
                    chosen && "bg-emerald-50/80",
                    unaffordable && "opacity-45",
                  )}
                >
                  <GolferHeadshot name={golfer.golfer.name} size="md" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold leading-4 text-primary">
                      {splitName(golfer.golfer.name).first}
                    </span>
                    <span className="app-display block truncate text-lg font-bold leading-5 text-primary">
                      {splitName(golfer.golfer.name).last}
                      <span className="ml-1 font-sans text-[11px] font-bold text-muted">
                        {golfer.golfer.country ?? "INT"}
                      </span>
                    </span>
                    <span className="block text-[11px] font-semibold text-muted">
                      {golfer.totalScore === null
                        ? "Not started"
                        : `${golfer.position ?? "-"} - ${formatScore(golfer.totalScore)}`}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-mono text-xl font-black leading-5 text-primary metric-number">
                      {golfer.pointValue}
                    </span>
                    <span className="text-[10px] font-black uppercase text-muted">pts</span>
                  </span>
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full text-white shadow-sm",
                      chosen ? "bg-[var(--fairway)]" : "bg-[var(--fairway)]",
                    )}
                  >
                    {chosen ? <CheckCircle2 size={18} /> : <Plus size={20} strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="app-panel hidden p-4 lg:sticky lg:top-7 lg:block lg:self-start">
        <p className="sport-label">Your Team</p>
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
  selectedGolfers: PickableGolfer[];
  used: number;
  valid: boolean;
  label: string;
  visible: boolean;
}) {
  return (
    <div
      className={`pick-dock fixed inset-x-3 bottom-[4.75rem] z-30 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-[var(--nav)] p-3 text-white shadow-2xl transition-all duration-200 lg:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <div className="text-center">
        <p className="text-[11px] font-black text-[var(--fairway)]">{selectedGolfers.length}</p>
        <p className="text-[9px] font-black uppercase leading-3 text-white/64">Picks</p>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex -space-x-2">
          {selectedGolfers.map((golfer) => (
            <GolferHeadshot key={golfer.id} name={golfer.golfer.name} size="sm" className="ring-1 ring-white/70" />
          ))}
          {Array.from({ length: Math.max(0, 4 - selectedGolfers.length) }).map((_, index) => (
            <span
              key={index}
              className="flex size-8 items-center justify-center rounded-full border border-dashed border-white/30 bg-white/8 text-white/50"
            >
              <Plus size={14} />
            </span>
          ))}
        </div>
        <div className="ml-auto hidden min-w-0 sm:block">
          <p className="truncate text-[11px] font-black uppercase text-white/56">Budget</p>
          <p className="font-mono text-sm font-black">{used}/90</p>
        </div>
        <ChevronUp className="ml-auto text-white/78" size={18} />
      </div>
      <form action={submitEntryAction}>
        <input type="hidden" name="tournamentId" value={tournamentId} />
        <input type="hidden" name="pickIds" value={selectedIds.join(",")} />
        <button
          disabled={!valid}
          className="app-button h-11 min-w-[7.5rem] px-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
        >
          {label}
        </button>
      </form>
    </div>
  );
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ").toUpperCase() };
}

const filterLabels = {
  all: "Filter",
  affordable: "Affordable",
  value: "Value",
  selected: "Selected",
};

const filterOptions: Array<{
  value: "all" | "affordable" | "value" | "selected";
  label: string;
  detail: string;
}> = [
  { value: "all", label: "All golfers", detail: "Show the full priced field." },
  { value: "affordable", label: "Affordable now", detail: "Hide players who would take you over 90." },
  { value: "value", label: "Value picks", detail: "Show golfers priced 25 points or less." },
  { value: "selected", label: "Selected only", detail: "Show the players currently in your team." },
];
