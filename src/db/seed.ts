import { getStore } from "@/lib/mock-data/store";
import { getDb } from "./client";
import {
  entryPicks,
  entries,
  golferRoundScores,
  golfers,
  groupCompetitions,
  groupMembers,
  groups,
  organisationMembers,
  organisations,
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
  const timestamp = new Date();
  const defaultOrganisation = {
    id: "org_default",
    name: "Default Organisation",
    slug: "default",
    billingEmail: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const defaultGroup = {
    id: "group_default",
    organisationId: defaultOrganisation.id,
    name: "Default Group",
    slug: "default",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db
    .insert(users)
    .values(
      store.users.map((user) => ({
        ...user,
        createdAt: asDate(user.createdAt)!,
      })),
    )
    .onConflictDoNothing();

  await db.insert(organisations).values(defaultOrganisation).onConflictDoNothing();

  await db
    .insert(organisationMembers)
    .values(
      store.users.map((user) => ({
        id: `org_member_${user.id}`,
        organisationId: defaultOrganisation.id,
        userId: user.id,
        role: user.role === "admin" ? ("owner" as const) : ("member" as const),
        createdAt: timestamp,
      })),
    )
    .onConflictDoNothing();

  await db.insert(groups).values(defaultGroup).onConflictDoNothing();

  await db
    .insert(groupMembers)
    .values(
      store.users.map((user) => ({
        id: `group_member_${user.id}`,
        groupId: defaultGroup.id,
        userId: user.id,
        role: user.role === "admin" ? ("admin" as const) : ("player" as const),
        createdAt: timestamp,
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
    .insert(groupCompetitions)
    .values(
      store.tournaments.map((tournament) => ({
        id: `competition_${tournament.id}`,
        groupId: defaultGroup.id,
        tournamentId: tournament.id,
        name: `${defaultGroup.name} - ${tournament.name} ${tournament.year}`,
        status: tournament.status,
        rosterSize: 4,
        budget: 90,
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
          groupCompetitionId: `competition_${entry.tournamentId}`,
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
