import type { MajorKey } from "@/lib/types";
import type { CSSProperties } from "react";

export const majorThemes: Record<
  MajorKey,
  {
    label: string;
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
  }
> = {
  masters: {
    label: "Masters",
    primary: "#006747",
    secondary: "#F2C75C",
    background: "#F6F3EA",
    surface: "#FFFFFF",
    text: "#17231A",
    muted: "#66736A",
    accent: "#17412F",
  },
  pga: {
    label: "PGA Championship",
    primary: "#102A43",
    secondary: "#D4AF37",
    background: "#F5F7FA",
    surface: "#FFFFFF",
    text: "#111827",
    muted: "#64748B",
    accent: "#1D3557",
  },
  us_open: {
    label: "U.S. Open",
    primary: "#0A3161",
    secondary: "#B31942",
    background: "#F7F7F7",
    surface: "#FFFFFF",
    text: "#111827",
    muted: "#64748B",
    accent: "#1E293B",
  },
  the_open: {
    label: "The Open",
    primary: "#111827",
    secondary: "#C8A45D",
    background: "#F4EFE6",
    surface: "#FFFFFF",
    text: "#1F2937",
    muted: "#6B7280",
    accent: "#5C4033",
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
  } as CSSProperties;
}
