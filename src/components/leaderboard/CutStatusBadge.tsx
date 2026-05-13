import type { EntryStatus, GolferStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CutStatusBadge({
  status,
}: {
  status: EntryStatus | GolferStatus | "made_cut" | "needs_drop";
}) {
  const labelMap: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    qualified: "Qualified",
    drop_required: "Drop required",
    eliminated: "Eliminated",
    final: "Final",
    active: "Active",
    cut: "Cut",
    wd: "WD",
    dq: "DQ",
    finished: "Finished",
    made_cut: "Made cut",
    needs_drop: "Needs drop",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide",
        ["qualified", "made_cut", "active", "final", "finished"].includes(status)
          ? "bg-emerald-50 text-emerald-800"
          : ["drop_required", "needs_drop"].includes(status)
            ? "bg-amber-50 text-amber-800"
            : ["eliminated", "cut", "wd", "dq"].includes(status)
              ? "bg-rose-50 text-rose-800"
              : "bg-slate-100 text-slate-700",
      )}
    >
      {labelMap[status]}
    </span>
  );
}
