import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  entries,
  entryPicks,
  groupCompetitions,
  tournamentGolfers,
  tournaments,
} from "@/db/schema";
import {
  canSubmitDbPicksForCompetitionStatus,
  lockDbPicks,
  resetDbTournamentEntries,
  submitDbEntry,
  updateDbGroupCompetitionForWeekendStep,
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

function createFakeDb() {
  type CompetitionStatus = typeof groupCompetitions.$inferSelect.status;
  type TournamentRow = typeof tournaments.$inferSelect;
  type GroupCompetitionRow = typeof groupCompetitions.$inferSelect;
  type TournamentGolferRow = typeof tournamentGolfers.$inferSelect;
  type EntryRow = typeof entries.$inferSelect;
  type EntryPickRow = typeof entryPicks.$inferSelect;

  const state: {
    tournaments: TournamentRow[];
    groupCompetitions: GroupCompetitionRow[];
    tournamentGolfers: TournamentGolferRow[];
    entries: EntryRow[];
    entryPicks: EntryPickRow[];
  } = {
    tournaments: [],
    groupCompetitions: [],
    tournamentGolfers: [],
    entries: [],
    entryPicks: [],
  };

  const rowsFor = (table: unknown) => {
    if (table === tournaments) return state.tournaments;
    if (table === groupCompetitions) return state.groupCompetitions;
    if (table === tournamentGolfers) return state.tournamentGolfers;
    if (table === entries) return state.entries;
    if (table === entryPicks) return state.entryPicks;
    return [];
  };

  const api = {
    state,
    reset() {
      state.tournaments = [];
      state.groupCompetitions = [];
      state.tournamentGolfers = [];
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
              for (const row of rowsFor(table) as Array<Record<string, unknown>>) {
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
