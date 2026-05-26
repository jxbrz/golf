import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  competitionRuleSets,
  entries,
  entryPicks,
  golfers,
  golferRoundScores,
  groupCompetitions,
  tournamentGolfers,
  tournaments,
  users,
} from "@/db/schema";
import {
  canSubmitDbPicksForCompetitionStatus,
  getDbLeaderboard,
  getDbHybridStatus,
  lockDbPicks,
  resetDbTournamentEntries,
  submitDbEntry,
  updateDbGroupCompetitionForWeekendStep,
  writeDbFixtureRoundScores,
} from "./entries";
import {
  advanceWeekendStep,
  getTournament,
  resetInMemoryStoreForTesting,
  submitEntry,
} from "@/lib/mock-data/store";

vi.mock("server-only", () => ({}));

const db = createFakeDb();

vi.mock("@/db/client", () => ({
  getDb: () => db,
}));

const originalDatabaseUrl = process.env.DATABASE_URL;

describe("DB-backed entry lock behaviour", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://test";
    db.reset();
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it("allows DB-backed submission when group competition status is setup", async () => {
    db.seedCompetition("setup");

    const result = await submitDbEntry("t_pga_2026", "u_player1", validPickIds);

    expect(result).toEqual({ ok: true, message: "Team submitted." });
    expect(db.state.entries).toHaveLength(1);
    expect(db.state.entries[0].groupCompetitionId).toBe("competition_t_pga_2026");
    expect(db.state.entryPicks).toHaveLength(4);
  });

  it("allows DB-backed submission when group competition status is picks_open", async () => {
    db.seedCompetition("picks_open");

    const result = await submitDbEntry("t_pga_2026", "u_player1", validPickIds);

    expect(result).toEqual({ ok: true, message: "Team submitted." });
    expect(db.state.entries).toHaveLength(1);
  });

  it("allows DB-backed editing before lock without creating a duplicate entry", async () => {
    db.seedCompetition("picks_open");

    await submitDbEntry("t_pga_2026", "u_player1", validPickIds);
    const existingEntryId = db.state.entries[0].id;
    const result = await submitDbEntry("t_pga_2026", "u_player1", editedPickIds);

    expect(result).toEqual({ ok: true, message: "Team updated." });
    expect(db.state.entries).toHaveLength(1);
    expect(db.state.entries[0].id).toBe(existingEntryId);
    expect(db.state.entryPicks.map((pick) => pick.tournamentGolferId)).toEqual(editedPickIds);
  });

  it("blocks DB-backed submission and editing when group competition status is picks_locked", async () => {
    db.seedCompetition("picks_locked");

    const result = await submitDbEntry("t_pga_2026", "u_player1", validPickIds);

    expect(result).toEqual({ ok: false, message: "Picks are closed for this tournament." });
    expect(db.state.entries).toHaveLength(0);
    expect(db.state.entryPicks).toHaveLength(0);
  });

  it("returns null so the mock path can handle submission when no DB group competition exists", async () => {
    db.seedCompetition(null);

    const result = await submitDbEntry("t_pga_2026", "u_player1", validPickIds);
    const mockStore = resetInMemoryStoreForTesting();
    const fallbackResult = submitEntry("t_pga_2026", "u_player1", validPickIds);

    expect(result).toBeNull();
    expect(db.state.entries).toHaveLength(0);
    expect(fallbackResult).toEqual({ ok: true, message: "Team submitted." });
    expect(mockStore.entries).toHaveLength(1);
  });

  it("locks DB picks without changing tournament status", async () => {
    db.seedCompetition("picks_open");

    const result = await lockDbPicks("t_pga_2026");

    expect(result).toEqual({ ok: true, message: "Competition status updated." });
    expect(db.state.groupCompetitions[0].status).toBe("picks_locked");
    expect(db.state.groupCompetitions[0].picksLockAt).toBeInstanceOf(Date);
    expect(db.state.tournaments[0].status).toBe("picks_open");
  });

  it("mirrors each admin weekend step into group competition status and current round", async () => {
    db.seedCompetition("picks_open");

    await updateDbGroupCompetitionForWeekendStep("t_pga_2026", "lock_picks");
    expect(db.state.groupCompetitions[0]).toMatchObject({
      status: "picks_locked",
      currentRound: null,
    });
    expect(db.state.groupCompetitions[0].picksLockAt).toBeInstanceOf(Date);

    await updateDbGroupCompetitionForWeekendStep("t_pga_2026", "round_1");
    expect(db.state.groupCompetitions[0]).toMatchObject({
      status: "round_1_loaded",
      currentRound: 1,
    });

    await updateDbGroupCompetitionForWeekendStep("t_pga_2026", "round_2");
    expect(db.state.groupCompetitions[0]).toMatchObject({
      status: "round_2_loaded",
      currentRound: 2,
    });

    await updateDbGroupCompetitionForWeekendStep("t_pga_2026", "process_cut");
    expect(db.state.groupCompetitions[0]).toMatchObject({
      status: "cut_processed",
      currentRound: 2,
    });
    expect(db.state.groupCompetitions[0].cutProcessedAt).toBeInstanceOf(Date);

    await updateDbGroupCompetitionForWeekendStep("t_pga_2026", "round_3");
    expect(db.state.groupCompetitions[0]).toMatchObject({
      status: "round_3_loaded",
      currentRound: 3,
    });

    await updateDbGroupCompetitionForWeekendStep("t_pga_2026", "round_4");
    expect(db.state.groupCompetitions[0]).toMatchObject({
      status: "round_4_loaded",
      currentRound: 4,
    });

    await updateDbGroupCompetitionForWeekendStep("t_pga_2026", "final");
    expect(db.state.groupCompetitions[0]).toMatchObject({
      status: "finalised",
      currentRound: 4,
    });
    expect(db.state.groupCompetitions[0].finalisedAt).toBeInstanceOf(Date);
    expect(db.state.tournaments[0].status).toBe("picks_open");
  });

  it("writes round 1 fixture scores to golfer_round_scores", async () => {
    db.seedCompetition("picks_locked");

    const result = await writeDbFixtureRoundScores("t_pga_2026", 1);

    expect(result).toEqual({ ok: true, message: "Wrote 5 round 1 scores." });
    expect(db.state.golferRoundScores).toHaveLength(5);
    expect(roundScore("tg_g51", 1)).toMatchObject({
      scoreToPar: 0,
      strokes: 70,
      thru: "18",
      status: "active",
    });
  });

  it("reports hybrid DB status, fixture score presence, and active rule set", async () => {
    db.seedCompetition("round_4_loaded");
    await writeDbFixtureRoundScores("t_pga_2026", 1);
    await writeDbFixtureRoundScores("t_pga_2026", 4);

    const status = await getDbHybridStatus("t_pga_2026");

    expect(status?.competition.id).toBe("competition_t_pga_2026");
    expect(status?.competition.status).toBe("round_4_loaded");
    expect(status?.ruleSet?.name).toBe("Major Picks Default");
    expect(status?.scoreRounds).toEqual({ 1: 5, 2: 0, 3: 0, 4: 5 });
  });

  it("writes round 2 fixture scores to golfer_round_scores", async () => {
    db.seedCompetition("round_1_loaded");

    await writeDbFixtureRoundScores("t_pga_2026", 2);

    expect(db.state.golferRoundScores).toHaveLength(5);
    expect(roundScore("tg_g51", 2)).toMatchObject({
      scoreToPar: -1,
      strokes: 69,
      thru: "18",
      status: "active",
    });
  });

  it("hydrates DB leaderboard picks with loaded fixture round score totals", async () => {
    db.seedCompetition("picks_open");
    await submitDbEntry("t_pga_2026", "u_player1", validPickIds);
    await writeDbFixtureRoundScores("t_pga_2026", 1);
    await writeDbFixtureRoundScores("t_pga_2026", 2);

    const tournament = getTournament("t_pga_2026");
    expect(tournament).toBeDefined();

    const rows = await getDbLeaderboard("t_pga_2026", tournament!);
    const playerRow = rows.find((row) => row.entry.userId === "u_player1");

    expect(playerRow?.entry.picks.map((pick) => pick.tournamentGolfer.totalScore)).toEqual([
      2,
      0,
      1,
      4,
    ]);
    expect(playerRow?.score).toBe(3);
  });

  it("writes round 3 fixture scores to golfer_round_scores", async () => {
    db.seedCompetition("cut_processed");

    await writeDbFixtureRoundScores("t_pga_2026", 3);

    expect(db.state.golferRoundScores).toHaveLength(5);
    expect(roundScore("tg_g51", 3)).toMatchObject({
      scoreToPar: -3,
      strokes: 67,
      thru: "18",
      status: "active",
    });
  });

  it("writes round 4 fixture scores including countback hole scores to golfer_round_scores", async () => {
    db.seedCompetition("round_3_loaded");

    await writeDbFixtureRoundScores("t_pga_2026", 4);

    expect(db.state.golferRoundScores).toHaveLength(5);
    expect(roundScore("tg_g51", 4)).toMatchObject({
      scoreToPar: -5,
      strokes: 65,
      thru: "18",
      status: "finished",
    });
    expect(JSON.parse(roundScore("tg_g51", 4)?.holeScores ?? "[]")).toHaveLength(18);
  });

  it("rerunning a round fixture write updates rows without duplicating them", async () => {
    db.seedCompetition("round_1_loaded");

    await writeDbFixtureRoundScores("t_pga_2026", 1);
    await writeDbFixtureRoundScores("t_pga_2026", 1);

    expect(db.state.golferRoundScores).toHaveLength(5);
    expect(db.state.golferRoundScores.filter((score) => score.roundNumber === 1)).toHaveLength(5);
  });

  it("reset clears group competition lifecycle fields and reopens local DB state", async () => {
    db.seedCompetition("finalised");
    Object.assign(db.state.groupCompetitions[0], {
      currentRound: 4,
      picksLockAt: new Date("2026-05-14T11:00:00.000Z"),
      cutProcessedAt: new Date("2026-05-15T23:00:00.000Z"),
      finalisedAt: new Date("2026-05-17T23:00:00.000Z"),
    });

    const result = await resetDbTournamentEntries("t_pga_2026");

    expect(result).toBe(true);
    expect(db.state.groupCompetitions[0]).toMatchObject({
      status: "picks_open",
      currentRound: null,
      picksLockAt: null,
      cutProcessedAt: null,
      finalisedAt: null,
    });
  });

  it("returns null on missing DB group competition while mock weekend fallback still advances", async () => {
    db.seedCompetition(null);
    resetInMemoryStoreForTesting();

    const result = await updateDbGroupCompetitionForWeekendStep("t_pga_2026", "round_1");
    advanceWeekendStep("t_pga_2026", "round_1");

    expect(result).toBeNull();
    expect(db.state.golferRoundScores).toHaveLength(0);
    expect(getTournament("t_pga_2026")?.status).toBe("round_1");
  });

  it("treats only setup and picks_open as editable DB competition statuses", () => {
    expect(canSubmitDbPicksForCompetitionStatus("setup")).toBe(true);
    expect(canSubmitDbPicksForCompetitionStatus("picks_open")).toBe(true);
    expect(canSubmitDbPicksForCompetitionStatus("picks_locked")).toBe(false);
    expect(canSubmitDbPicksForCompetitionStatus("round_1_loaded")).toBe(false);
    expect(canSubmitDbPicksForCompetitionStatus("round_2_loaded")).toBe(false);
    expect(canSubmitDbPicksForCompetitionStatus("cut_processed")).toBe(false);
    expect(canSubmitDbPicksForCompetitionStatus("round_3_loaded")).toBe(false);
    expect(canSubmitDbPicksForCompetitionStatus("round_4_loaded")).toBe(false);
    expect(canSubmitDbPicksForCompetitionStatus("finalised")).toBe(false);
  });
});

const validPickIds = ["tg_g52", "tg_g53", "tg_g54", "tg_g55"];
const editedPickIds = ["tg_g51", "tg_g52", "tg_g53", "tg_g55"];

function roundScore(tournamentGolferId: string, roundNumber: number) {
  return db.state.golferRoundScores.find(
    (score) => score.tournamentGolferId === tournamentGolferId && score.roundNumber === roundNumber,
  );
}

function createFakeDb() {
  type CompetitionStatus = typeof groupCompetitions.$inferSelect.status;
  type CompetitionRuleSetRow = typeof competitionRuleSets.$inferSelect;
  type TournamentRow = typeof tournaments.$inferSelect;
  type GroupCompetitionRow = typeof groupCompetitions.$inferSelect;
  type TournamentGolferRow = typeof tournamentGolfers.$inferSelect;
  type GolferRow = typeof golfers.$inferSelect;
  type GolferRoundScoreRow = typeof golferRoundScores.$inferSelect;
  type EntryRow = typeof entries.$inferSelect;
  type EntryPickRow = typeof entryPicks.$inferSelect;
  type UserRow = typeof users.$inferSelect;

  const state: {
    tournaments: TournamentRow[];
    groupCompetitions: GroupCompetitionRow[];
    competitionRuleSets: CompetitionRuleSetRow[];
    tournamentGolfers: TournamentGolferRow[];
    golfers: GolferRow[];
    golferRoundScores: GolferRoundScoreRow[];
    users: UserRow[];
    entries: EntryRow[];
    entryPicks: EntryPickRow[];
  } = {
    tournaments: [],
    groupCompetitions: [],
    competitionRuleSets: [],
    tournamentGolfers: [],
    golfers: [],
    golferRoundScores: [],
    users: [],
    entries: [],
    entryPicks: [],
  };

  const rowsFor = (table: unknown) => {
    if (table === tournaments) return state.tournaments;
    if (table === groupCompetitions) return state.groupCompetitions;
    if (table === competitionRuleSets) return state.competitionRuleSets;
    if (table === tournamentGolfers) return state.tournamentGolfers;
    if (table === golfers) return state.golfers;
    if (table === golferRoundScores) return state.golferRoundScores;
    if (table === users) return state.users;
    if (table === entries) return state.entries;
    if (table === entryPicks) return state.entryPicks;
    return [];
  };

  const api = {
    state,
    reset() {
      state.tournaments = [];
      state.groupCompetitions = [];
      state.competitionRuleSets = [];
      state.tournamentGolfers = [];
      state.golfers = [];
      state.golferRoundScores = [];
      state.users = [];
      state.entries = [];
      state.entryPicks = [];
    },
    seedCompetition(status: CompetitionStatus | null) {
      const timestamp = new Date("2026-05-01T00:00:00.000Z");
      state.tournaments = [
        {
          id: "t_pga_2026",
          name: "PGA Championship",
          majorKey: "pga",
          year: 2026,
          venue: "Aronimink",
          startDate: timestamp,
          endDate: timestamp,
          pickDeadline: timestamp,
          dropDeadline: timestamp,
          status: "picks_open",
          providerTournamentId: "033",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ];
      state.groupCompetitions = status
        ? [
            {
              id: "competition_t_pga_2026",
              groupId: "group_default",
              tournamentId: "t_pga_2026",
              ruleSetId: "rule_set_major_picks_default",
              name: "Major Picks Group - PGA Championship 2026",
              status,
              rosterSize: 4,
              budget: 90,
              picksLockAt: null,
              cutProcessedAt: null,
              finalisedAt: null,
              currentRound: null,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ]
        : [];
      state.competitionRuleSets = [
        {
          id: "rule_set_major_picks_default",
          organisationId: "org_default",
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
        },
      ];
      state.tournamentGolfers = [
        ["tg_g51", "g51", 5],
        ["tg_g52", "g52", 4],
        ["tg_g53", "g53", 3],
        ["tg_g54", "g54", 2],
        ["tg_g55", "g55", 1],
      ].map(([id, golferId, pointValue]) => ({
        id: String(id),
        tournamentId: "t_pga_2026",
        golferId: String(golferId),
        pointValue: Number(pointValue),
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
      }));
      state.golfers = ["g51", "g52", "g53", "g54", "g55"].map((id) => ({
        id,
        providerPlayerId: id,
        name: `Golfer ${id.slice(1)}`,
        country: "USA",
        createdAt: timestamp,
        updatedAt: timestamp,
      }));
      state.users = [
        {
          id: "u_player1",
          name: "Player One",
          email: "player1@example.com",
          role: "player",
          createdAt: timestamp,
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
          const rows = rowsFor(table);
          if (Array.isArray(values)) {
            rows.push(...values);
          } else {
            rows.push(values);
          }
          return Promise.resolve();
        },
      };
    },
    update(table: unknown) {
      return {
        set(values: Record<string, unknown>) {
          return {
            where() {
              const rows = rowsFor(table) as Array<Record<string, unknown>>;
              const rowsToUpdate =
                table === golferRoundScores && typeof values.roundNumber === "number"
                  ? rows.filter((row) => row.roundNumber === values.roundNumber)
                  : rows;
              for (const row of rowsToUpdate) {
                Object.assign(row, values);
              }
              return Promise.resolve();
            },
          };
        },
      };
    },
    delete(table: unknown) {
      return {
        where() {
          if (table === entryPicks) state.entryPicks = [];
          return Promise.resolve();
        },
      };
    },
  };

  return api;
}
