import { clsx, type ClassValue } from "clsx";

export function cn(...values: ClassValue[]) {
  return clsx(values);
}

export function formatScore(score: number | null | undefined) {
  if (score === null || score === undefined) return "-";
  if (score === 0) return "E";
  return score > 0 ? `+${score}` : `${score}`;
}

export function formatScoreOrLabel(
  score: number | null | undefined,
  emptyLabel = "Not started",
) {
  if (score === null || score === undefined) return emptyLabel;
  return formatScore(score);
}

export function formatCost(cost: number | null | undefined) {
  return cost === null || cost === undefined ? "N/A" : String(cost);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function nowIso() {
  return new Date().toISOString();
}
