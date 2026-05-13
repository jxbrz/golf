import type {
  EntryStatus,
  EntryWithDetails,
  LeaderboardRow,
  Tournament,
  TournamentGolfer,
} from "@/lib/types";

const POINT_CAP = 90;
const TEAM_SIZE = 4;

export function calculateEntryPointTotal(
  picks: Array<{ pointValueAtPick?: number; pointValue?: number }>,
) {
  return picks.reduce(
    (total, pick) => total + (pick.pointValueAtPick ?? pick.pointValue ?? 0),
    0,
  );
}

export function validateEntryPicks(
  picks: Array<{ id: string; pointValueAtPick?: number; pointValue?: number }>,
) {
  const uniqueIds = new Set(picks.map((pick) => pick.id));
  const totalPoints = calculateEntryPointTotal(picks);
  const errors: string[] = [];

  if (picks.length !== TEAM_SIZE) errors.push("Pick exactly 4 golfers.");
  if (uniqueIds.size !== picks.length) errors.push("Each golfer can only be picked once.");
  if (totalPoints > POINT_CAP) errors.push("The team is over the 90 point cap.");

  return {
    valid: errors.length === 0,
    errors,
    totalPoints,
  };
}

export function golferCountsForCut(golfer: Pick<TournamentGolfer, "madeCut" | "status">) {
  if (golfer.status === "wd" || golfer.status === "dq" || golfer.status === "cut") {
    return golfer.madeCut === true;
  }

  return golfer.madeCut === true;
}

export function calculateCutStatus(
  picks: EntryWithDetails["picks"],
) {
  const madeCutPicks = picks.filter((pick) =>
    golferCountsForCut(pick.tournamentGolfer),
  );
  const madeCutCount = madeCutPicks.length;

  if (madeCutCount < 3) {
    return { madeCutCount, status: "eliminated" as EntryStatus, countingPickIds: [] };
  }

  if (madeCutCount === 3) {
    return {
      madeCutCount,
      status: "qualified" as EntryStatus,
      countingPickIds: madeCutPicks.map((pick) => pick.id),
    };
  }

  const dropped = madeCutPicks.find((pick) => pick.isDropped);
  if (!dropped) {
    return {
      madeCutCount,
      status: "drop_required" as EntryStatus,
      countingPickIds: [],
    };
  }

  return {
    madeCutCount,
    status: "qualified" as EntryStatus,
    countingPickIds: madeCutPicks
      .filter((pick) => pick.id !== dropped.id)
      .map((pick) => pick.id),
  };
}

export function calculateDropRequirement(picks: EntryWithDetails["picks"]) {
  const cutStatus = calculateCutStatus(picks);
  return {
    required: cutStatus.madeCutCount === 4 && cutStatus.status === "drop_required",
    madeCutCount: cutStatus.madeCutCount,
  };
}

export function calculateLiveEntryScore(
  entry: EntryWithDetails,
  tournament: Pick<Tournament, "status">,
) {
  const hasCutHappened = [
    "drop_open",
    "round_3",
    "round_4",
    "final",
  ].includes(tournament.status);
  const picksToCount = hasCutHappened
    ? entry.picks.filter((pick) => pick.isCounting && !pick.isDropped)
    : entry.picks;

  if (hasCutHappened && entry.status === "eliminated") return null;
  if (hasCutHappened && entry.status === "drop_required") return null;

  return sumScores(picksToCount);
}

export function calculateFinalEntryScore(entry: EntryWithDetails) {
  if (entry.status === "eliminated" || entry.status === "drop_required") return null;
  return sumScores(entry.picks.filter((pick) => pick.isCounting && !pick.isDropped));
}

export function calculateGroupLeaderboard(
  entries: EntryWithDetails[],
  tournament: Pick<Tournament, "status">,
): LeaderboardRow[] {
  const rows = entries.map((entry) => {
    const score =
      tournament.status === "final"
        ? calculateFinalEntryScore(entry)
        : calculateLiveEntryScore(entry, tournament);
    const cutStatus = calculateCutStatus(entry.picks);

    return {
      rank: 0,
      entry,
      score,
      status: entry.status,
      madeCutCount: cutStatus.madeCutCount,
      needsDrop: entry.status === "drop_required",
    };
  });

  rows.sort((a, b) => {
    if (a.status === "eliminated" && b.status !== "eliminated") return 1;
    if (b.status === "eliminated" && a.status !== "eliminated") return -1;
    if (a.score === null && b.score !== null) return 1;
    if (b.score === null && a.score !== null) return -1;
    if (a.score !== null && b.score !== null && a.score !== b.score) {
      return a.score - b.score;
    }
    return a.entry.user.name.localeCompare(b.entry.user.name);
  });

  let lastScore: number | null = null;
  let lastRank = 0;
  return rows.map((row, index) => {
    if (row.score !== lastScore) {
      lastRank = index + 1;
      lastScore = row.score;
    }
    return { ...row, rank: row.score === null ? index + 1 : lastRank };
  });
}

function sumScores(picks: EntryWithDetails["picks"]) {
  return picks.reduce((total, pick) => total + (pick.tournamentGolfer.totalScore ?? 0), 0);
}
