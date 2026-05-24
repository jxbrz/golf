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
  picks: Array<{ pointValueAtPick?: number; pointValue?: number | null }>,
) {
  return picks.reduce(
    (total, pick) => total + (pick.pointValueAtPick ?? pick.pointValue ?? 0),
    0,
  );
}

export function validateEntryPicks(
  picks: Array<{ id: string; pointValueAtPick?: number; pointValue?: number | null }>,
) {
  const uniqueIds = new Set(picks.map((pick) => pick.id));
  const totalPoints = calculateEntryPointTotal(picks);
  const errors: string[] = [];

  if (picks.length !== TEAM_SIZE) errors.push("Pick exactly 4 golfers.");
  if (uniqueIds.size !== picks.length) errors.push("Each golfer can only be picked once.");
  if (picks.some((pick) => (pick.pointValueAtPick ?? pick.pointValue) == null)) {
    errors.push("Every picked golfer must have a sweepstake cost.");
  }
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

  const droppedPick = madeCutPicks.find((pick) => pick.isDropped);
  if (!droppedPick) {
    return { madeCutCount, status: "drop_required" as EntryStatus, countingPickIds: [] };
  }

  return {
    madeCutCount,
    status: "qualified" as EntryStatus,
    countingPickIds: madeCutPicks
      .filter((pick) => !pick.isDropped)
      .map((pick) => pick.id),
  };
}

export function calculateDropRequirement(picks: EntryWithDetails["picks"]) {
  const cutStatus = calculateCutStatus(picks);
  return {
    required: cutStatus.status === "drop_required",
    madeCutCount: cutStatus.madeCutCount,
  };
}

export function selectAutomaticDropPick(picks: EntryWithDetails["picks"]) {
  const cutStatus = calculateCutStatus(picks);
  if (cutStatus.status !== "drop_required") return null;

  return [...picks]
    .filter((pick) => golferCountsForCut(pick.tournamentGolfer))
    .sort((a, b) => {
      const aScore = a.tournamentGolfer.totalScore ?? Number.POSITIVE_INFINITY;
      const bScore = b.tournamentGolfer.totalScore ?? Number.POSITIVE_INFINITY;
      if (aScore !== bScore) return bScore - aScore;
      return a.tournamentGolfer.golfer.name.localeCompare(b.tournamentGolfer.golfer.name);
    })[0] ?? null;
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
  const cutStatus = hasCutHappened ? calculateCutStatus(entry.picks) : null;

  if (cutStatus?.status === "eliminated") return null;
  if (cutStatus?.status === "drop_required") return null;

  const picksToCount = hasCutHappened
    ? bestScoredPicks(
        entry.picks.filter((pick) =>
          cutStatus?.countingPickIds.includes(pick.id) ||
          (pick.tournamentGolfer.madeCut === true && !pick.isDropped),
        ),
      )
    : bestScoredPicks(entry.picks);

  return sumScores(picksToCount);
}

export function calculateFinalEntryScore(entry: EntryWithDetails) {
  const cutStatus = calculateCutStatus(entry.picks);
  if (cutStatus.status === "eliminated" || cutStatus.status === "drop_required") return null;
  return sumScores(
    bestScoredPicks(
      entry.picks.filter((pick) =>
        cutStatus.countingPickIds.includes(pick.id) ||
        (pick.tournamentGolfer.madeCut === true && !pick.isDropped),
      ),
    ),
  );
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
    const effectiveStatus = ["drop_open", "round_3", "round_4", "final"].includes(tournament.status)
      ? cutStatus.status
      : entry.status;

    return {
      rank: 0,
      entry,
      score,
      status: effectiveStatus,
      madeCutCount: cutStatus.madeCutCount,
      needsDrop: effectiveStatus === "drop_required",
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
  if (picks.length < 3) return null;
  return picks.reduce((total, pick) => total + (pick.tournamentGolfer.totalScore ?? 0), 0);
}

function bestScoredPicks(picks: EntryWithDetails["picks"]) {
  return picks
    .filter((pick) => pick.tournamentGolfer.totalScore !== null)
    .sort((a, b) => a.tournamentGolfer.totalScore! - b.tournamentGolfer.totalScore!)
    .slice(0, 3);
}
