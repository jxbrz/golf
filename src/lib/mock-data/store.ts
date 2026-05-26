import Papa from "papaparse";
import fs from "node:fs";
import path from "node:path";
import {
  calculateCutStatus,
  calculateEntryPointTotal,
  calculateFinalEntryScore,
  calculateGroupLeaderboard,
  calculateLiveEntryScore,
  selectAutomaticDropPick,
  validateEntryPicks,
} from "@/lib/scoring/scoring";
import { getGolfDataProvider } from "@/lib/golf-data/providers";
import {
  getOddsProvider,
  normalizeOddsName,
  type OddsPricingPreview,
} from "@/lib/odds/providers";
import {
  createFixtureStoreData,
  loadTournamentFixture,
} from "@/fixtures/tournaments/loader";
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
  ProviderLeaderboard,
  ProviderRoundScorecard,
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
  providerLeaderboardCache: Array<{
    key: string;
    provider: string;
    tournamentId: string;
    leaderboard: ProviderLeaderboard;
    cachedAt: string;
  }>;
  adminOverrides: AdminOverride[];
  adminTeamCorrections: AdminTeamCorrection[];
  credentials: Credential[];
};

const globalForStore = globalThis as typeof globalThis & { golfStore?: Store };
const STORE_PATH = path.join(process.cwd(), ".data", "golf-store.json");
const PGA_FIXTURE_SLUG = "pga-championship-2026";
const pgaFixture = loadTournamentFixture(PGA_FIXTURE_SLUG);
const COURSE_PAR = pgaFixture.expectedResults.coursePar;
const CUT_LINE_AFTER_ROUND_TWO = pgaFixture.expectedResults.cutLineAfterRoundTwo;
const pgaRoundFixtures = pgaFixture.roundScoreFixtures;
const pgaRoundHoleFixtures = pgaFixture.roundHoleFixtures;

export function getStore() {
  if (!globalForStore.golfStore) {
    globalForStore.golfStore = loadPersistedStore() ?? createSeedStore();
    ensureStoreShape(globalForStore.golfStore);
    recalculateTournament(globalForStore.golfStore.tournaments[0].id);
    persistStore(globalForStore.golfStore);
  } else {
    ensureStoreShape(globalForStore.golfStore);
  }
  return globalForStore.golfStore;
}

export function resetInMemoryStoreForTesting() {
  globalForStore.golfStore = createSeedStore();
  return globalForStore.golfStore;
}

function loadPersistedStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return null;
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as Store;
  } catch (error) {
    console.warn("Unable to load persisted golf store. Falling back to seed data.", error);
    return null;
  }
}

function persistStore(store: Store) {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  } catch (error) {
    console.warn("Unable to persist golf store.", error);
  }
}

function ensureStoreShape(store: Store) {
  store.golferRoundScores ??= buildRoundScores(store.tournamentGolfers, nowIso());
  store.credentials ??= defaultCredentials();
  store.adminTeamCorrections ??= [];
  store.providerLeaderboardCache ??= [];
  store.scoreSyncLogs ??= [];
  store.adminOverrides ??= [];
  const legacyAdmin = store.users.find((user) => user.email === "admin@majorpicks.local");
  if (legacyAdmin && legacyAdmin.role === "owner") {
    legacyAdmin.role = "admin";
  }
  if (!store.users.some((user) => user.email === "owner@majorpicks.local")) {
    store.users.unshift({
      id: "u_owner",
      name: "Platform Owner",
      email: "owner@majorpicks.local",
      role: "owner",
      createdAt: nowIso(),
    });
  }
  if (!store.credentials.some((credential) => credential.email === "owner@majorpicks.local")) {
    store.credentials.unshift({
      userId: "u_owner",
      email: "owner@majorpicks.local",
      password: "Owner123!",
    });
  }
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
    .sort((a, b) => (b.pointValue ?? -1) - (a.pointValue ?? -1) || a.golfer.name.localeCompare(b.golfer.name));
}

export function getFieldLeaderboard(tournamentId: string) {
  return getTournamentGolfers(tournamentId).sort((a, b) => {
    const aCut = a.status === "cut" || a.madeCut === false;
    const bCut = b.status === "cut" || b.madeCut === false;
    if (aCut && !bCut) return 1;
    if (bCut && !aCut) return -1;
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

export function getScoreSyncLogs(tournamentId: string) {
  return getStore().scoreSyncLogs.filter((log) => log.tournamentId === tournamentId);
}

export async function getOddsPricingPreview(tournamentId: string): Promise<OddsPricingPreview> {
  const store = getStore();
  const tournament = mustFind(store.tournaments, tournamentId, "Tournament");
  const provider = getOddsProvider();
  const sportKey = provider.sportKeyForMajor(tournament.majorKey);

  try {
    const runners = await provider.getOutrightOdds(tournament);
    const golfers = getTournamentGolfers(tournamentId);
    const rows = runners.slice(0, 55).map((runner, index) => {
      const matchedGolfer = findTournamentGolferByOddsName(golfers, runner.name);
      return {
        rank: index + 1,
        cost: 55 - index,
        runnerName: runner.name,
        averageDecimalOdds: runner.averageDecimalOdds,
        bookmakerCount: runner.bookmakerCount,
        matchedTournamentGolferId: matchedGolfer?.id ?? null,
        matchedGolferName: matchedGolfer?.golfer.name ?? null,
      };
    });

    return {
      provider: process.env.ODDS_DATA_PROVIDER ?? "the-odds-api",
      sportKey,
      rows,
      unmatched: rows.filter((row) => !row.matchedTournamentGolferId),
      matchedCount: rows.filter((row) => row.matchedTournamentGolferId).length,
      generatedAt: nowIso(),
    };
  } catch (error) {
    return {
      provider: process.env.ODDS_DATA_PROVIDER ?? "the-odds-api",
      sportKey,
      rows: [],
      unmatched: [],
      matchedCount: 0,
      generatedAt: nowIso(),
      error: error instanceof Error ? error.message : "Unknown odds import error.",
    };
  }
}

export async function applyOddsPricing(tournamentId: string) {
  const store = getStore();
  const preview = await getOddsPricingPreview(tournamentId);
  if (preview.error) {
    return { ok: false, message: preview.error };
  }

  for (const golfer of store.tournamentGolfers.filter((item) => item.tournamentId === tournamentId)) {
    golfer.pointValue = null;
    golfer.updatedAt = nowIso();
  }

  let updated = 0;
  for (const row of preview.rows) {
    if (!row.matchedTournamentGolferId) continue;
    const golfer = store.tournamentGolfers.find((item) => item.id === row.matchedTournamentGolferId);
    if (!golfer) continue;
    golfer.pointValue = row.cost;
    golfer.updatedAt = nowIso();
    updated += 1;
  }

  persistStore(store);
  return {
    ok: true,
    message: `Applied odds pricing to ${updated} golfers. ${preview.unmatched.length} top-55 odds runners were unmatched.`,
  };
}

export function getLowestRoundSummary(tournamentId: string): LowestRoundSummary {
  const store = getStore();
  const golferLookup = getTournamentGolfers(tournamentId);
  const pickedGolferIds = new Set(
    store.entryPicks
      .filter((pick) =>
        store.entries.some((entry) => entry.id === pick.entryId && entry.tournamentId === tournamentId),
      )
      .map((pick) => pick.tournamentGolferId),
  );
  const rounds = store.golferRoundScores
    .filter((round) => round.scoreToPar !== null)
    .filter((round) => pickedGolferIds.has(round.tournamentGolferId))
    .filter((round) =>
      golferLookup.some((tournamentGolfer) => tournamentGolfer.id === round.tournamentGolferId),
    );

  if (rounds.length === 0) {
    return { scoreToPar: null, roundNumber: null, golfers: [], pickedBy: [], countback: null };
  }

  const sortedRounds = [...rounds].sort((a, b) => {
    if (a.scoreToPar !== b.scoreToPar) return a.scoreToPar! - b.scoreToPar!;
    const countback = compareCountback(a.holeScores, b.holeScores);
    if (countback !== 0) return countback;
    return golferNameForRound(golferLookup, a).localeCompare(golferNameForRound(golferLookup, b));
  });
  const bestRound = sortedRounds[0];
  const bestScore = bestRound.scoreToPar!;
  const bestRounds = sortedRounds.filter(
    (round) => round.scoreToPar === bestScore && compareCountback(round.holeScores, bestRound.holeScores) === 0,
  );
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
    roundNumber: bestRound.roundNumber ?? null,
    golfers,
    pickedBy: store.users.filter((user) => pickedUserIds.has(user.id)),
    countback: bestRounds.length === 1 ? countbackWinnerLabel(rounds, bestRound) : null,
  };
}

export function submitEntry(tournamentId: string, userId: string, tournamentGolferIds: string[]) {
  const store = getStore();
  const tournament = mustFind(store.tournaments, tournamentId, "Tournament");
  const existing = store.entries.find(
    (entry) => entry.tournamentId === tournamentId && entry.userId === userId,
  );

  if (!canSubmitPicks(tournament)) {
    return { ok: false, message: "Picks are closed for this tournament." };
  }

  const golfers = tournamentGolferIds.map((id) =>
    mustFind(store.tournamentGolfers, id, "Tournament golfer"),
  );
  if (golfers.some((golfer) => golfer.pointValue === null)) {
    return { ok: false, message: "Every picked golfer must have a sweepstake cost." };
  }
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
      pointValueAtPick: golfer.pointValue!,
      isDropped: false,
      isCounting: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
  );
  recalculateTournament(tournamentId);
  persistStore(store);
  return { ok: true, message: existing ? "Team updated." : "Team submitted." };
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
  if (golfers.some((golfer) => golfer.pointValue === null)) {
    return { ok: false, message: "Every picked golfer must have a sweepstake cost." };
  }
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
      pointValueAtPick: golfer.pointValue!,
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
  persistStore(store);
  return { ok: true, message: "Entry picks updated." };
}

export function dropPlayer(entryId: string, pickId: string) {
  const store = getStore();
  const entry = mustFind(store.entries, entryId, "Entry");
  const tournament = mustFind(store.tournaments, entry.tournamentId, "Tournament");

  if (!["drop_open", "round_3", "round_4"].includes(tournament.status)) {
    return { ok: false, message: "The drop window is not open." };
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
  persistStore(store);
  return { ok: true, message: "Player dropped. Your remaining 3 now count." };
}

export function updateTournamentStatus(tournamentId: string, status: TournamentStatus) {
  const store = getStore();
  const tournament = mustFind(store.tournaments, tournamentId, "Tournament");
  if (["round_3", "round_4", "final"].includes(status)) {
    autoDropOutstandingEntries(tournamentId);
  }
  tournament.status = status;
  tournament.updatedAt = nowIso();
  recalculateTournament(tournamentId);
  persistStore(store);
}

export function resetTournamentToNoPicks(tournamentId: string) {
  const store = getStore();
  const timestamp = nowIso();
  const tournament = mustFind(store.tournaments, tournamentId, "Tournament");
  const tournamentGolferIds = new Set(
    store.tournamentGolfers
      .filter((golfer) => golfer.tournamentId === tournamentId)
      .map((golfer) => golfer.id),
  );
  const entryIds = new Set(
    store.entries.filter((entry) => entry.tournamentId === tournamentId).map((entry) => entry.id),
  );

  tournament.status = "picks_open";
  tournament.updatedAt = timestamp;
  store.entries = store.entries.filter((entry) => entry.tournamentId !== tournamentId);
  store.entryPicks = store.entryPicks.filter((pick) => !entryIds.has(pick.entryId));
  store.adminTeamCorrections = store.adminTeamCorrections.filter(
    (correction) => !entryIds.has(correction.entryId),
  );
  store.adminOverrides = store.adminOverrides.filter(
    (override) => !tournamentGolferIds.has(override.tournamentGolferId),
  );
  store.scoreSyncLogs = store.scoreSyncLogs.filter((log) => log.tournamentId !== tournamentId);

  for (const golfer of store.tournamentGolfers.filter((item) => item.tournamentId === tournamentId)) {
    golfer.position = null;
    golfer.totalScore = null;
    golfer.todayScore = null;
    golfer.round = null;
    golfer.thru = null;
    golfer.madeCut = null;
    golfer.status = "active";
    golfer.lastSyncedAt = null;
    golfer.updatedAt = timestamp;
  }

  store.golferRoundScores = buildRoundScores(store.tournamentGolfers, timestamp);
  recalculateTournament(tournamentId);
  persistStore(store);
}

export function processCut(tournamentId: string) {
  applyMockCutResults(tournamentId);
  const store = getStore();
  const tournament = mustFind(store.tournaments, tournamentId, "Tournament");
  tournament.status = "drop_open";
  tournament.updatedAt = nowIso();
  recalculateTournament(tournamentId, true);
  persistStore(store);
}

export function processCutFromSyncedScores(tournamentId: string) {
  const store = getStore();
  const tournament = mustFind(store.tournaments, tournamentId, "Tournament");
  const cutScore = latestCutScore(store, tournamentId);
  const timestamp = nowIso();

  for (const golfer of store.tournamentGolfers.filter((item) => item.tournamentId === tournamentId)) {
    if (golfer.status === "wd" || golfer.status === "dq") {
      golfer.madeCut = false;
    } else if (golfer.status === "cut" || golfer.position === "CUT") {
      golfer.status = "cut";
      golfer.madeCut = false;
    } else if (golfer.totalScore !== null && cutScore !== null) {
      golfer.madeCut = golfer.totalScore <= cutScore;
      if (!golfer.madeCut) {
        golfer.status = "cut";
      }
    } else {
      golfer.madeCut = golfer.totalScore !== null;
    }
    golfer.updatedAt = timestamp;
  }

  tournament.status = "drop_open";
  tournament.updatedAt = timestamp;
  recalculateTournament(tournamentId, true);
  persistStore(store);
}

export function finaliseTournament(tournamentId: string) {
  const store = getStore();
  const tournament = mustFind(store.tournaments, tournamentId, "Tournament");
  autoDropOutstandingEntries(tournamentId);
  tournament.status = "final";
  tournament.updatedAt = nowIso();
  recalculateTournament(tournamentId, true);
  persistStore(store);
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
  persistStore(store);
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

  persistStore(store);
  return { ok: true, message: `Imported ${imported} golfers.` };
}

export function importScoresFromCsv(tournamentId: string, csv: string) {
  const store = getStore();
  mustFind(store.tournaments, tournamentId, "Tournament");
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (parsed.errors.length) {
    return { ok: false, message: parsed.errors[0].message };
  }

  let imported = 0;
  const timestamp = nowIso();
  for (const row of parsed.data) {
    const name = row.name?.trim() || row.player?.trim() || row.golfer?.trim();
    if (!name) continue;

    const providerPlayerId =
      row.providerplayerid?.trim() ||
      row.playerid?.trim() ||
      `manual-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const status = parseGolferStatus(row.status);
    const round = parseRoundNumber(row.round);
    const todayScore = parseNullableScore(row.today ?? row.todayscore ?? row.roundscore);
    const totalScore = parseNullableScore(row.total ?? row.totalscore ?? row.score);
    const thru = normalizeManualThru(row.thru ?? row.holesthru ?? row.holesthrough, todayScore);

    const golfer = findOrCreateGolferForManualRow(store, providerPlayerId, name, row.country?.trim() || null);
    const tournamentGolfer = findOrCreateTournamentGolferForManualRow(store, tournamentId, golfer);

    tournamentGolfer.position = row.position?.trim() || row.pos?.trim() || tournamentGolfer.position;
    tournamentGolfer.totalScore = totalScore;
    tournamentGolfer.todayScore = todayScore;
    tournamentGolfer.round = round;
    tournamentGolfer.thru = thru;
    tournamentGolfer.status = status;
    tournamentGolfer.madeCut = parseMadeCut(row.madecut ?? row.cut, status, tournamentGolfer.position);
    tournamentGolfer.lastSyncedAt = timestamp;
    tournamentGolfer.updatedAt = timestamp;

    for (const roundNumber of [1, 2, 3, 4] as const) {
      const roundScore = parseNullableScore(
        row[`r${roundNumber}`] ??
          row[`round${roundNumber}`] ??
          row[`round_${roundNumber}`],
      );
      if (roundScore === null && roundNumber !== round) continue;
      upsertProviderRoundScores(store, tournamentGolfer, [
        {
          roundNumber,
          scoreToPar: roundNumber === round && roundScore === null ? todayScore : roundScore,
          strokes: parseNullableNumber(row[`r${roundNumber}strokes`] ?? row[`round${roundNumber}strokes`]),
          thru: roundNumber === round ? thru : roundScore !== null ? "18" : null,
          status,
        },
      ]);
    }

    if (!store.golferRoundScores.some((score) => score.tournamentGolferId === tournamentGolfer.id)) {
      upsertLatestRoundScore(store, tournamentGolfer);
    }
    imported += 1;
  }

  store.scoreSyncLogs.unshift({
    id: id("sync"),
    tournamentId,
    provider: "manual-csv",
    success: true,
    message: `Imported manual scores for ${imported} golfers. No API calls used.`,
    syncedAt: timestamp,
  });
  recalculateTournament(tournamentId, true);
  persistStore(store);
  return { ok: true, message: `Imported scores for ${imported} golfers.` };
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
  persistStore(store);
}

export async function syncProviderLeaderboard(
  tournamentId: string,
  provider = scoreSyncProvider(),
  options?: { roundId?: string; applyCut?: boolean; force?: boolean },
) {
  const store = getStore();
  const tournament = mustFind(store.tournaments, tournamentId, "Tournament");
  const timestamp = nowIso();

  if (tournament.status === "final") {
    const message = "Tournament is final; score sync skipped.";
    store.scoreSyncLogs.unshift({
      id: id("sync"),
      tournamentId,
      provider,
      success: true,
      message,
      syncedAt: timestamp,
    });
    persistStore(store);
    return { ok: true, message };
  }

  if (provider === "mock" || provider === "manual") {
    syncMockLeaderboard(tournamentId, provider);
    return { ok: true, message: "Mock scores synced." };
  }

  try {
    const dataProvider = getGolfDataProvider(provider);
    const cacheKey = providerCacheKey(tournamentId, provider, options?.roundId);
    const cached = !options?.force ? store.providerLeaderboardCache.find((item) => item.key === cacheKey) : null;
    const leaderboard =
      cached?.leaderboard ?? (await dataProvider.getTournamentLeaderboard(tournament, options));
    if (!cached) {
      store.providerLeaderboardCache = [
        {
          key: cacheKey,
          provider,
          tournamentId,
          leaderboard,
          cachedAt: timestamp,
        },
        ...store.providerLeaderboardCache.filter((item) => item.key !== cacheKey),
      ].slice(0, 20);
    }
    const rows = leaderboard.players;
    let matched = 0;
    let scorecards = 0;
    const pickedProviderPlayerIds = pickedProviderIdsForTournament(store, tournamentId);
    const scorecardSyncEnabled = process.env.SCORECARD_SYNC_ENABLED === "true";

    for (const row of rows) {
      const golfer = findOrCreateTournamentGolferForProviderRow(store, tournamentId, row);

      golfer.position = row.position;
      golfer.totalScore = row.totalScore;
      golfer.todayScore = row.todayScore;
      golfer.round = row.round;
      golfer.thru = row.thru;
      golfer.status = row.status;
      golfer.madeCut = resolveSyncedMadeCut(row, golfer, leaderboard.cutScore, options?.applyCut);
      golfer.lastSyncedAt = timestamp;
      golfer.updatedAt = timestamp;
      if (row.rounds?.length) {
        upsertProviderRoundScores(store, golfer, row.rounds);
      } else {
        upsertLatestRoundScore(store, golfer);
      }
      if (
        options?.roundId &&
        scorecardSyncEnabled &&
        dataProvider.getPlayerRoundScorecard &&
        pickedProviderPlayerIds.has(row.providerPlayerId)
      ) {
        const scorecard = await dataProvider.getPlayerRoundScorecard(
          tournament,
          row.providerPlayerId,
          options.roundId,
        );
        if (scorecard) {
          upsertProviderRoundScores(store, golfer, [{ ...scorecard, status: row.status }]);
          scorecards += 1;
        }
      }
      matched += 1;
    }

    store.scoreSyncLogs.unshift({
      id: id("sync"),
      tournamentId,
      provider,
      success: true,
      message: [
        `Synced ${matched} of ${rows.length} provider rows.`,
        cached ? "Used cached provider response." : "Fetched fresh provider response.",
        options?.roundId && !scorecardSyncEnabled ? "Scorecard API calls skipped." : null,
        scorecards ? `${scorecards} picked-player scorecards.` : null,
        leaderboard.roundId ? `Round ${leaderboard.roundId}.` : null,
        leaderboard.cutScore !== null ? `Cut score: ${formatProviderScore(leaderboard.cutScore)}.` : null,
      ].filter(Boolean).join(" "),
      syncedAt: timestamp,
    });
    recalculateTournament(
      tournamentId,
      options?.applyCut ?? ["drop_open", "round_3", "round_4", "final"].includes(tournament.status),
    );
    persistStore(store);
    return {
      ok: true,
      message: `${cached ? "Used cached scores" : "Synced scores"} for ${matched} of ${rows.length} provider rows.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown provider sync error.";
    store.scoreSyncLogs.unshift({
      id: id("sync"),
      tournamentId,
      provider,
      success: false,
      message,
      syncedAt: timestamp,
    });
    persistStore(store);
    return { ok: false, message };
  }
}

function upsertProviderRoundScores(
  store: Store,
  golfer: TournamentGolfer,
  rounds: Array<NonNullable<LeaderboardPlayer["rounds"]>[number] | (ProviderRoundScorecard & { status: GolferStatus })>,
) {
  for (const round of rounds) {
    let score = store.golferRoundScores.find(
      (item) => item.tournamentGolferId === golfer.id && item.roundNumber === round.roundNumber,
    );
    if (!score) {
      score = {
        id: id("round"),
        tournamentGolferId: golfer.id,
        roundNumber: round.roundNumber,
        scoreToPar: round.scoreToPar,
        strokes: round.strokes,
        thru: round.thru,
        holeScores: "holeScores" in round ? round.holeScores : null,
        status: round.status,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      store.golferRoundScores.push(score);
      continue;
    }

    score.scoreToPar = round.scoreToPar;
    score.strokes = round.strokes;
    score.thru = round.thru;
    if ("holeScores" in round) {
      score.holeScores = round.holeScores;
    }
    score.status = round.status;
    score.updatedAt = nowIso();
  }
}

function pickedProviderIdsForTournament(store: Store, tournamentId: string) {
  const pickedTournamentGolferIds = new Set(
    store.entryPicks
      .filter((pick) =>
        store.entries.some((entry) => entry.id === pick.entryId && entry.tournamentId === tournamentId),
      )
      .map((pick) => pick.tournamentGolferId),
  );
  const pickedGolferIds = new Set(
    store.tournamentGolfers
      .filter((golfer) => pickedTournamentGolferIds.has(golfer.id))
      .map((golfer) => golfer.golferId),
  );
  return new Set(
    store.golfers
      .filter((golfer) => pickedGolferIds.has(golfer.id))
      .map((golfer) => golfer.providerPlayerId),
  );
}

function resolveSyncedMadeCut(
  row: LeaderboardPlayer,
  existing: TournamentGolfer,
  cutScore: number | null,
  applyCut = false,
) {
  if (row.madeCut !== null) return row.madeCut;
  if (row.status === "wd" || row.status === "dq" || row.status === "cut" || row.position === "CUT") {
    return false;
  }
  if (applyCut && row.totalScore !== null && cutScore !== null) {
    return row.totalScore <= cutScore;
  }
  if (applyCut && existing.madeCut !== null) {
    return existing.madeCut;
  }
  return null;
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
    autoDropOutstandingEntries(tournamentId);
    applyMockRoundScores(tournamentId, 4);
    finaliseTournament(tournamentId);
    return;
  }

  if (step === "round_3") {
    autoDropOutstandingEntries(tournamentId);
  }
  applyMockRoundScores(tournamentId, step === "round_1" ? 1 : step === "round_2" ? 2 : step === "round_3" ? 3 : 4);
  updateTournamentStatus(tournamentId, step);
  recalculateTournament(tournamentId, step === "round_3" || step === "round_4");
  persistStore(getStore());
}

export async function advanceWeekendStepFromProvider(
  tournamentId: string,
  step: Parameters<typeof advanceWeekendStep>[1],
  provider = scoreSyncProvider(),
) {
  if (provider === "mock" || provider === "manual") {
    advanceWeekendStep(tournamentId, step);
    return;
  }

  if (step === "lock_picks") {
    updateTournamentStatus(tournamentId, "picks_locked");
    return;
  }

  if (step === "process_cut") {
    processCutFromSyncedScores(tournamentId);
    return;
  }

  if (step === "final") {
    autoDropOutstandingEntries(tournamentId);
    await syncProviderLeaderboard(tournamentId, provider, { roundId: "4", applyCut: true });
    finaliseTournament(tournamentId);
    return;
  }

  if (step === "round_3") {
    autoDropOutstandingEntries(tournamentId);
  }
  const roundId = step === "round_1" ? "1" : step === "round_2" ? "2" : step === "round_3" ? "3" : "4";
  await syncProviderLeaderboard(tournamentId, provider, {
    roundId,
    applyCut: step === "round_3" || step === "round_4",
  });
  updateTournamentStatus(tournamentId, step);
  recalculateTournament(tournamentId, step === "round_3" || step === "round_4");
  persistStore(getStore());
}

function autoDropOutstandingEntries(tournamentId: string) {
  const store = getStore();
  const timestamp = nowIso();
  let changed = false;

  for (const entry of store.entries.filter((item) => item.tournamentId === tournamentId)) {
    const detailed = getEntriesWithDetails(tournamentId).find((item) => item.id === entry.id);
    if (!detailed) continue;

    const pickToDrop = selectAutomaticDropPick(detailed.picks);
    if (!pickToDrop) continue;

    for (const pick of store.entryPicks.filter((item) => item.entryId === entry.id)) {
      const detailedPick = detailed.picks.find((item) => item.id === pick.id);
      pick.isDropped = pick.id === pickToDrop.id;
      pick.isCounting = Boolean(detailedPick && detailedPick.tournamentGolfer.madeCut === true && pick.id !== pickToDrop.id);
      pick.updatedAt = timestamp;
    }
    entry.status = "qualified";
    entry.updatedAt = timestamp;
    changed = true;
  }

  if (changed) {
    recalculateTournament(tournamentId, true);
    persistStore(store);
  }
}

function applyMockRoundScores(tournamentId: string, roundNumber: 1 | 2 | 3 | 4) {
  const store = getStore();
  const timestamp = nowIso();
  const golfers = store.tournamentGolfers.filter((item) => item.tournamentId === tournamentId);

  for (const golfer of golfers) {
    const rounds = pgaRoundFixtures.get(golfer.golferId);
    if (!rounds) {
      markMissingFixtureGolfer(store, golfer, timestamp);
      continue;
    }

    const roundScore = scoreToPar(rounds[roundNumber - 1]);
    const cumulative = rounds
      .slice(0, roundNumber)
      .reduce((total, strokes) => total + scoreToPar(strokes), 0);
    const madeCut = rounds
      .slice(0, 2)
      .reduce((total, strokes) => total + scoreToPar(strokes), 0) <= CUT_LINE_AFTER_ROUND_TWO;
    const missedCut = roundNumber >= 3 && !madeCut;

    if (roundNumber === 1) {
      golfer.totalScore = cumulative;
      golfer.todayScore = roundScore;
      golfer.round = 1;
      golfer.thru = "18";
      golfer.madeCut = null;
      golfer.status = "active";
    } else if (roundNumber === 2) {
      golfer.todayScore = roundScore;
      golfer.totalScore = cumulative;
      golfer.round = 2;
      golfer.thru = "18";
      golfer.madeCut = null;
      golfer.status = "active";
    } else if (missedCut) {
      golfer.round = 2;
      golfer.thru = "18";
      golfer.status = "cut";
      golfer.madeCut = false;
    } else {
      golfer.totalScore = cumulative;
      golfer.todayScore = roundScore;
      golfer.round = roundNumber;
      golfer.thru = "18";
      golfer.madeCut = true;
      golfer.status = roundNumber === 4 ? "finished" : "active";
    }

    golfer.lastSyncedAt = timestamp;
    golfer.updatedAt = timestamp;
    upsertLatestRoundScore(store, golfer);
  }

  assignMockPositions(golfers, roundNumber >= 3);

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
    const rounds = pgaRoundFixtures.get(golfer.golferId);
    if (!rounds) {
      markMissingFixtureGolfer(store, golfer, timestamp);
      continue;
    }

    const roundTwoTotal = rounds.slice(0, 2).reduce((total, strokes) => total + scoreToPar(strokes), 0);
    const madeCut = roundTwoTotal <= CUT_LINE_AFTER_ROUND_TWO;

    golfer.todayScore = scoreToPar(rounds[1]);
    golfer.totalScore = roundTwoTotal;
    golfer.round = 2;
    golfer.thru = "18";
    golfer.madeCut = madeCut;
    golfer.status = madeCut ? "active" : "cut";
    golfer.lastSyncedAt = timestamp;
    golfer.updatedAt = timestamp;
    upsertLatestRoundScore(store, golfer);
  }

  assignMockPositions(golfers, true);
}

function markMissingFixtureGolfer(store: Store, golfer: TournamentGolfer, timestamp: string) {
  golfer.todayScore = null;
  golfer.totalScore = null;
  golfer.round = null;
  golfer.thru = null;
  golfer.madeCut = false;
  golfer.status = "wd";
  golfer.position = "WD";
  golfer.lastSyncedAt = timestamp;
  golfer.updatedAt = timestamp;
  store.golferRoundScores = store.golferRoundScores.filter(
    (score) => score.tournamentGolferId !== golfer.id,
  );
}

function scoreToPar(strokes: number) {
  return strokes - COURSE_PAR;
}

function assignMockPositions(golfers: TournamentGolfer[], cutFinalized = false) {
  const activeGolfers = golfers
    .filter((golfer) => golfer.totalScore !== null)
    .filter((golfer) => !cutFinalized || golfer.madeCut !== false)
    .sort((a, b) => {
      if (a.totalScore !== b.totalScore) return a.totalScore! - b.totalScore!;
      return (b.pointValue ?? 0) - (a.pointValue ?? 0);
    });

  let lastScore: number | null = null;
  let lastPosition = 0;
  for (const [index, golfer] of activeGolfers.entries()) {
    if (golfer.totalScore !== lastScore) {
      lastScore = golfer.totalScore;
      lastPosition = index + 1;
    }
    const tied = activeGolfers.some(
      (other) => other.id !== golfer.id && other.totalScore === golfer.totalScore,
    );
    golfer.position = tied ? `T${lastPosition}` : String(lastPosition);
  }

  for (const golfer of golfers.filter((item) => item.status === "wd" || item.status === "dq")) {
    golfer.position = golfer.status.toUpperCase();
    golfer.madeCut = false;
  }

  if (cutFinalized) {
    const cutGolfers = golfers.filter(
      (item) =>
        item.status === "cut" ||
        (item.madeCut === false && item.status !== "wd" && item.status !== "dq"),
    );
    for (const golfer of cutGolfers) {
      golfer.position = "CUT";
      golfer.status = "cut";
      golfer.madeCut = false;
    }
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

function findOrCreateTournamentGolferForProviderRow(
  store: Store,
  tournamentId: string,
  row: LeaderboardPlayer,
) {
  const normalizedName = normalizeName(row.name);
  const existing = store.tournamentGolfers.find((item) => {
    if (item.tournamentId !== tournamentId) return false;
    const golfer = store.golfers.find((storeGolfer) => storeGolfer.id === item.golferId);
    if (!golfer) return false;
    return (
      golfer.providerPlayerId === row.providerPlayerId ||
      normalizeName(golfer.name) === normalizedName
    );
  });
  if (existing) {
    const matchedGolfer = store.golfers.find((golfer) => golfer.id === existing.golferId);
    if (matchedGolfer && matchedGolfer.providerPlayerId !== row.providerPlayerId) {
      matchedGolfer.providerPlayerId = row.providerPlayerId;
      matchedGolfer.updatedAt = nowIso();
    }
    return existing;
  }

  let golfer = store.golfers.find((item) => item.providerPlayerId === row.providerPlayerId);
  if (!golfer) {
    golfer = {
      id: id("golfer"),
      providerPlayerId: row.providerPlayerId,
      name: row.name,
      country: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.golfers.push(golfer);
  }

  const tournamentGolfer: TournamentGolfer = {
    id: id("tg"),
    tournamentId,
    golferId: golfer.id,
    pointValue: null,
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
  return tournamentGolfer;
}

function findTournamentGolferByOddsName(
  golfers: Array<TournamentGolfer & { golfer: Golfer }>,
  runnerName: string,
) {
  const normalizedRunner = normalizeOddsName(runnerName);
  return golfers.find((golfer) => {
    const normalizedGolfer = normalizeOddsName(golfer.golfer.name);
    if (normalizedGolfer === normalizedRunner) return true;
    const nameParts = golfer.golfer.name.trim().split(/\s+/);
    if (nameParts.length < 2) return false;
    const first = nameParts[0];
    const last = nameParts[nameParts.length - 1];
    return normalizeOddsName(`${last} ${first}`) === normalizedRunner;
  });
}

function normalizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function formatProviderScore(score: number) {
  if (score === 0) return "E";
  return score > 0 ? `+${score}` : String(score);
}

function providerCacheKey(tournamentId: string, provider: string, roundId?: string) {
  return [provider, tournamentId, roundId ?? "leaderboard"].join(":");
}

function scoreSyncProvider() {
  return process.env.SCORE_SYNC_MODE === "mock" ? "mock" : process.env.GOLF_DATA_PROVIDER ?? "mock";
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
    if (tournament.status === "final" && entry.status === "qualified") {
      entry.status = "final";
    }
  }
}

export function canSubmitPicks(tournament: Tournament) {
  return ["draft", "picks_open"].includes(tournament.status);
}

function parseScoreValue(field: string, value: string) {
  if (field === "madeCut") return value === "true";
  if (field === "totalScore" || field === "todayScore") {
    if (value.trim().toUpperCase() === "E") return 0;
    return value.trim() === "" ? null : Number(value);
  }
  return value.trim() || null;
}

function parseNullableScore(value: unknown) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized || normalized === "-" || normalized === "NULL") return null;
  if (normalized === "E" || normalized === "EVEN") return 0;
  const parsed = Number(normalized.replace("+", ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNullableNumber(value: unknown) {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRoundNumber(value: unknown) {
  const parsed = parseNullableNumber(value);
  return [1, 2, 3, 4].includes(parsed ?? 0) ? parsed : null;
}

function parseGolferStatus(value: unknown): GolferStatus {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized.includes("wd") || normalized.includes("withdraw")) return "wd";
  if (normalized.includes("dq") || normalized.includes("disqual")) return "dq";
  if (normalized.includes("cut")) return "cut";
  if (normalized.includes("finish") || normalized.includes("complete")) return "finished";
  return "active";
}

function parseMadeCut(value: unknown, status: GolferStatus, position?: string | null) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["true", "1", "yes", "made", "made cut"].includes(normalized)) return true;
  if (["false", "0", "no", "cut", "missed", "missed cut"].includes(normalized)) return false;
  if (status === "cut" || status === "wd" || status === "dq" || position === "CUT") return false;
  return null;
}

function normalizeManualThru(value: unknown, todayScore: number | null) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized.startsWith("F")) return "18";
  if (normalized && normalized !== "-") return normalized;
  return todayScore !== null ? "18" : null;
}

function findOrCreateGolferForManualRow(
  store: Store,
  providerPlayerId: string,
  name: string,
  country: string | null,
) {
  const normalized = normalizeName(name);
  let golfer = store.golfers.find(
    (item) => item.providerPlayerId === providerPlayerId || normalizeName(item.name) === normalized,
  );
  if (!golfer) {
    golfer = {
      id: id("golfer"),
      providerPlayerId,
      name,
      country,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.golfers.push(golfer);
  } else {
    golfer.providerPlayerId = providerPlayerId;
    golfer.name = name;
    golfer.country = country ?? golfer.country;
    golfer.updatedAt = nowIso();
  }
  return golfer;
}

function findOrCreateTournamentGolferForManualRow(
  store: Store,
  tournamentId: string,
  golfer: Golfer,
) {
  let tournamentGolfer = store.tournamentGolfers.find(
    (item) => item.tournamentId === tournamentId && item.golferId === golfer.id,
  );
  if (!tournamentGolfer) {
    tournamentGolfer = {
      id: id("tg"),
      tournamentId,
      golferId: golfer.id,
      pointValue: null,
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
  }
  return tournamentGolfer;
}

function upsertLatestRoundScore(store: Store, golfer: TournamentGolfer) {
  const roundNumber = Math.min(Math.max(golfer.round ?? 1, 1), 4) as 1 | 2 | 3 | 4;
  const holeScores = pgaRoundHoleFixtures.get(golfer.golferId)?.[roundNumber] ?? null;
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
      holeScores,
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
  score.holeScores = holeScores;
  score.status = golfer.status;
  score.updatedAt = nowIso();
}

function golferNameForRound(
  golfers: Array<TournamentGolfer & { golfer: Golfer }>,
  round: GolferRoundScore,
) {
  return golfers.find((golfer) => golfer.id === round.tournamentGolferId)?.golfer.name ?? "";
}

function compareCountback(a?: number[] | null, b?: number[] | null) {
  if (!a?.length || !b?.length) return 0;
  for (const holes of [9, 6, 3]) {
    const difference = countbackScore(a, holes) - countbackScore(b, holes);
    if (difference !== 0) return difference;
  }
  return 0;
}

function countbackWinnerLabel(rounds: GolferRoundScore[], winner: GolferRoundScore) {
  const tiedRounds = rounds.filter((round) => round.scoreToPar === winner.scoreToPar);
  if (tiedRounds.length < 2 || !winner.holeScores?.length) return null;

  for (const holes of [9, 6, 3] as const) {
    const winnerScore = countbackScore(winner.holeScores, holes);
    if (
      tiedRounds.every(
        (round) => {
          if (round.id === winner.id) return true;
          if (!round.holeScores?.length) return false;
          return winnerScore < countbackScore(round.holeScores, holes);
        },
      )
    ) {
      return `b${holes}` as const;
    }
  }

  return null;
}

function countbackScore(scores: number[], holes: number) {
  return scores.slice(18 - holes).reduce((total, score) => total + score, 0);
}

function latestCutScore(store: Store, tournamentId: string) {
  const latestLog = store.scoreSyncLogs.find(
    (log) => log.tournamentId === tournamentId && log.success && log.message.includes("Cut score:"),
  );
  if (!latestLog) return null;
  const match = latestLog.message.match(/Cut score:\s*([+-]?\d+|E)/);
  if (!match) return null;
  if (match[1] === "E") return 0;
  return Number(match[1]);
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
        thru: roundNumber <= 2 ? "18" : null,
        holeScores: null,
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
      userId: "u_owner",
      email: "owner@majorpicks.local",
      password: "Owner123!",
    },
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
    ["u_owner", "Platform Owner", "owner", "owner@majorpicks.local"],
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

  const fixtureData = createFixtureStoreData(PGA_FIXTURE_SLUG, timestamp);
  const tournaments: Tournament[] = [fixtureData.tournament];
  const golfers = fixtureData.golfers;
  const tournamentGolfers = fixtureData.tournamentGolfers;
  const golferRoundScores = fixtureData.golferRoundScores;

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
    providerLeaderboardCache: [],
    adminOverrides: [],
    adminTeamCorrections: [],
    credentials,
  };
}
