import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  entries,
  entryPicks,
  golfers,
  tournamentGolfers,
  tournaments,
  users,
} from "@/db/schema";
import {
  calculateGroupLeaderboard,
  validateEntryPicks,
} from "@/lib/scoring/scoring";
import type {
  Entry,
  EntryPick,
  EntryWithDetails,
  Golfer,
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
    const golferById = new Map(golferRows.map((golfer) => [golfer.id, asGolfer(golfer)]));
    const tournamentGolferById = new Map(
      tournamentGolferRows.map((row) => [
        row.id,
        {
          ...asTournamentGolfer(row),
          golfer: golferById.get(row.golferId)!,
        },
      ]),
    );

    return entryRows.map((entry) => ({
      ...asEntry(entry),
      user: userById.get(entry.userId)!,
      picks: pickRows
        .filter((pick) => pick.entryId === entry.id)
        .map((pick) => ({
          ...asEntryPick(pick),
          tournamentGolfer: tournamentGolferById.get(pick.tournamentGolferId)!,
        })),
    }));
  } catch (error) {
    console.warn("Unable to read entries from Postgres. Falling back to mock store.", error);
    return [];
  }
}

export async function getDbEntry(tournamentId: string, userId: string) {
  return (await getDbEntriesWithDetails(tournamentId)).find((entry) => entry.userId === userId);
}

export async function getDbLeaderboard(tournamentId: string, tournament: Tournament) {
  return calculateGroupLeaderboard(await getDbEntriesWithDetails(tournamentId), tournament);
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
