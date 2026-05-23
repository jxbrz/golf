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
    sm: "size-10 text-[10px]",
    md: "size-12 text-xs",
    lg: "size-[4.5rem] text-sm",
  };

  return (
    <span
      className={`major-crest flex shrink-0 flex-col items-center justify-center border-2 font-black tracking-wide shadow-sm ${sizes[size]}`}
      style={{
        background: `linear-gradient(180deg, ${theme.primary}, ${theme.nav})`,
        borderColor: theme.secondary,
        color: theme.logoText,
      }}
      aria-label={theme.label}
    >
      <span className="font-mono text-[0.55em] leading-none opacity-80">20</span>
      <span className="app-display leading-none">{theme.monogram}</span>
      <span className="font-mono text-[0.55em] leading-none opacity-80">26</span>
    </span>
  );
}
