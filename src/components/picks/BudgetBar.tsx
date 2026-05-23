export function BudgetBar({ used }: { used: number }) {
  const percentage = Math.min(100, Math.round((used / 90) * 100));
  const remaining = 90 - used;
  return (
    <div className="rounded-md border border-border bg-[var(--rough)] p-3">
      <div className="mb-2 flex items-end justify-between gap-3">
        <span>
          <span className="block text-[11px] font-black uppercase text-muted">Budget used</span>
          <span className="font-mono text-2xl font-black text-primary">{used}</span>
          <span className="font-mono text-sm font-black text-muted"> / 90</span>
        </span>
        <span className={remaining >= 0 ? "text-sm font-black text-emerald-800" : "text-sm font-black text-rose-700"}>
          {remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white shadow-inner">
        <div
          className={remaining >= 0 ? "h-full rounded-full bg-[var(--fairway)]" : "h-full rounded-full bg-rose-600"}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
