import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  users,
} from "@/db/schema";
import { normalizeEmail } from "@/lib/email";
import {
  acceptInvite,
  approveOrganisationRequest,
  createInvite,
  createOrganisationRequest,
} from "./organisations";

vi.mock("server-only", () => ({}));

const db = createFakeDb();

vi.mock("@/db/client", () => ({
  getDb: () => db,
}));

const originalDatabaseUrl = process.env.DATABASE_URL;

describe("organisation onboarding helpers", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://test";
    db.reset();
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it("normalizes emails consistently", () => {
    expect(normalizeEmail("  Captain@GolfClub.COM  ")).toBe("captain@golfclub.com");
  });

  it("stores organisation requests as pending with normalized email", async () => {
    const request = await createOrganisationRequest({
      organisationName: "Aronimink Members",
      organisationType: "golf_club",
      contactName: "Sam Taylor",
      email: "  SAM@Example.COM ",
      expectedPlayers: 40,
      message: "Major week league",
    });

    expect(request.email).toBe("sam@example.com");
    expect(request.status).toBe("pending");
    expect(db.state.organisationRequests).toHaveLength(1);
  });

  it("approves a request into an organisation, owner, league and default rule set", async () => {
    db.seedRequest({ email: " owner@example.com " });

    const result = await approveOrganisationRequest("request_1", "u_admin");

    expect(result.ok).toBe(true);
    expect(db.state.users[0]).toMatchObject({
      name: "Owner User",
      email: "owner@example.com",
      role: "player",
    });
    expect(db.state.organisationMembers[0]).toMatchObject({
      userId: db.state.users[0].id,
      role: "owner",
    });
    expect(db.state.organisations).toHaveLength(1);
    expect(db.state.leagues[0]).toMatchObject({ seasonYear: 2026, status: "active" });
    expect(db.state.competitionRuleSets[0]).toMatchObject({
      pickCount: 4,
      budgetPoints: 90,
      requiredMadeCutCount: 3,
      maxActiveAfterCut: 3,
    });
    expect(db.state.groupCompetitions).toHaveLength(1);
    expect(db.state.leagueTournaments).toHaveLength(1);
    expect(db.state.organisationRequests[0]).toMatchObject({ status: "approved" });
  });

  it("recovers if duplicate user creation wins the race during approval", async () => {
    db.seedRequest({ email: "race@example.com" });
    db.throwDuplicateUserOnce = true;

    const result = await approveOrganisationRequest("request_1", "u_admin");

    expect(result.ok).toBe(true);
    expect(db.state.users).toHaveLength(1);
    expect(db.state.users[0].email).toBe("race@example.com");
    expect(db.state.organisationMembers[0].userId).toBe(db.state.users[0].id);
  });

  it("creates invites with normalized email", async () => {
    db.seedOrganisation();

    const result = await createInvite({
      organisationId: "org_1",
      leagueId: "league_1",
      email: " PLAYER@Example.COM ",
      role: "player",
      expiresAt: new Date("2026-06-01T00:00:00.000Z"),
      createdByUserId: "u_admin",
    });

    expect(result.ok).toBe(true);
    expect(result.invite?.email).toBe("player@example.com");
    expect(result.invite?.status).toBe("pending");
  });

  it("requires matching normalized email when accepting invites", async () => {
    db.seedOrganisation();
    db.seedInvite({ email: "player@example.com" });

    const mismatch = await acceptInvite("abc123", {
      id: "u_player",
      name: "Player",
      email: "other@example.com",
    });
    expect(mismatch.ok).toBe(false);

    const accepted = await acceptInvite("abc123", {
      id: "u_player",
      name: "Player",
      email: " Player@Example.COM ",
    });
    expect(accepted.ok).toBe(true);
    expect(db.state.invites[0]).toMatchObject({ status: "accepted" });
    expect(db.state.organisationMembers[0]).toMatchObject({
      organisationId: "org_1",
      userId: "u_player",
      role: "player",
    });
  });
});

function createFakeDb() {
  type UserRow = typeof users.$inferSelect;
  type OrganisationRequestRow = typeof organisationRequests.$inferSelect;
  type OrganisationRow = typeof organisations.$inferSelect;
  type OrganisationMemberRow = typeof organisationMembers.$inferSelect;
  type LeagueRow = typeof leagues.$inferSelect;
  type InviteRow = typeof invites.$inferSelect;

  const timestamp = new Date("2026-05-01T00:00:00.000Z");
  const state: {
    users: UserRow[];
    organisationRequests: OrganisationRequestRow[];
    organisations: OrganisationRow[];
    organisationMembers: OrganisationMemberRow[];
    groups: Array<typeof groups.$inferSelect>;
    leagues: LeagueRow[];
    competitionRuleSets: Array<typeof competitionRuleSets.$inferSelect>;
    groupCompetitions: Array<typeof groupCompetitions.$inferSelect>;
    leagueTournaments: Array<typeof leagueTournaments.$inferSelect>;
    invites: InviteRow[];
  } = {
    users: [],
    organisationRequests: [],
    organisations: [],
    organisationMembers: [],
    groups: [],
    leagues: [],
    competitionRuleSets: [],
    groupCompetitions: [],
    leagueTournaments: [],
    invites: [],
  };

  const rowsFor = (table: unknown) => {
    if (table === users) return state.users;
    if (table === organisationRequests) return state.organisationRequests;
    if (table === organisations) return state.organisations;
    if (table === organisationMembers) return state.organisationMembers;
    if (table === groups) return state.groups;
    if (table === leagues) return state.leagues;
    if (table === competitionRuleSets) return state.competitionRuleSets;
    if (table === groupCompetitions) return state.groupCompetitions;
    if (table === leagueTournaments) return state.leagueTournaments;
    if (table === invites) return state.invites;
    return [];
  };

  const api = {
    state,
    throwDuplicateUserOnce: false,
    reset() {
      state.users = [];
      state.organisationRequests = [];
      state.organisations = [];
      state.organisationMembers = [];
      state.groups = [];
      state.leagues = [];
      state.competitionRuleSets = [];
      state.groupCompetitions = [];
      state.leagueTournaments = [];
      state.invites = [];
      api.throwDuplicateUserOnce = false;
    },
    seedRequest(input: { email: string }) {
      state.organisationRequests = [
        {
          id: "request_1",
          organisationName: "Test Golf Club",
          organisationType: "golf_club",
          contactName: "Owner User",
          email: normalizeEmail(input.email),
          expectedPlayers: 32,
          message: "Please set us up.",
          status: "pending",
          createdAt: timestamp,
          reviewedAt: null,
          reviewedByUserId: null,
        },
      ];
    },
    seedOrganisation() {
      state.organisations = [
        {
          id: "org_1",
          name: "Test Club",
          slug: "test-club",
          type: "golf_club",
          createdByUserId: "u_admin",
          billingEmail: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ];
      state.leagues = [
        {
          id: "league_1",
          organisationId: "org_1",
          name: "Test Club 2026",
          seasonYear: 2026,
          status: "active",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ];
    },
    seedInvite(input: { email: string }) {
      state.invites = [
        {
          id: "invite_1",
          organisationId: "org_1",
          leagueId: "league_1",
          email: normalizeEmail(input.email),
          inviteCode: "abc123",
          role: "player",
          status: "pending",
          expiresAt: new Date("2026-06-01T00:00:00.000Z"),
          createdByUserId: "u_admin",
          createdAt: timestamp,
          acceptedAt: null,
        },
      ];
    },
    select() {
      return {
        from(table: unknown) {
          const rows = rowsFor(table);
          const query = {
            where() {
              return query;
            },
            orderBy() {
              return query;
            },
            limit(count: number) {
              return rows.slice(0, count);
            },
            then(resolve: (value: unknown[]) => void) {
              return Promise.resolve(rows).then(resolve);
            },
          };
          return query;
        },
      };
    },
    insert(table: unknown) {
      return {
        values(values: unknown) {
          if (table === users && api.throwDuplicateUserOnce) {
            api.throwDuplicateUserOnce = false;
            state.users.push({
              id: "user_race",
              name: "Owner User",
              email: "race@example.com",
              role: "player",
              createdAt: timestamp,
            });
            throw Object.assign(new Error("duplicate key value"), { code: "23505" });
          }
          const rows = rowsFor(table);
          const inserted = Array.isArray(values) ? values : [values];
          rows.push(...inserted);
          return {
            returning() {
              return Promise.resolve(inserted);
            },
            then(resolve: (value: unknown[]) => void) {
              return Promise.resolve(inserted).then(resolve);
            },
          };
        },
      };
    },
    update(table: unknown) {
      return {
        set(values: Record<string, unknown>) {
          return {
            where() {
              for (const row of rowsFor(table) as Array<Record<string, unknown>>) {
                Object.assign(row, values);
              }
              return Promise.resolve();
            },
          };
        },
      };
    },
  };

  return api;
}
