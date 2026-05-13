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
  Entry,
  EntryPick,
  EntryWithDetails,
  Golfer,
  GolferRoundScore,
  GolferStatus,
  LeaderboardPlayer,
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
};

const globalForStore = globalThis as typeof globalThis & { golfStore?: Store };

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
  return globalForStore.golfStore;
}

export function getCurrentUser(userId?: string | null) {
  const store = getStore();
  return store.users.find((user) => user.id === userId) ?? store.users[0];
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

function createSeedStore(): Store {
  const timestamp = nowIso();
  const users = [
    ["u_admin", "Stan", "admin"],
    ["u_bob", "Bob", "player"],
    ["u_paul", "Paul", "player"],
    ["u_dave", "Dave", "player"],
    ["u_john", "John", "player"],
    ["u_mick", "Mick", "player"],
    ["u_alan", "Alan", "player"],
    ["u_steve", "Steve", "player"],
  ].map(
    ([idValue, name, role]) =>
      ({
        id: idValue,
        name,
        email: `${name.toLowerCase()}@majorpicks.local`,
        role,
        createdAt: timestamp,
      }) as User,
  );

  const tournaments: Tournament[] = [
    {
      id: "t_us_open_2026",
      name: "U.S. Open",
      majorKey: "us_open" as MajorKey,
      year: 2026,
      venue: "Shinnecock Hills",
      startDate: "2026-06-18T12:00:00.000Z",
      endDate: "2026-06-21T23:00:00.000Z",
      pickDeadline: "2026-06-18T11:00:00.000Z",
      dropDeadline: "2026-06-20T16:00:00.000Z",
      status: "picks_open",
      providerTournamentId: "us-open-2026",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  const golferRows = [
    ["g01", "Scottie Scheffler", "USA", 55, "1", -6, -2, true, "active"],
    ["g02", "Rory McIlroy", "NIR", 48, "T2", -4, -1, true, "active"],
    ["g03", "Xander Schauffele", "USA", 45, "T2", -4, 0, true, "active"],
    ["g04", "Collin Morikawa", "USA", 39, "4", -3, -1, true, "active"],
    ["g05", "Viktor Hovland", "NOR", 36, "T5", -2, 1, true, "active"],
    ["g06", "Ludvig Aberg", "SWE", 34, "T5", -2, -2, true, "active"],
    ["g07", "Jon Rahm", "ESP", 32, "T8", -1, 0, true, "active"],
    ["g08", "Tommy Fleetwood", "ENG", 29, "T8", -1, -1, true, "active"],
    ["g09", "Jordan Spieth", "USA", 26, "T12", 1, 2, true, "active"],
    ["g10", "Patrick Cantlay", "USA", 24, "T12", 1, 0, true, "active"],
    ["g11", "Hideki Matsuyama", "JPN", 22, "T18", 2, 1, true, "active"],
    ["g12", "Matt Fitzpatrick", "ENG", 20, "T18", 2, -1, true, "active"],
    ["g13", "Max Homa", "USA", 18, "T25", 3, 1, true, "active"],
    ["g14", "Sahith Theegala", "USA", 16, "T25", 3, 0, true, "active"],
    ["g15", "Shane Lowry", "IRL", 15, "T31", 4, 2, true, "active"],
    ["g16", "Tony Finau", "USA", 14, "T31", 4, 0, true, "active"],
    ["g17", "Justin Rose", "ENG", 12, "CUT", 7, 3, false, "cut"],
    ["g18", "Rickie Fowler", "USA", 11, "CUT", 8, 4, false, "cut"],
    ["g19", "Adam Scott", "AUS", 10, "CUT", 8, 2, false, "cut"],
    ["g20", "Min Woo Lee", "AUS", 9, "CUT", 9, 3, false, "cut"],
    ["g21", "Brian Harman", "USA", 8, "CUT", 10, 5, false, "cut"],
    ["g22", "Sepp Straka", "AUT", 7, "CUT", 11, 2, false, "cut"],
    ["g23", "Cameron Young", "USA", 6, "WD", 5, null, false, "wd"],
    ["g24", "Keegan Bradley", "USA", 4, "DQ", null, null, false, "dq"],
    ["g25", "Lucas Glover", "USA", 1, "T40", 5, 1, true, "active"],
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
    ([golferId, , , points, position, total, today, madeCut, status]) => ({
      id: `tg_${golferId}`,
      tournamentId: "t_us_open_2026",
      golferId,
      pointValue: points,
      position,
      totalScore: total,
      todayScore: today,
      round: 2,
      thru: "F",
      madeCut,
      status: status as GolferStatus,
      lastSyncedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
  );

  const golferRoundScores: GolferRoundScore[] = tournamentGolfers.flatMap((golfer, index) => {
    const total = golfer.totalScore;
    const today = golfer.todayScore;
    const roundOne =
      total === null || today === null
        ? null
        : total - today;
    const roundTwo = today;
    const status = golfer.status;

    return [1, 2, 3, 4].map((roundNumber) => {
      const scoreToPar =
        roundNumber === 1 ? roundOne : roundNumber === 2 ? roundTwo : null;
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

  const entries: Entry[] = [];
  const entryPicks: EntryPick[] = [];
  const seedEntry = (entryId: string, userId: string, golferIds: string[]) => {
    const selected = golferIds.map((golferId) =>
      tournamentGolfers.find((item) => item.golferId === golferId)!,
    );
    entries.push({
      id: entryId,
      tournamentId: "t_us_open_2026",
      userId,
      status: "submitted",
      totalPoints: selected.reduce((total, item) => total + item.pointValue, 0),
      liveScore: null,
      finalScore: null,
      submittedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    entryPicks.push(
      ...selected.map((item) => ({
        id: `pick_${entryId}_${item.golferId}`,
        entryId,
        tournamentGolferId: item.id,
        pointValueAtPick: item.pointValue,
        isDropped: false,
        isCounting: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    );
  };

  seedEntry("e_bob", "u_bob", ["g02", "g14", "g16", "g25"]);
  seedEntry("e_paul", "u_paul", ["g03", "g13", "g21", "g25"]);
  seedEntry("e_dave", "u_dave", ["g04", "g15", "g22", "g24"]);
  seedEntry("e_john", "u_john", ["g01", "g12", "g20", "g25"]);
  seedEntry("e_mick", "u_mick", ["g07", "g09", "g11", "g23"]);

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
  };
}
