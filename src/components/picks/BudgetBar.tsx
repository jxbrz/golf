export function BudgetBar({ used }: { used: number }) {
  const percentage = Math.min(100, Math.max(0, Math.round((used / 90) * 100)));
  const remaining = 90 - used;
  return (
    <div className="budget-card rounded-lg border border-border bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-3">
        <span>
          <span className="block text-[11px] font-black uppercase text-muted">Budget Remaining</span>
          <span className="font-mono text-3xl font-black leading-none text-primary">{Math.max(0, remaining)}</span>
          <span className="ml-1 font-mono text-xs font-black uppercase text-muted">pts</span>
        </span>
        <span className="text-right">
          <span className="block text-[10px] font-black uppercase text-muted">Spent</span>
          <span className={remaining >= 0 ? "font-mono text-lg font-black text-primary" : "font-mono text-lg font-black text-rose-700"}>
            {used} <span className="text-xs text-muted">/ 90</span>
          </span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 shadow-inner">
        <div
          className={remaining >= 0 ? "h-full rounded-full bg-[var(--fairway)]" : "h-full rounded-full bg-rose-600"}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
