import "server-only";

import Papa from "papaparse";
import {
  calculateCutStatus,
  calculateEntryPointTotal,
  calculateFinalEntryScore,
  calculateGroupLeaderboard,
  calculateLiveEntryScore,
  validateEntryPicks,
} from "@/lib/scoring/scoring";
import type {
  AdminEntryRow,
  AdminTeamCorrection,
  Entry,
  EntryPick,
  EntryWithDetails,
  Golfer,
  GolferRoundScore,
  GolferStatus,
  LeaderboardPlayer,
  LowestRoundSummary,
  MajorKey,
  Tournament,
  TournamentGolfer,
  TournamentStatus,
  User,
} from "@/lib/types";
import { nowIso } from "@/lib/utils";

type AdminOverride = {
  id: string;
  tournamentGolferId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string;
  createdByUserId: string;
  createdAt: string;
};

type Credential = {
  userId: string;
  email: string;
  password: string;
};

type Store = {
  users: User[];
  tournaments: Tournament[];
  golfers: Golfer[];
  tournamentGolfers: TournamentGolfer[];
  golferRoundScores: GolferRoundScore[];
  entries: Entry[];
  entryPicks: EntryPick[];
  scoreSyncLogs: Array<{
    id: string;
    tournamentId: string;
    provider: string;
    success: boolean;
    message: string;
    syncedAt: string;
  }>;
  adminOverrides: AdminOverride[];
  adminTeamCorrections: AdminTeamCorrection[];
  credentials: Credential[];
};

const globalForStore = globalThis as typeof globalThis & { golfStore?: Store };

const mockCutResults = new Map<string, Partial<TournamentGolfer>>([
  ["g01", { position: "1", totalScore: -6, todayScore: -2, round: 2, thru: "F", madeCut: true }],
  ["g02", { position: "T2", totalScore: -4, todayScore: -1, round: 2, thru: "F", madeCut: true }],
  ["g03", { position: "T4", totalScore: -3, todayScore: 0, round: 2, thru: "F", madeCut: true }],
  ["g04", { position: "T4", totalScore: -3, todayScore: -1, round: 2, thru: "F", madeCut: true }],
  ["g05", { position: "T6", totalScore: -2, todayScore: 1, round: 2, thru: "F", madeCut: true }],
  ["g06", { position: "T6", totalScore: -2, todayScore: -2, round: 2, thru: "F", madeCut: true }],
  ["g07", { position: "T8", totalScore: -1, todayScore: 0, round: 2, thru: "F", madeCut: true }],
  ["g08", { position: "T8", totalScore: -1, todayScore: -1, round: 2, thru: "F", madeCut: true }],
  ["g09", { position: "T10", totalScore: 0, todayScore: 0, round: 2, thru: "F", madeCut: true }],
  ["g10", { position: "T10", totalScore: 0, todayScore: 1, round: 2, thru: "F", madeCut: true }],
  ["g11", { position: "T12", totalScore: 1, todayScore: 0, round: 2, thru: "F", madeCut: true }],
  ["g12", { position: "T12", totalScore: 1, todayScore: -1, round: 2, thru: "F", madeCut: true }],
  ["g13", { position: "T14", totalScore: 2, todayScore: 1, round: 2, thru: "F", madeCut: true }],
  ["g14", { position: "T14", totalScore: 2, todayScore: 0, round: 2, thru: "F", madeCut: true }],
  ["g15", { position: "T16", totalScore: 3, todayScore: 2, round: 2, thru: "F", madeCut: true }],
  ["g16", { position: "T16", totalScore: 3, todayScore: 0, round: 2, thru: "F", madeCut: true }],
  ["g17", { position: "T18", totalScore: 4, todayScore: 3, round: 2, thru: "F", madeCut: true }],
  ["g18", { position: "T18", totalScore: 4, todayScore: 1, round: 2, thru: "F", madeCut: true }],
  ["g19", { position: "T20", totalScore: 5, todayScore: 2, round: 2, thru: "F", madeCut: true }],
  ["g20", { position: "T20", totalScore: 5, todayScore: 0, round: 2, thru: "F", madeCut: true }],
  ["g21", { position: "CUT", totalScore: 7, todayScore: 3, round: 2, thru: "F", madeCut: false, status: "cut" }],
  ["g22", { position: "CUT", totalScore: 8, todayScore: 4, round: 2, thru: "F", madeCut: false, status: "cut" }],
  ["g23", { position: "CUT", totalScore: 8, todayScore: 2, round: 2, thru: "F", madeCut: false, status: "cut" }],
  ["g24", { position: "CUT", totalScore: 9, todayScore: 3, round: 2, thru: "F", madeCut: false, status: "cut" }],
  ["g25", { position: "CUT", totalScore: 10, todayScore: 5, round: 2, thru: "F", madeCut: false, status: "cut" }],
  ["g30", { position: "CUT", totalScore: 8, todayScore: 2, round: 2, thru: "F", madeCut: false, status: "cut" }],
  ["g50", { position: "CUT", totalScore: 15, todayScore: 6, round: 2, thru: "F", madeCut: false, status: "cut" }],
  ["g51", { position: "CUT", totalScore: 14, todayScore: 2, round: 2, thru: "F", madeCut: false, status: "cut" }],
  ["g53", { position: "T21", totalScore: 5, todayScore: -1, round: 2, thru: "F", madeCut: true }],
  ["g54", { position: "T21", totalScore: 5, todayScore: 0, round: 2, thru: "F", madeCut: true }],
  ["g55", { position: "T21", totalScore: 5, todayScore: 1, round: 2, thru: "F", madeCut: true }],
]);

export function getStore() {
  if (!globalForStore.golfStore) {
    globalForStore.golfStore = createSeedStore();
    recalculateTournament(globalForStore.golfStore.tournaments[0].id);
  } else if (!globalForStore.golfStore.golferRoundScores) {
    globalForStore.golfStore.golferRoundScores = buildRoundScores(
      globalForStore.golfStore.tournamentGolfers,
      nowIso(),
    );
  }
  if (!globalForStore.golfStore.credentials) {
    globalForStore.golfStore.credentials = defaultCredentials();
  }
  if (!globalForStore.golfStore.adminTeamCorrections) {
    globalForStore.golfStore.adminTeamCorrections = [];
  }
  return globalForStore.golfStore;
}

export function getCurrentUser(userId?: string | null) {
  const store = getStore();
  return store.users.find((user) => user.id === userId) ?? store.users[0];
}

export function getUserById(userId?: string | null) {
  if (!userId) return null;
  return getStore().users.find((user) => user.id === userId) ?? null;
}

export function authenticateUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const credential = getStore().credentials.find(
    (item) => item.email === normalizedEmail && item.password === password,
  );
  if (!credential) return null;
  return getUserById(credential.userId);
}

export function getActiveTournament() {
  return getStore().tournaments[0];
}

export function getTournament(id: string) {
  return getStore().tournaments.find((tournament) => tournament.id === id);
}

export function getTournamentGolfers(tournamentId: string) {
  const store = getStore();
  return store.tournamentGolfers
    .filter((item) => item.tournamentId === tournamentId)
    .map((item) => ({
      ...item,
      golfer: store.golfers.find((golfer) => golfer.id === item.golferId)!,
    }))
    .sort((a, b) => b.pointValue - a.pointValue || a.golfer.name.localeCompare(b.golfer.name));
}

export function getFieldLeaderboard(tournamentId: string) {
  return getTournamentGolfers(tournamentId).sort((a, b) => {
    if (a.totalScore === null && b.totalScore !== null) return 1;
    if (b.totalScore === null && a.totalScore !== null) return -1;
    if (a.totalScore !== null && b.totalScore !== null && a.totalScore !== b.totalScore) {
      return a.totalScore - b.totalScore;
    }
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;
    return a.golfer.name.localeCompare(b.golfer.name);
  });
}

export function getTournamentGolferScorecard(tournamentId: string, tournamentGolferId: string) {
  const store = getStore();
  const tournament = getTournament(tournamentId);
  const tournamentGolfer = store.tournamentGolfers.find(
    (item) => item.id === tournamentGolferId && item.tournamentId === tournamentId,
  );
  if (!tournament || !tournamentGolfer) return null;

  return {
    tournament,
    tournamentGolfer: {
      ...tournamentGolfer,
      golfer: store.golfers.find((golfer) => golfer.id === tournamentGolfer.golferId)!,
    },
    roundScores: store.golferRoundScores
      .filter((score) => score.tournamentGolferId === tournamentGolfer.id)
      .sort((a, b) => a.roundNumber - b.roundNumber),
  };
}

export function getEntry(tournamentId: string, userId: string) {
  return getEntriesWithDetails(tournamentId).find((entry) => entry.userId === userId);
}

export function getEntriesWithDetails(tournamentId: string): EntryWithDetails[] {
  const store = getStore();
  return store.entries
    .filter((entry) => entry.tournamentId === tournamentId)
    .map((entry) => ({
      ...entry,
      user: store.users.find((user) => user.id === entry.userId)!,
      picks: store.entryPicks
        .filter((pick) => pick.entryId === entry.id)
        .map((pick) => {
          const tournamentGolfer = store.tournamentGolfers.find(
            (item) => item.id === pick.tournamentGolferId,
          )!;
          return {
            ...pick,
            tournamentGolfer: {
              ...tournamentGolfer,
              golfer: store.golfers.find((golfer) => golfer.id === tournamentGolfer.golferId)!,
            },
          };
        }),
    }));
}

export function getLeaderboard(tournamentId: string) {
  const tournament = getTournament(tournamentId);
  if (!tournament) return [];
  return calculateGroupLeaderboard(getEntriesWithDetails(tournamentId), tournament);
}

export function getAdminEntryRows(tournamentId: string): AdminEntryRow[] {
  const store = getStore();
  const entries = getEntriesWithDetails(tournamentId);
  return store.users
    .filter((user) => user.role === "player")
    .map((user) => ({
      user,
      entry: entries.find((entry) => entry.userId === user.id) ?? null,
    }));
}

export function getLowestRoundSummary(tournamentId: string): LowestRoundSummary {
  const store = getStore();
  const golferLookup = getTournamentGolfers(tournamentId);
  const rounds = store.golferRoundScores
    .filter((round) => round.scoreToPar !== null)
    .filter((round) =>
      golferLookup.some((tournamentGolfer) => tournamentGolfer.id === round.tournamentGolferId),
    );

  if (rounds.length === 0) {
    return { scoreToPar: null, roundNumber: null, golfers: [], pickedBy: [] };
  }

  const bestScore = Math.min(...rounds.map((round) => round.scoreToPar!));
  const bestRounds = rounds.filter((round) => round.scoreToPar === bestScore);
  const bestGolferIds = new Set(bestRounds.map((round) => round.tournamentGolferId));
  const golfers = golferLookup.filter((golfer) => bestGolferIds.has(golfer.id));
  const pickedUserIds = new Set(
    store.entryPicks
      .filter((pick) => bestGolferIds.has(pick.tournamentGolferId))
      .map((pick) => store.entries.find((entry) => entry.id === pick.entryId)?.userId)
      .filter(Boolean) as string[],
  );

  return {
    scoreToPar: bestScore,
    roundNumber: bestRounds[0]?.roundNumber ?? null,
    golfers,
    pickedBy: store.users.filter((user) => pickedUserIds.has(user.id)),
  };
}

export function submitEntry(tournamentId: string, userId: string, tournamentGolferIds: string[]) {
  const store = getStore();
  const tournament = mustFind(store.tournaments, tournamentId, "Tournament");
  const existing = store.entries.find(
    (entry) => entry.tournamentId === tournamentId && entry.userId === userId,
  );

  if (existing?.submittedAt) {
    return { ok: false, message: "Your team has already been submitted and cannot be changed." };
  }

  if (!canSubmitPicks(tournament)) {
    return { ok: false, message: "Picks are closed for this tournament." };
  }

  const golfers = tournamentGolferIds.map((id) =>
    mustFind(store.tournamentGolfers, id, "Tournament golfer"),
  );
  const validation = validateEntryPicks(
    golfers.map((golfer) => ({ id: golfer.id, pointValue: golfer.pointValue })),
  );

  if (!validation.valid) {
    return { ok: false, message: validation.errors.join(" ") };
  }

  const timestamp = nowIso();
  const entry: Entry =
    existing ??
    ({
      id: id("entry"),
      tournamentId,
      userId,
      status: "submitted",
      totalPoints: validation.totalPoints,
      liveScore: null,
      finalScore: null,
      submittedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    } satisfies Entry);

  Object.assign(entry, {
    status: "submitted",
    totalPoints: validation.totalPoints,
    submittedAt: timestamp,
    updatedAt: timestamp,
  });

  if (!existing) store.entries.push(entry);
  store.entryPicks = store.entryPicks.filter((pick) => pick.entryId !== entry.id);
  store.entryPicks.push(
    ...golfers.map((golfer) => ({
      id: id("pick"),
      entryId: entry.id,
      tournamentGolferId: golfer.id,
      pointValueAtPick: golfer.pointValue,
      isDropped: false,
      isCounting: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
  );
  recalculateTournament(tournamentId);
  return { ok: true, message: "Team submitted. It is now locked." };
}

export function adminUpsertEntryPicks(input: {
  tournamentId: string;
  userId: string;
  tournamentGolferIds: string[];
  adminUserId: string;
  reason: string;
}) {
  const store = getStore();
  const tournament = mustFind(store.tournaments, input.tournamentId, "Tournament");
  mustFind(store.users, input.userId, "User");
  const golfers = input.tournamentGolferIds.map((id) =>
    mustFind(store.tournamentGolfers, id, "Tournament golfer"),
  );
  const validation = validateEntryPicks(
    golfers.map((golfer) => ({ id: golfer.id, pointValue: golfer.pointValue })),
  );

  if (!validation.valid) {
    return { ok: false, message: validation.errors.join(" ") };
  }

  const timestamp = nowIso();
  let entry = store.entries.find(
    (item) => item.tournamentId === input.tournamentId && item.userId === input.userId,
  );
  const oldPickIds = entry
    ? store.entryPicks
        .filter((pick) => pick.entryId === entry!.id)
        .map((pick) => pick.tournamentGolferId)
    : [];

  if (!entry) {
    entry = {
      id: id("entry"),
      tournamentId: input.tournamentId,
      userId: input.userId,
      status: "submitted",
      totalPoints: validation.totalPoints,
      liveScore: null,
      finalScore: null,
      submittedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.entries.push(entry);
  }

  entry.status = "submitted";
  entry.totalPoints = validation.totalPoints;
  entry.submittedAt ??= timestamp;
  entry.updatedAt = timestamp;
  store.entryPicks = store.entryPicks.filter((pick) => pick.entryId !== entry.id);
  store.entryPicks.push(
    ...golfers.map((golfer) => ({
      id: id("pick"),
      entryId: entry!.id,
      tournamentGolferId: golfer.id,
      pointValueAtPick: golfer.pointValue,
      isDropped: false,
      isCounting: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
  );
  store.adminTeamCorrections.push({
    id: id("team_correction"),
    entryId: entry.id,
    oldPickIds: oldPickIds.join(","),
    newPickIds: golfers.map((golfer) => golfer.id).join(","),
    reason: input.reason,
    createdByUserId: input.adminUserId,
    createdAt: timestamp,
  });
  recalculateTournament(tournament.id, ["drop_open", "round_3", "round_4", "final"].includes(tournament.status));
  return { ok: true, message: "Entry picks updated." };
}

export function dropPlayer(entryId: string, pickId: string) {
  const store = getStore();
  const entry = mustFind(store.entries, entryId, "Entry");
  const tournament = mustFind(store.tournaments, entry.tournamentId, "Tournament");

  if (!["drop_open", "round_3", "round_4"].includes(tournament.status)) {
    return { ok: false, message: "The drop window is not open." };
  }

  if (new Date() > new Date(tournament.dropDeadline)) {
    return { ok: false, message: "The drop deadline has passed." };
  }

  const picks = store.entryPicks.filter((pick) => pick.entryId === entryId);
  if (!picks.some((pick) => pick.id === pickId)) {
    return { ok: false, message: "Choose one of your submitted players." };
  }

  for (const pick of picks) {
    pick.isDropped = pick.id === pickId;
    pick.isCounting = pick.id !== pickId;
    pick.updatedAt = nowIso();
  }
  entry.status = "qualified";
  entry.updatedAt = nowIso();
  recalculateTournament(entry.tournamentId);
  return { ok: true, message: "Player dropped. Your remaining 3 now count." };
}

export function updateTournamentStatus(tournamentId: string, status: TournamentStatus) {
  const tournament = mustFind(getStore().tournaments, tournamentId, "Tournament");
  tournament.status = status;
  tournament.updatedAt = nowIso();
  recalculateTournament(tournamentId);
}

export function processCut(tournamentId: string) {
  applyMockCutResults(tournamentId);
  const tournament = mustFind(getStore().tournaments, tournamentId, "Tournament");
  tournament.status = "drop_open";
  tournament.updatedAt = nowIso();
  recalculateTournament(tournamentId, true);
}

export function finaliseTournament(tournamentId: string) {
  const tournament = mustFind(getStore().tournaments, tournamentId, "Tournament");
  tournament.status = "final";
  tournament.updatedAt = nowIso();
  recalculateTournament(tournamentId, true);
}

export function updateGolferScore(input: {
  tournamentGolferId: string;
  field: "position" | "totalScore" | "todayScore" | "thru" | "madeCut" | "status";
  value: string;
  adminUserId: string;
  reason: string;
}) {
  const store = getStore();
  const row = mustFind(store.tournamentGolfers, input.tournamentGolferId, "Golfer");
  const oldValue = String(row[input.field] ?? "");
  const parsed = parseScoreValue(input.field, input.value);
  (row as unknown as Record<string, unknown>)[input.field] = parsed;
  row.updatedAt = nowIso();
  row.lastSyncedAt = nowIso();
  if (["todayScore", "thru", "status"].includes(input.field)) {
    upsertLatestRoundScore(store, row);
  }
  store.adminOverrides.push({
    id: id("override"),
    tournamentGolferId: row.id,
    field: input.field,
    oldValue,
    newValue: String(parsed ?? ""),
    reason: input.reason || "Admin score correction",
    createdByUserId: input.adminUserId,
    createdAt: nowIso(),
  });
  recalculateTournament(row.tournamentId);
}

export function importGolfersFromCsv(tournamentId: string, csv: string) {
  const store = getStore();
  const tournament = mustFind(store.tournaments, tournamentId, "Tournament");
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (parsed.errors.length) {
    return { ok: false, message: parsed.errors[0].message };
  }

  let imported = 0;
  for (const row of parsed.data) {
    const name = row.name?.trim();
    const points = Number(row.points ?? row.pointvalue);
    if (!name || !Number.isFinite(points)) continue;

    const providerPlayerId =
      row.providerplayerid?.trim() ||
      `manual-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    let golfer = store.golfers.find((item) => item.providerPlayerId === providerPlayerId);
    if (!golfer) {
      golfer = {
        id: id("golfer"),
        providerPlayerId,
        name,
        country: row.country?.trim() || null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      store.golfers.push(golfer);
    }

    let tournamentGolfer = store.tournamentGolfers.find(
      (item) => item.tournamentId === tournament.id && item.golferId === golfer.id,
    );
    if (!tournamentGolfer) {
      tournamentGolfer = {
        id: id("tg"),
        tournamentId,
        golferId: golfer.id,
        pointValue: points,
        position: null,
        totalScore: null,
        todayScore: null,
        round: null,
        thru: null,
        madeCut: null,
        status: "active",
        lastSyncedAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      store.tournamentGolfers.push(tournamentGolfer);
    } else {
      tournamentGolfer.pointValue = points;
      tournamentGolfer.updatedAt = nowIso();
    }
    imported += 1;
  }

  return { ok: true, message: `Imported ${imported} golfers.` };
}

export function syncMockLeaderboard(tournamentId: string, provider = "mock") {
  const store = getStore();
  const golfers = store.tournamentGolfers.filter((item) => item.tournamentId === tournamentId);
  golfers.forEach((golfer, index) => {
    golfer.totalScore = (golfer.totalScore ?? 0) + (index % 3 === 0 ? -1 : index % 4 === 0 ? 1 : 0);
    golfer.todayScore = index % 5 === 0 ? -2 : index % 4 === 0 ? 1 : 0;
    upsertLatestRoundScore(store, golfer);
    golfer.lastSyncedAt = nowIso();
  });
  store.scoreSyncLogs.unshift({
    id: id("sync"),
    tournamentId,
    provider,
    success: true,
    message: "Mock scores synced into the database layer.",
    syncedAt: nowIso(),
  });
  recalculateTournament(tournamentId);
}

export function advanceWeekendStep(
  tournamentId: string,
  step: "lock_picks" | "round_1" | "round_2" | "process_cut" | "round_3" | "round_4" | "final",
) {
  if (step === "lock_picks") {
    updateTournamentStatus(tournamentId, "picks_locked");
    return;
  }
  if (step === "process_cut") {
    processCut(tournamentId);
    return;
  }
  if (step === "final") {
    applyMockRoundScores(tournamentId, 4);
    finaliseTournament(tournamentId);
    return;
  }

  applyMockRoundScores(tournamentId, step === "round_1" ? 1 : step === "round_2" ? 2 : step === "round_3" ? 3 : 4);
  updateTournamentStatus(tournamentId, step);
  recalculateTournament(tournamentId, step === "round_3" || step === "round_4");
}

function applyMockRoundScores(tournamentId: string, roundNumber: 1 | 2 | 3 | 4) {
  const store = getStore();
  const timestamp = nowIso();
  const golfers = store.tournamentGolfers.filter((item) => item.tournamentId === tournamentId);

  for (const [index, golfer] of golfers.entries()) {
    const cutResult = mockCutResults.get(golfer.golferId);
    const missedCut = cutResult?.madeCut === false;

    if (roundNumber === 1) {
      const score = (index % 9) - 4;
      golfer.totalScore = score;
      golfer.todayScore = score;
      golfer.round = 1;
      golfer.thru = "F";
      golfer.position = index === 0 ? "1" : `T${Math.min(index + 1, 24)}`;
      golfer.madeCut = null;
      golfer.status = "active";
    } else if (roundNumber === 2) {
      const fallbackTotal = 7 + (golfer.pointValue % 7);
      const fallbackToday = 2 + (golfer.pointValue % 4);
      golfer.totalScore = cutResult?.totalScore ?? fallbackTotal;
      golfer.todayScore = cutResult?.todayScore ?? fallbackToday;
      golfer.round = 2;
      golfer.thru = "F";
      golfer.position = cutResult?.position === "CUT" ? `T${Math.min(index + 1, 68)}` : cutResult?.position ?? `T${Math.min(index + 1, 68)}`;
      golfer.madeCut = null;
      golfer.status = "active";
    } else if (missedCut) {
      golfer.round = 2;
      golfer.thru = "F";
      golfer.status = "cut";
      golfer.madeCut = false;
    } else {
      const roundMove = roundNumber === 3 ? (index % 5) - 2 : (index % 7) - 3;
      golfer.totalScore = (golfer.totalScore ?? cutResult?.totalScore ?? 0) + roundMove;
      golfer.todayScore = roundMove;
      golfer.round = roundNumber;
      golfer.thru = "F";
      golfer.position = index === 0 ? "1" : `T${Math.min(index + 1, 30)}`;
      golfer.madeCut = true;
      golfer.status = roundNumber === 4 ? "finished" : "active";
    }

    golfer.lastSyncedAt = timestamp;
    golfer.updatedAt = timestamp;
    upsertLatestRoundScore(store, golfer);
  }

  store.scoreSyncLogs.unshift({
    id: id("sync"),
    tournamentId,
    provider: "weekend-simulator",
    success: true,
    message: `Advanced mock scores to round ${roundNumber}.`,
    syncedAt: timestamp,
  });
}

function applyMockCutResults(tournamentId: string) {
  const store = getStore();
  const timestamp = nowIso();
  const golfers = store.tournamentGolfers.filter((item) => item.tournamentId === tournamentId);

  for (const golfer of golfers) {
    const fallbackScore = 7 + (golfer.pointValue % 7);
    const fallbackToday = 2 + (golfer.pointValue % 4);
    const result = mockCutResults.get(golfer.golferId) ?? {
      position: "CUT",
      totalScore: fallbackScore,
      todayScore: fallbackToday,
      round: 2,
      thru: "F",
      madeCut: false,
      status: "cut" as GolferStatus,
    };

    golfer.position = result.position ?? null;
    golfer.totalScore = result.totalScore ?? null;
    golfer.todayScore = result.todayScore ?? null;
    golfer.round = result.round ?? null;
    golfer.thru = result.thru ?? null;
    golfer.madeCut = result.madeCut ?? null;
    golfer.status = (result.status as GolferStatus | undefined) ?? "active";
    golfer.lastSyncedAt = timestamp;
    golfer.updatedAt = timestamp;
    upsertLatestRoundScore(store, golfer);
  }
}

export function getProviderLeaderboard(tournamentId: string): LeaderboardPlayer[] {
  return getTournamentGolfers(tournamentId).map((row) => ({
    providerPlayerId: row.golfer.providerPlayerId,
    name: row.golfer.name,
    position: row.position,
    totalScore: row.totalScore,
    todayScore: row.todayScore,
    round: row.round,
    thru: row.thru,
    madeCut: row.madeCut,
    status: row.status,
    lastUpdated: row.lastSyncedAt ?? row.updatedAt,
  }));
}

export function recalculateTournament(tournamentId: string, applyCut = false) {
  const store = getStore();
  const tournament = mustFind(store.tournaments, tournamentId, "Tournament");
  const cutStatuses = ["drop_open", "round_3", "round_4", "final"];

  for (const entry of store.entries.filter((item) => item.tournamentId === tournamentId)) {
    const detailed = getEntriesWithDetails(tournamentId).find((item) => item.id === entry.id);
    if (!detailed) continue;

    if (applyCut || cutStatuses.includes(tournament.status)) {
      const cut = calculateCutStatus(detailed.picks);
      entry.status = cut.status;
      for (const pick of store.entryPicks.filter((item) => item.entryId === entry.id)) {
        pick.isCounting = cut.countingPickIds.includes(pick.id);
        pick.updatedAt = nowIso();
      }
    }

    const refreshed = getEntriesWithDetails(tournamentId).find((item) => item.id === entry.id)!;
    entry.liveScore = calculateLiveEntryScore(refreshed, tournament);
    entry.finalScore =
      tournament.status === "final" ? calculateFinalEntryScore(refreshed) : null;
    entry.totalPoints = calculateEntryPointTotal(refreshed.picks);
    entry.updatedAt = nowIso();
    if (tournament.status === "final" && entry.status !== "eliminated") {
      entry.status = "final";
    }
  }
}

export function canSubmitPicks(tournament: Tournament) {
  return (
    ["draft", "picks_open"].includes(tournament.status) &&
    new Date() <= new Date(tournament.pickDeadline)
  );
}

function parseScoreValue(field: string, value: string) {
  if (field === "madeCut") return value === "true";
  if (field === "totalScore" || field === "todayScore") {
    if (value.trim().toUpperCase() === "E") return 0;
    return value.trim() === "" ? null : Number(value);
  }
  return value.trim() || null;
}

function upsertLatestRoundScore(store: Store, golfer: TournamentGolfer) {
  const roundNumber = Math.min(Math.max(golfer.round ?? 1, 1), 4) as 1 | 2 | 3 | 4;
  let score = store.golferRoundScores.find(
    (item) => item.tournamentGolferId === golfer.id && item.roundNumber === roundNumber,
  );
  if (!score) {
    score = {
      id: id("round"),
      tournamentGolferId: golfer.id,
      roundNumber,
      scoreToPar: golfer.todayScore,
      strokes: golfer.todayScore === null ? null : 70 + golfer.todayScore,
      thru: golfer.thru,
      status: golfer.status,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.golferRoundScores.push(score);
    return;
  }

  score.scoreToPar = golfer.todayScore;
  score.strokes = golfer.todayScore === null ? null : 70 + golfer.todayScore;
  score.thru = golfer.thru;
  score.status = golfer.status;
  score.updatedAt = nowIso();
}

function mustFind<T extends { id: string }>(items: T[], idToFind: string, label: string) {
  const item = items.find(({ id: itemId }) => itemId === idToFind);
  if (!item) throw new Error(`${label} not found.`);
  return item;
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildRoundScores(tournamentGolfers: TournamentGolfer[], timestamp: string) {
  return tournamentGolfers.flatMap((golfer, index) => {
    const total = golfer.totalScore;
    const today = golfer.todayScore;
    const roundOne = total === null || today === null ? null : total - today;
    const roundTwo = today;
    const status = golfer.status;

    return [1, 2, 3, 4].map((roundNumber) => {
      const scoreToPar = roundNumber === 1 ? roundOne : roundNumber === 2 ? roundTwo : null;
      return {
        id: `rs_${golfer.id}_${roundNumber}`,
        tournamentGolferId: golfer.id,
        roundNumber: roundNumber as 1 | 2 | 3 | 4,
        scoreToPar,
        strokes: scoreToPar === null ? null : 70 + scoreToPar + (index % 2),
        thru: roundNumber <= 2 ? "F" : null,
        status:
          roundNumber <= 2
            ? status
            : status === "cut" || status === "wd" || status === "dq"
              ? status
              : "active",
        createdAt: timestamp,
        updatedAt: timestamp,
      } satisfies GolferRoundScore;
    });
  });
}

function defaultCredentials(): Credential[] {
  return [
    {
      userId: "u_admin",
      email: "admin@majorpicks.local",
      password: "Admin123!",
    },
    {
      userId: "u_player1",
      email: "player1@majorpicks.local",
      password: "Player123!",
    },
    {
      userId: "u_player2",
      email: "player2@majorpicks.local",
      password: "Player123!",
    },
  ];
}

function createSeedStore(): Store {
  const timestamp = nowIso();
  const users = [
    ["u_admin", "Admin", "admin", "admin@majorpicks.local"],
    ["u_player1", "Player One", "player", "player1@majorpicks.local"],
    ["u_player2", "Player Two", "player", "player2@majorpicks.local"],
  ].map(
    ([idValue, name, role, email]) =>
      ({
        id: idValue,
        name,
        email,
        role,
        createdAt: timestamp,
      }) as User,
  );
  const credentials = defaultCredentials();

  const tournaments: Tournament[] = [
    {
      id: "t_us_open_2026",
      name: "PGA Championship",
      majorKey: "pga" as MajorKey,
      year: 2026,
      venue: "Mock major venue",
      startDate: "2026-06-18T12:00:00.000Z",
      endDate: "2026-06-21T23:00:00.000Z",
      pickDeadline: "2026-06-18T11:00:00.000Z",
      dropDeadline: "2026-06-20T16:00:00.000Z",
      status: "picks_open",
      providerTournamentId: "pga-2026",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  const golferRows = [
    ["g01", "Scottie Scheffler", "INT", 55],
    ["g02", "Rory McIlroy", "INT", 54],
    ["g03", "Cameron Young", "INT", 53],
    ["g04", "Jon Rahm", "INT", 52],
    ["g05", "Bryson DeChambeau", "INT", 51],
    ["g06", "Xander Schauffele", "INT", 50],
    ["g07", "Ludvig Aberg", "INT", 49],
    ["g08", "Matt Fitzpatrick", "INT", 48],
    ["g09", "Tommy Fleetwood", "INT", 47],
    ["g10", "Justin Thomas", "INT", 46],
    ["g11", "Collin Morikawa", "INT", 45],
    ["g12", "Justin Rose", "INT", 44],
    ["g13", "Brooks Koepka", "INT", 43],
    ["g14", "Chris Gotterup", "INT", 42],
    ["g15", "Hideki Matsuyama", "INT", 41],
    ["g16", "Tyrrell Hatton", "INT", 40],
    ["g17", "Joaquin Niemann", "INT", 39],
    ["g18", "Patrick Cantlay", "INT", 38],
    ["g19", "Ben Griffin", "INT", 37],
    ["g20", "Viktor Hovland", "INT", 36],
    ["g21", "Robert MacIntyre", "INT", 35],
    ["g22", "Russell Henley", "INT", 34],
    ["g23", "Corey Conners", "INT", 33],
    ["g24", "Sam Burns", "INT", 32],
    ["g25", "Sepp Straka", "INT", 31],
    ["g26", "Jordan Spieth", "INT", 30],
    ["g27", "Shane Lowry", "INT", 29],
    ["g28", "Patrick Reed", "INT", 28],
    ["g29", "Cameron Smith", "INT", 27],
    ["g30", "Tony Finau", "INT", 26],
    ["g31", "Daniel Berger", "INT", 25],
    ["g32", "Jason Day", "INT", 24],
    ["g33", "Max Homa", "INT", 23],
    ["g34", "Akshay Bhatia", "INT", 22],
    ["g35", "Sungjae Im", "INT", 21],
    ["g36", "Marco Penge", "INT", 20],
    ["g37", "Adam Scott", "INT", 19],
    ["g38", "Jake Knapp", "INT", 18],
    ["g39", "Si Woo Kim", "INT", 17],
    ["g40", "Minwoo Lee", "INT", 16],
    ["g41", "Maverick McNealy", "INT", 15],
    ["g42", "Gary Woodland", "INT", 14],
    ["g43", "Wyndham Clark", "INT", 13],
    ["g44", "Will Zalatoris", "INT", 12],
    ["g45", "Dustin Johnson", "INT", 11],
    ["g46", "J.J. Spaun", "INT", 10],
    ["g47", "Jacob Bridgeman", "INT", 9],
    ["g48", "Rickie Fowler", "INT", 8],
    ["g49", "Harris English", "INT", 7],
    ["g50", "Brian Harman", "INT", 6],
    ["g51", "Aaron Rai", "INT", 5],
    ["g52", "Denny McCarthy", "INT", 4],
    ["g53", "Ryan Fox", "INT", 3],
    ["g54", "Sahith Theegala", "INT", 2],
    ["g55", "Nicolai Hojgaard", "INT", 1],
  ] as const;

  const golfers: Golfer[] = golferRows.map(([golferId, name, country]) => ({
    id: golferId,
    providerPlayerId: `mock-${golferId}`,
    name,
    country,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  const tournamentGolfers: TournamentGolfer[] = golferRows.map(
    ([golferId, , , points]) => {
      return {
      id: `tg_${golferId}`,
      tournamentId: "t_us_open_2026",
      golferId,
      pointValue: points,
      position: null,
      totalScore: null,
      todayScore: null,
      round: null,
      thru: null,
      madeCut: null,
      status: "active",
      lastSyncedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    },
  );

  const golferRoundScores: GolferRoundScore[] = tournamentGolfers.flatMap((golfer) =>
    [1, 2, 3, 4].map((roundNumber) => ({
      id: `rs_${golfer.id}_${roundNumber}`,
      tournamentGolferId: golfer.id,
      roundNumber: roundNumber as 1 | 2 | 3 | 4,
      scoreToPar: null,
      strokes: null,
      thru: null,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
  );

  const entries: Entry[] = [];
  const entryPicks: EntryPick[] = [];

  return {
    users,
    tournaments,
    golfers,
    tournamentGolfers,
    golferRoundScores,
    entries,
    entryPicks,
    scoreSyncLogs: [],
    adminOverrides: [],
    adminTeamCorrections: [],
    credentials,
  };
}
