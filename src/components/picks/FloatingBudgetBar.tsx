"use client";

export function FloatingBudgetBar({
  used,
  visible,
}: {
  used: number;
  visible: boolean;
}) {
  const remaining = 90 - used;
  const percentage = Math.min(100, Math.max(0, Math.round((used / 90) * 100)));

  return (
    <div
      className={`fixed inset-x-0 top-0 z-40 border-b border-border bg-surface/95 px-4 py-2 shadow-sm backdrop-blur transition-transform duration-200 lg:hidden ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto max-w-md">
        <div className="mb-1 flex items-center justify-between text-[11px] font-black uppercase text-primary">
          <span>{used}/90 points</span>
          <span className={remaining >= 0 ? "text-emerald-800" : "text-rose-700"}>
            {remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className={remaining >= 0 ? "h-full bg-primary" : "h-full bg-rose-600"}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
