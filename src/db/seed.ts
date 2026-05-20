import { getStore } from "@/lib/mock-data/store";
import { getDb } from "./client";
import {
  entryPicks,
  entries,
  golferRoundScores,
  golfers,
  tournaments,
  tournamentGolfers,
  users,
} from "./schema";

const store = getStore();

function asDate(value: string | null) {
  return value ? new Date(value) : null;
}

async function seed() {
  const db = getDb();

  await db
    .insert(users)
    .values(
      store.users.map((user) => ({
        ...user,
        createdAt: asDate(user.createdAt)!,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(tournaments)
    .values(
      store.tournaments.map((tournament) => ({
        ...tournament,
        startDate: asDate(tournament.startDate)!,
        endDate: asDate(tournament.endDate)!,
        pickDeadline: asDate(tournament.pickDeadline)!,
        dropDeadline: asDate(tournament.dropDeadline)!,
        createdAt: asDate(tournament.createdAt)!,
        updatedAt: asDate(tournament.updatedAt)!,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(golfers)
    .values(
      store.golfers.map((golfer) => ({
        ...golfer,
        createdAt: asDate(golfer.createdAt)!,
        updatedAt: asDate(golfer.updatedAt)!,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(tournamentGolfers)
    .values(
      store.tournamentGolfers.map((golfer) => ({
        ...golfer,
        lastSyncedAt: asDate(golfer.lastSyncedAt),
        createdAt: asDate(golfer.createdAt)!,
        updatedAt: asDate(golfer.updatedAt)!,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(golferRoundScores)
    .values(
      store.golferRoundScores.map((score) => ({
        ...score,
        holeScores: score.holeScores ? JSON.stringify(score.holeScores) : null,
        createdAt: asDate(score.createdAt)!,
        updatedAt: asDate(score.updatedAt)!,
      })),
    )
    .onConflictDoNothing();

  if (store.entries.length > 0) {
    await db
      .insert(entries)
      .values(
        store.entries.map((entry) => ({
          ...entry,
          submittedAt: asDate(entry.submittedAt),
          createdAt: asDate(entry.createdAt)!,
          updatedAt: asDate(entry.updatedAt)!,
        })),
      )
      .onConflictDoNothing();
  }

  if (store.entryPicks.length > 0) {
    await db.insert(entryPicks).values(store.entryPicks.map((pick) => ({
      ...pick,
      createdAt: asDate(pick.createdAt)!,
      updatedAt: asDate(pick.updatedAt)!,
    }))).onConflictDoNothing();
  }

  console.log(
    `Seeded ${store.tournaments.length} tournament, ${store.users.length} users, ${store.golfers.length} golfers.`,
  );
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
