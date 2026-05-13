import { themeStyle } from "@/lib/theme/major-themes";
import type { MajorKey } from "@/lib/types";

export function MajorThemeProvider({
  majorKey,
  children,
}: {
  majorKey: MajorKey;
  children: React.ReactNode;
}) {
  return (
    <div style={themeStyle(majorKey)} className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
