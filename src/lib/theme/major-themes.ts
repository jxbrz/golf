import type { MajorKey } from "@/lib/types";
import type { CSSProperties } from "react";

export const majorThemes: Record<
  MajorKey,
  {
    label: string;
    shortLabel: string;
    monogram: string;
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
    nav: string;
    fairway: string;
    rough: string;
    border: string;
    logoText: string;
  }
> = {
  masters: {
    label: "Masters",
    shortLabel: "Masters",
    monogram: "M",
    primary: "#006747",
    secondary: "#FFCC00",
    background: "#F6F3EA",
    surface: "#FFFFFF",
    text: "#17231A",
    muted: "#66736A",
    accent: "#17412F",
    nav: "#004B32",
    fairway: "#11884F",
    rough: "#EAF2DF",
    border: "#DDE7D5",
    logoText: "#FFCC00",
  },
  pga: {
    label: "PGA Championship",
    shortLabel: "PGA",
    monogram: "PGA",
    primary: "#08264A",
    secondary: "#D8A93B",
    background: "#EEF3F0",
    surface: "#FFFFFF",
    text: "#071526",
    muted: "#5D6F83",
    accent: "#10823C",
    nav: "#001C3D",
    fairway: "#168A43",
    rough: "#E8EEF4",
    border: "#D6DFE8",
    logoText: "#F2C766",
  },
  us_open: {
    label: "U.S. Open",
    shortLabel: "U.S. Open",
    monogram: "US",
    primary: "#0A3161",
    secondary: "#B31942",
    background: "#F7F7F7",
    surface: "#FFFFFF",
    text: "#111827",
    muted: "#64748B",
    accent: "#1E293B",
    nav: "#071D3A",
    fairway: "#0E7C4D",
    rough: "#EDF1F6",
    border: "#D9E1EA",
    logoText: "#FFFFFF",
  },
  the_open: {
    label: "The Open",
    shortLabel: "The Open",
    monogram: "OPEN",
    primary: "#111827",
    secondary: "#D6B46A",
    background: "#F4EFE6",
    surface: "#FFFFFF",
    text: "#1F2937",
    muted: "#6B7280",
    accent: "#6E2A1A",
    nav: "#101720",
    fairway: "#2D6A4F",
    rough: "#ECE4D4",
    border: "#DED4C2",
    logoText: "#F4D27B",
  },
};

export function themeStyle(majorKey: MajorKey) {
  const theme = majorThemes[majorKey];
  return {
    "--background": theme.background,
    "--foreground": theme.text,
    "--surface": theme.surface,
    "--primary": theme.primary,
    "--secondary": theme.secondary,
    "--accent": theme.accent,
    "--muted": theme.muted,
    "--nav": theme.nav,
    "--fairway": theme.fairway,
    "--rough": theme.rough,
    "--border": theme.border,
    "--gold": theme.secondary,
  } as CSSProperties;
}
