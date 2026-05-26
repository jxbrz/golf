import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  competitionRuleSets,
  groupCompetitions,
  groups,
  invites,
  leagueTournaments,
  leagues,
  organisationMembers,
  organisationRequests,
  organisations,
  tournaments,
  users,
} from "@/db/schema";
import { normalizeEmail } from "@/lib/email";
import { getActiveTournament } from "@/lib/mock-data/store";

type OrganisationType = typeof organisations.$inferSelect.type;
type InviteRole = typeof invites.$inferSelect.role;

export type OrganisationRequestInput = {
  organisationName: string;
  organisationType: OrganisationType;
  contactName: string;
  email: string;
  expectedPlayers: number;
  message: string | null;
};

export type InviteInput = {
  organisationId: string;
  leagueId: string;
  email: string;
  role: InviteRole;
  expiresAt: Date;
  createdByUserId: string;
};

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "organisation";
}

export async function createOrganisationRequest(input: OrganisationRequestInput) {
  const db = getDb();
  const timestamp = new Date();
  const [request] = await db
    .insert(organisationRequests)
    .values({
      id: newId("org_request"),
      organisationName: input.organisationName.trim(),
      organisationType: input.organisationType,
      contactName: input.contactName.trim(),
      email: normalizeEmail(input.email),
      expectedPlayers: input.expectedPlayers,
      message: input.message?.trim() || null,
      status: "pending",
      createdAt: timestamp,
      reviewedAt: null,
      reviewedByUserId: null,
    })
    .returning();

  return request;
}

export async function listOrganisationRequests() {
  if (!process.env.DATABASE_URL) return [];
  const db = getDb();
  return db.select().from(organisationRequests).orderBy(desc(organisationRequests.createdAt));
}

export async function approveOrganisationRequest(requestId: string, adminUserId: string) {
  const db = getDb();
  const timestamp = new Date();
  const [request] = await db
    .select()
    .from(organisationRequests)
    .where(eq(organisationRequests.id, requestId))
    .limit(1);

  if (!request) return { ok: false, message: "Organisation request was not found." };
  if (request.status !== "pending") return { ok: true, message: "Request has already been reviewed." };

  const owner = await findOrCreateUserForRequest({
    name: request.contactName,
    email: request.email,
    timestamp,
  });
  const activeTournament = getActiveTournament();
  const slug = `${slugify(request.organisationName)}-${crypto.randomUUID().slice(0, 8)}`;
  const organisationId = newId("org");
  const groupId = newId("group");
  const leagueId = newId("league");
  const ruleSetId = newId("rule_set");

  await db.insert(organisations).values({
    id: organisationId,
    name: request.organisationName,
    slug,
    type: request.organisationType,
    createdByUserId: owner.id,
    billingEmail: request.email,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await ensureOrganisationMembership({
    organisationId,
    userId: owner.id,
    role: "owner",
    timestamp,
  });

  await db.insert(groups).values({
    id: groupId,
    organisationId,
    name: `${request.organisationName} Group`,
    slug: `${slug}-group`,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await db.insert(leagues).values({
    id: leagueId,
    organisationId,
    name: `${request.organisationName} ${activeTournament.year}`,
    seasonYear: activeTournament.year,
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await db.insert(competitionRuleSets).values({
    id: ruleSetId,
    organisationId,
    name: "Major Picks Default",
    pickCount: 4,
    budgetPoints: 90,
    requiredMadeCutCount: 3,
    maxActiveAfterCut: 3,
    lockPolicy: "manual_or_deadline",
    dropPolicy: "manual_then_auto_worst_before_round_3",
    lowestRoundEnabled: true,
    countbackPolicy: { order: ["back_9", "back_6", "back_3"] },
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await attachCurrentTournamentToLeague({
    groupId,
    leagueId,
    ruleSetId,
    tournamentId: activeTournament.id,
    tournamentName: activeTournament.name,
    tournamentYear: activeTournament.year,
    pickDeadline: new Date(activeTournament.pickDeadline),
    timestamp,
  });

  await db
    .update(organisationRequests)
    .set({ status: "approved", reviewedAt: timestamp, reviewedByUserId: adminUserId })
    .where(eq(organisationRequests.id, requestId));

  return { ok: true, message: "Organisation approved.", organisationId };
}

export async function rejectOrganisationRequest(requestId: string, adminUserId: string) {
  const db = getDb();
  const timestamp = new Date();
  const [request] = await db
    .select()
    .from(organisationRequests)
    .where(eq(organisationRequests.id, requestId))
    .limit(1);

  if (!request) return { ok: false, message: "Organisation request was not found." };
  if (request.status !== "pending") return { ok: true, message: "Request has already been reviewed." };

  await db
    .update(organisationRequests)
    .set({ status: "rejected", reviewedAt: timestamp, reviewedByUserId: adminUserId })
    .where(eq(organisationRequests.id, requestId));

  return { ok: true, message: "Organisation request rejected." };
}

export async function listOrganisations() {
  if (!process.env.DATABASE_URL) return [];
  const db = getDb();
  const [organisationRows, memberRows, leagueRows] = await Promise.all([
    db.select().from(organisations).orderBy(desc(organisations.createdAt)),
    db.select().from(organisationMembers),
    db.select().from(leagues),
  ]);

  return organisationRows.map((organisation) => ({
    organisation,
    memberCount: memberRows.filter((member) => member.organisationId === organisation.id).length,
    leagueCount: leagueRows.filter((league) => league.organisationId === organisation.id).length,
  }));
}

export async function getOrganisationDetail(organisationId: string) {
  if (!process.env.DATABASE_URL) return null;
  const db = getDb();
  const [organisation] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.id, organisationId))
    .limit(1);
  if (!organisation) return null;

  const [memberRows, leagueRows, inviteRows] = await Promise.all([
    db
      .select()
      .from(organisationMembers)
      .where(eq(organisationMembers.organisationId, organisationId)),
    db.select().from(leagues).where(eq(leagues.organisationId, organisationId)),
    db.select().from(invites).where(eq(invites.organisationId, organisationId)),
  ]);
  const memberUserRows = memberRows.length
    ? await db.select().from(users).where(inArray(users.id, memberRows.map((member) => member.userId)))
    : [];
  const usersById = new Map(memberUserRows.map((user) => [user.id, user]));

  return {
    organisation,
    leagues: leagueRows,
    invites: inviteRows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    members: memberRows.map((member) => ({ member, user: usersById.get(member.userId) ?? null })),
  };
}

export async function createInvite(input: InviteInput) {
  const db = getDb();
  const timestamp = new Date();
  const [organisation] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.id, input.organisationId))
    .limit(1);
  const [league] = await db
    .select()
    .from(leagues)
    .where(and(eq(leagues.id, input.leagueId), eq(leagues.organisationId, input.organisationId)))
    .limit(1);

  if (!organisation || !league) return { ok: false, message: "Organisation or league was not found." };

  const inviteCode = await uniqueInviteCode();
  const [invite] = await db
    .insert(invites)
    .values({
      id: newId("invite"),
      organisationId: input.organisationId,
      leagueId: input.leagueId,
      email: normalizeEmail(input.email),
      inviteCode,
      role: input.role,
      status: "pending",
      expiresAt: input.expiresAt,
      createdByUserId: input.createdByUserId,
      createdAt: timestamp,
      acceptedAt: null,
    })
    .returning();

  return { ok: true, message: "Invite created.", invite };
}

export async function getInviteByCode(inviteCode: string) {
  if (!process.env.DATABASE_URL) return null;
  const db = getDb();
  const [invite] = await db.select().from(invites).where(eq(invites.inviteCode, inviteCode)).limit(1);
  if (!invite) return null;

  const [organisation] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.id, invite.organisationId))
    .limit(1);
  const [league] = invite.leagueId
    ? await db.select().from(leagues).where(eq(leagues.id, invite.leagueId)).limit(1)
    : [];

  return { invite, organisation: organisation ?? null, league: league ?? null };
}

export async function acceptInvite(inviteCode: string, user: { id: string; name: string; email: string }) {
  const db = getDb();
  const timestamp = new Date();
  const inviteDetails = await getInviteByCode(inviteCode);
  if (!inviteDetails?.invite) return { ok: false, message: "This invite could not be found." };

  const { invite } = inviteDetails;
  if (invite.status === "accepted") return { ok: false, message: "This invite has already been accepted." };
  if (invite.status === "expired" || invite.expiresAt < timestamp) {
    await db.update(invites).set({ status: "expired" }).where(eq(invites.id, invite.id));
    return { ok: false, message: "This invite has expired." };
  }
  if (normalizeEmail(user.email) !== normalizeEmail(invite.email)) {
    return { ok: false, message: "Sign in with the email address this invite was sent to." };
  }

  await ensureDbUserFromSession(user, timestamp);
  await ensureOrganisationMembership({
    organisationId: invite.organisationId,
    userId: user.id,
    role: invite.role,
    timestamp,
  });
  await db
    .update(invites)
    .set({ status: "accepted", acceptedAt: timestamp })
    .where(eq(invites.id, invite.id));

  return { ok: true, message: "Invite accepted." };
}

export async function getUserOrganisationContext(userId: string) {
  if (!process.env.DATABASE_URL) return [];
  try {
    const db = getDb();
    const memberRows = await db
      .select()
      .from(organisationMembers)
      .where(eq(organisationMembers.userId, userId));
    if (memberRows.length === 0) return [];

    const organisationRows = await db
      .select()
      .from(organisations)
      .where(inArray(organisations.id, memberRows.map((member) => member.organisationId)));
    const leagueRows = await db
      .select()
      .from(leagues)
      .where(inArray(leagues.organisationId, organisationRows.map((organisation) => organisation.id)));
    const leagueTournamentRows = leagueRows.length
      ? await db.select().from(leagueTournaments).where(inArray(leagueTournaments.leagueId, leagueRows.map((league) => league.id)))
      : [];
    const tournamentRows = leagueTournamentRows.length
      ? await db.select().from(tournaments).where(inArray(tournaments.id, leagueTournamentRows.map((row) => row.tournamentId)))
      : [];
    const activeTournament = getActiveTournament();

    return organisationRows.map((organisation) => {
      const organisationLeagues = leagueRows.filter((league) => league.organisationId === organisation.id);
      return {
        organisation,
        membership: memberRows.find((member) => member.organisationId === organisation.id)!,
        leagues: organisationLeagues.map((league) => ({
          league,
          tournaments: leagueTournamentRows
            .filter((row) => row.leagueId === league.id)
            .map((row) => tournamentRows.find((tournament) => tournament.id === row.tournamentId))
            .filter(Boolean)
            .map((tournament) => ({
              id: tournament!.id,
              name: tournament!.name,
              year: tournament!.year,
              status: tournament!.status,
              isCurrent: tournament!.id === activeTournament.id,
            })),
        })),
      };
    });
  } catch (error) {
    console.warn("Unable to read organisation context.", error);
    return [];
  }
}

async function findOrCreateUserForRequest(input: { name: string; email: string; timestamp: Date }) {
  const db = getDb();
  const email = normalizeEmail(input.email);
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) return existing;

  const userId = newId("user");
  try {
    const [created] = await db
      .insert(users)
      .values({
        id: userId,
        name: input.name.trim(),
        email,
        role: "player",
        createdAt: input.timestamp,
      })
      .returning();
    return created;
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const [recovered] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!recovered) throw error;
    return recovered;
  }
}

async function ensureDbUserFromSession(
  user: { id: string; name: string; email: string },
  timestamp: Date,
) {
  const db = getDb();
  const email = normalizeEmail(user.email);
  const [existing] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (existing) return existing;

  try {
    const [created] = await db
      .insert(users)
      .values({ id: user.id, name: user.name, email, role: "player", createdAt: timestamp })
      .returning();
    return created;
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const [recovered] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!recovered) throw error;
    return recovered;
  }
}

async function ensureOrganisationMembership(input: {
  organisationId: string;
  userId: string;
  role: typeof organisationMembers.$inferSelect.role;
  timestamp: Date;
}) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(organisationMembers)
    .where(and(
      eq(organisationMembers.organisationId, input.organisationId),
      eq(organisationMembers.userId, input.userId),
    ))
    .limit(1);

  if (existing) return existing;

  try {
    const [created] = await db
      .insert(organisationMembers)
      .values({
        id: newId("org_member"),
        organisationId: input.organisationId,
        userId: input.userId,
        role: input.role,
        createdAt: input.timestamp,
      })
      .returning();
    return created;
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const [recovered] = await db
      .select()
      .from(organisationMembers)
      .where(and(
        eq(organisationMembers.organisationId, input.organisationId),
        eq(organisationMembers.userId, input.userId),
      ))
      .limit(1);
    if (!recovered) throw error;
    return recovered;
  }
}

async function attachCurrentTournamentToLeague(input: {
  groupId: string;
  leagueId: string;
  ruleSetId: string;
  tournamentId: string;
  tournamentName: string;
  tournamentYear: number;
  pickDeadline: Date;
  timestamp: Date;
}) {
  const db = getDb();
  await db.insert(groupCompetitions).values({
    id: newId("competition"),
    groupId: input.groupId,
    tournamentId: input.tournamentId,
    ruleSetId: input.ruleSetId,
    name: `${input.tournamentName} ${input.tournamentYear}`,
    status: "picks_open",
    rosterSize: 4,
    budget: 90,
    picksLockAt: input.pickDeadline,
    cutProcessedAt: null,
    finalisedAt: null,
    currentRound: null,
    createdAt: input.timestamp,
    updatedAt: input.timestamp,
  });
  await db.insert(leagueTournaments).values({
    id: newId("league_tournament"),
    leagueId: input.leagueId,
    tournamentId: input.tournamentId,
    createdAt: input.timestamp,
  });
}

async function uniqueInviteCode() {
  const db = getDb();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
    const [existing] = await db.select().from(invites).where(eq(invites.inviteCode, code)).limit(1);
    if (!existing) return code;
  }
  return crypto.randomUUID().replaceAll("-", "");
}

function isUniqueConstraintError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; cause?: { code?: string } };
  return maybeError.code === "23505" || maybeError.cause?.code === "23505";
}
