import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  adminTeamCorrections,
  entries,
  entryPicks,
  golfers,
  tournamentGolfers,
  tournaments,
  users,
} from "@/db/schema";
import { getStore, getTournament, getTournamentGolfers } from "@/lib/mock-data/store";
import {
  calculateCutStatus,
  calculateGroupLeaderboard,
  validateEntryPicks,
} from "@/lib/scoring/scoring";
import type {
  AdminEntryRow,
  Entry,
  EntryPick,
  EntryWithDetails,
  Golfer,
  GolferRoundScore,
  LowestRoundSummary,
  Tournament,
  TournamentGolfer,
  User,
} from "@/lib/types";

function toIso(value: Date | string | null) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function asUser(row: typeof users.$inferSelect): User {
  return {
    ...row,
    createdAt: toIso(row.createdAt)!,
  };
}

function asTournament(row: typeof tournaments.$inferSelect): Tournament {
  return {
    ...row,
    startDate: toIso(row.startDate)!,
    endDate: toIso(row.endDate)!,
    pickDeadline: toIso(row.pickDeadline)!,
    dropDeadline: toIso(row.dropDeadline)!,
    createdAt: toIso(row.createdAt)!,
    updatedAt: toIso(row.updatedAt)!,
  };
}

function asGolfer(row: typeof golfers.$inferSelect): Golfer {
  return {
    ...row,
    createdAt: toIso(row.createdAt)!,
    updatedAt: toIso(row.updatedAt)!,
  };
}

function asTournamentGolfer(row: typeof tournamentGolfers.$inferSelect): TournamentGolfer {
  return {
    ...row,
    lastSyncedAt: toIso(row.lastSyncedAt),
    createdAt: toIso(row.createdAt)!,
    updatedAt: toIso(row.updatedAt)!,
  };
}

function asEntry(row: typeof entries.$inferSelect): Entry {
  return {
    ...row,
    submittedAt: toIso(row.submittedAt),
    createdAt: toIso(row.createdAt)!,
    updatedAt: toIso(row.updatedAt)!,
  };
}

function asEntryPick(row: typeof entryPicks.$inferSelect): EntryPick {
  return {
    ...row,
    createdAt: toIso(row.createdAt)!,
    updatedAt: toIso(row.updatedAt)!,
  };
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export async function getDbTournament(tournamentId: string) {
  if (!process.env.DATABASE_URL) return null;
  const db = getDb();
  const [row] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
  return row ? asTournament(row) : null;
}

export async function resetDbTournamentEntries(tournamentId: string) {
  if (!process.env.DATABASE_URL) return false;

  const db = getDb();
  const entryRows = await db
    .select({ id: entries.id })
    .from(entries)
    .where(eq(entries.tournamentId, tournamentId));
  const entryIds = entryRows.map((entry) => entry.id);

  if (entryIds.length > 0) {
    await db.delete(adminTeamCorrections).where(inArray(adminTeamCorrections.entryId, entryIds));
    await db.delete(entryPicks).where(inArray(entryPicks.entryId, entryIds));
    await db.delete(entries).where(inArray(entries.id, entryIds));
  }

  await db
    .update(tournaments)
    .set({ status: "picks_open", updatedAt: new Date() })
    .where(eq(tournaments.id, tournamentId));

  return true;
}

export async function getDbEntriesWithDetails(tournamentId: string): Promise<EntryWithDetails[]> {
  if (!process.env.DATABASE_URL) return [];

  try {
    const db = getDb();
    const entryRows = await db
      .select()
      .from(entries)
      .where(eq(entries.tournamentId, tournamentId));

    if (entryRows.length === 0) return [];

    const userRows = await db
      .select()
      .from(users)
      .where(inArray(users.id, entryRows.map((entry) => entry.userId)));
    const pickRows = await db
      .select()
      .from(entryPicks)
      .where(inArray(entryPicks.entryId, entryRows.map((entry) => entry.id)));
    const tournamentGolferRows = pickRows.length
      ? await db
          .select()
          .from(tournamentGolfers)
          .where(inArray(tournamentGolfers.id, pickRows.map((pick) => pick.tournamentGolferId)))
      : [];
    const golferRows = tournamentGolferRows.length
      ? await db
          .select()
          .from(golfers)
          .where(inArray(golfers.id, tournamentGolferRows.map((row) => row.golferId)))
      : [];

    const userById = new Map(userRows.map((user) => [user.id, asUser(user)]));
    const mockTournamentGolferById = new Map(getTournamentGolfers(tournamentId).map((golfer) => [golfer.id, golfer]));
    const golferById = new Map(golferRows.map((golfer) => [golfer.id, asGolfer(golfer)]));
    const tournamentGolferById = new Map(
      tournamentGolferRows.map((row) => {
        const mockGolfer = mockTournamentGolferById.get(row.id);
        return [
          row.id,
          mockGolfer ?? {
            ...asTournamentGolfer(row),
            golfer: golferById.get(row.golferId)!,
          },
        ];
      }),
    );

    const tournament = getTournament(tournamentId);
    const applyCut = tournament
      ? ["drop_open", "round_3", "round_4", "final"].includes(tournament.status)
      : false;

    return entryRows.map((entry) => {
      const picks = pickRows
        .filter((pick) => pick.entryId === entry.id)
        .map((pick) => ({
          ...asEntryPick(pick),
          tournamentGolfer: tournamentGolferById.get(pick.tournamentGolferId)!,
        }));
      const hydratedEntry: EntryWithDetails = {
        ...asEntry(entry),
        user: userById.get(entry.userId)!,
        picks,
      };

      if (!applyCut) return hydratedEntry;

      const cutStatus = calculateCutStatus(picks);
      return {
        ...hydratedEntry,
        status: tournament?.status === "final" && cutStatus.status === "qualified" ? "final" : cutStatus.status,
        picks: picks.map((pick) => ({
          ...pick,
          isCounting: cutStatus.countingPickIds.includes(pick.id),
        })),
      };
    });
  } catch (error) {
    console.warn("Unable to read entries from Postgres. Falling back to mock store.", error);
    return [];
  }
}

export async function getDbEntry(tournamentId: string, userId: string) {
  return (await getDbEntriesWithDetails(tournamentId)).find((entry) => entry.userId === userId);
}

export async function getDbAdminEntryRows(tournamentId: string): Promise<AdminEntryRow[]> {
  if (!process.env.DATABASE_URL) return [];

  try {
    const db = getDb();
    const playerRows = await db.select().from(users).where(eq(users.role, "player"));
    const entriesWithDetails = await getDbEntriesWithDetails(tournamentId);

    return playerRows.map((user) => ({
      user: asUser(user),
      entry: entriesWithDetails.find((entry) => entry.userId === user.id) ?? null,
    }));
  } catch (error) {
    console.warn("Unable to read admin entry rows from Postgres. Falling back to mock store.", error);
    return [];
  }
}

export async function getDbLeaderboard(tournamentId: string, tournament: Tournament) {
  return calculateGroupLeaderboard(await getDbEntriesWithDetails(tournamentId), tournament);
}

export async function getDbLowestRoundSummary(tournamentId: string): Promise<LowestRoundSummary | null> {
  if (!process.env.DATABASE_URL) return null;

  const entriesWithDetails = await getDbEntriesWithDetails(tournamentId);
  if (entriesWithDetails.length === 0) return null;

  const store = getStore();
  const golferLookup = getTournamentGolfers(tournamentId);
  const pickedGolferIds = new Set(
    entriesWithDetails.flatMap((entry) => entry.picks.map((pick) => pick.tournamentGolferId)),
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
    entriesWithDetails
      .filter((entry) => entry.picks.some((pick) => bestGolferIds.has(pick.tournamentGolferId)))
      .map((entry) => entry.userId),
  );

  return {
    scoreToPar: bestScore,
    roundNumber: bestRound.roundNumber ?? null,
    golfers,
    pickedBy: entriesWithDetails.map((entry) => entry.user).filter((user) => pickedUserIds.has(user.id)),
    countback: bestRounds.length === 1 ? countbackWinnerLabel(rounds, bestRound) : null,
  };
}

export async function submitDbEntry(
  tournamentId: string,
  userId: string,
  tournamentGolferIds: string[],
) {
  if (!process.env.DATABASE_URL) return null;
  const db = getDb();
  const tournament = await getDbTournament(tournamentId);
  if (!tournament) return { ok: false, message: "Tournament was not found." };

  const [existing] = await db
    .select()
    .from(entries)
    .where(and(eq(entries.tournamentId, tournamentId), eq(entries.userId, userId)))
    .limit(1);

  if (existing?.submittedAt) {
    return { ok: false, message: "Your team has already been submitted and cannot be changed." };
  }

  if (!["draft", "picks_open"].includes(tournament.status)) {
    return { ok: false, message: "Picks are closed for this tournament." };
  }

  const selectedGolfers = await db
    .select()
    .from(tournamentGolfers)
    .where(inArray(tournamentGolfers.id, tournamentGolferIds));
  const selectedById = new Map(selectedGolfers.map((golfer) => [golfer.id, golfer]));
  const orderedGolfers = tournamentGolferIds.map((id) => selectedById.get(id)).filter(Boolean);

  if (orderedGolfers.length !== tournamentGolferIds.length) {
    return { ok: false, message: "One or more selected golfers were not found." };
  }

  if (orderedGolfers.some((golfer) => golfer!.pointValue === null)) {
    return { ok: false, message: "Every picked golfer must have a sweepstake cost." };
  }

  const validation = validateEntryPicks(
    orderedGolfers.map((golfer) => ({ id: golfer!.id, pointValue: golfer!.pointValue })),
  );
  if (!validation.valid) {
    return { ok: false, message: validation.errors.join(" ") };
  }

  const timestamp = new Date();
  const entryId = existing?.id ?? newId("entry");
  const entryValues = {
    id: entryId,
    tournamentId,
    userId,
    status: "submitted" as const,
    totalPoints: validation.totalPoints,
    liveScore: null,
    finalScore: null,
    submittedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (existing) {
    await db
      .update(entries)
      .set({
        status: entryValues.status,
        totalPoints: entryValues.totalPoints,
        submittedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(entries.id, existing.id));
  } else {
    await db.insert(entries).values(entryValues);
  }

  await db.delete(entryPicks).where(eq(entryPicks.entryId, entryId));
  await db.insert(entryPicks).values(
    orderedGolfers.map((golfer) => ({
      id: newId("pick"),
      entryId,
      tournamentGolferId: golfer!.id,
      pointValueAtPick: golfer!.pointValue!,
      isDropped: false,
      isCounting: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
  );

  return { ok: true, message: "Team submitted. It is now locked." };
}

export async function adminUpsertDbEntryPicks(input: {
  tournamentId: string;
  userId: string;
  tournamentGolferIds: string[];
  adminUserId: string;
  reason: string;
}) {
  if (!process.env.DATABASE_URL) return null;
  const db = getDb();
  const tournament = await getDbTournament(input.tournamentId);
  if (!tournament) return { ok: false, message: "Tournament was not found." };

  const selectedGolfers = await db
    .select()
    .from(tournamentGolfers)
    .where(inArray(tournamentGolfers.id, input.tournamentGolferIds));
  const selectedById = new Map(selectedGolfers.map((golfer) => [golfer.id, golfer]));
  const orderedGolfers = input.tournamentGolferIds.map((id) => selectedById.get(id)).filter(Boolean);

  if (orderedGolfers.length !== input.tournamentGolferIds.length) {
    return { ok: false, message: "One or more selected golfers were not found." };
  }
  if (orderedGolfers.some((golfer) => golfer!.pointValue === null)) {
    return { ok: false, message: "Every picked golfer must have a sweepstake cost." };
  }

  const validation = validateEntryPicks(
    orderedGolfers.map((golfer) => ({ id: golfer!.id, pointValue: golfer!.pointValue })),
  );
  if (!validation.valid) return { ok: false, message: validation.errors.join(" ") };

  const timestamp = new Date();
  const [existing] = await db
    .select()
    .from(entries)
    .where(and(eq(entries.tournamentId, input.tournamentId), eq(entries.userId, input.userId)))
    .limit(1);
  const entryId = existing?.id ?? newId("entry");
  const oldPickIds = existing
    ? (await db.select().from(entryPicks).where(eq(entryPicks.entryId, existing.id)))
        .map((pick) => pick.tournamentGolferId)
    : [];

  if (existing) {
    await db
      .update(entries)
      .set({
        status: "submitted",
        totalPoints: validation.totalPoints,
        submittedAt: existing.submittedAt ?? timestamp,
        updatedAt: timestamp,
      })
      .where(eq(entries.id, existing.id));
  } else {
    await db.insert(entries).values({
      id: entryId,
      tournamentId: input.tournamentId,
      userId: input.userId,
      status: "submitted",
      totalPoints: validation.totalPoints,
      liveScore: null,
      finalScore: null,
      submittedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  await db.delete(entryPicks).where(eq(entryPicks.entryId, entryId));
  await db.insert(entryPicks).values(
    orderedGolfers.map((golfer) => ({
      id: newId("pick"),
      entryId,
      tournamentGolferId: golfer!.id,
      pointValueAtPick: golfer!.pointValue!,
      isDropped: false,
      isCounting: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
  );
  await db.insert(adminTeamCorrections).values({
    id: newId("team_correction"),
    entryId,
    oldPickIds: oldPickIds.join(","),
    newPickIds: orderedGolfers.map((golfer) => golfer!.id).join(","),
    reason: input.reason,
    createdByUserId: input.adminUserId,
    createdAt: timestamp,
  });

  return { ok: true, message: "Entry picks updated." };
}

export async function dropDbPlayer(entryId: string, pickId: string) {
  if (!process.env.DATABASE_URL) return null;
  const db = getDb();
  const [entry] = await db.select().from(entries).where(eq(entries.id, entryId)).limit(1);
  if (!entry) return { ok: false, message: "Entry was not found." };

  const tournament = getTournament(entry.tournamentId);
  if (!tournament || !["drop_open", "round_3", "round_4"].includes(tournament.status)) {
    return { ok: false, message: "The drop window is not open." };
  }

  const detailedEntry = await getDbEntry(entry.tournamentId, entry.userId);
  const selectedPick = detailedEntry?.picks.find((pick) => pick.id === pickId);
  if (!detailedEntry || !selectedPick) {
    return { ok: false, message: "Choose one of your submitted players." };
  }
  if (selectedPick.tournamentGolfer.madeCut !== true) {
    return { ok: false, message: "Only players who made the cut can be dropped." };
  }

  await Promise.all(
    detailedEntry.picks.map((pick) =>
      db
        .update(entryPicks)
        .set({
          isDropped: pick.id === pickId,
          isCounting: pick.id !== pickId && pick.tournamentGolfer.madeCut === true,
          updatedAt: new Date(),
        })
        .where(eq(entryPicks.id, pick.id)),
    ),
  );
  await db
    .update(entries)
    .set({ status: "qualified", updatedAt: new Date() })
    .where(eq(entries.id, entryId));

  return { ok: true, message: "Player dropped. Your remaining 3 now count." };
}

function golferNameForRound(
  golfers: Array<TournamentGolfer & { golfer: Golfer }>,
  round: GolferRoundScore,
) {
  return golfers.find((golfer) => golfer.id === round.tournamentGolferId)?.golfer.name ?? "";
}

function compareCountback(a?: number[] | null, b?: number[] | null) {
  if (!a?.length || !b?.length) return 0;
  for (const holes of [3, 6, 9, 18]) {
    const difference = countbackScore(a, holes) - countbackScore(b, holes);
    if (difference !== 0) return difference;
  }
  return 0;
}

function countbackWinnerLabel(rounds: GolferRoundScore[], winner: GolferRoundScore) {
  const tiedRounds = rounds.filter((round) => round.scoreToPar === winner.scoreToPar);
  if (tiedRounds.length < 2 || !winner.holeScores?.length) return null;

  for (const holes of [3, 6, 9, 18] as const) {
    const winnerScore = countbackScore(winner.holeScores, holes);
    if (
      tiedRounds.every((round) => {
        if (round.id === winner.id) return true;
        if (!round.holeScores?.length) return false;
        return winnerScore < countbackScore(round.holeScores, holes);
      })
    ) {
      return `b${holes}` as const;
    }
  }

  return null;
}

function countbackScore(scores: number[], holes: number) {
  return scores.slice(18 - holes).reduce((total, score) => total + score, 0);
}
