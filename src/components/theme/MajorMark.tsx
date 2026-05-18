import { majorThemes } from "@/lib/theme/major-themes";
import type { MajorKey } from "@/lib/types";

export function MajorMark({
  majorKey,
  size = "md",
}: {
  majorKey: MajorKey;
  size?: "sm" | "md" | "lg";
}) {
  const theme = majorThemes[majorKey];
  const sizes = {
    sm: "size-9 text-[10px]",
    md: "size-11 text-xs",
    lg: "size-16 text-sm",
  };

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-md border font-black tracking-wide text-white shadow-sm ${sizes[size]}`}
      style={{ backgroundColor: theme.primary, borderColor: theme.secondary }}
      aria-label={theme.label}
    >
      {theme.monogram}
    </span>
  );
}
