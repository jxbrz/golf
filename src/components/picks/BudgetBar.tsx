export function BudgetBar({ used }: { used: number }) {
  const percentage = Math.min(100, Math.round((used / 90) * 100));
  const remaining = 90 - used;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-bold">
        <span>90 Point Cap</span>
        <span>{remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`}</span>
      </div>
      <div className="h-3 overflow-hidden rounded bg-slate-200">
        <div
          className={remaining >= 0 ? "h-full bg-primary" : "h-full bg-rose-600"}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
