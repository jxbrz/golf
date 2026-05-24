import { describe, expect, it } from "vitest";
import { createFixtureStoreData, loadTournamentFixture } from "./loader";
import {
  getLowestRoundSummary,
  resetInMemoryStoreForTesting,
} from "../../lib/mock-data/store";
import type { Entry, EntryPick, GolferRoundScore } from "../../lib/types";

const timestamp = "2026-05-01T00:00:00.000Z";
const tournamentId = "t_pga_2026";

describe("tournament fixture loader", () => {
  it("returns the mock tournament, field, and round score shapes used by the store", () => {
    const fixture = loadTournamentFixture("pga-championship-2026");
    const storeData = createFixtureStoreData("pga-championship-2026", timestamp);

    expect(fixture.tournament.id).toBe(tournamentId);
    expect(fixture.field).toHaveLength(159);
    expect(fixture.roundScores).toHaveLength(156);
    expect(fixture.roundScoreFixtures.get("g51")).toEqual([70, 69, 67, 65]);
    expect(fixture.roundHoleFixtures.get("g51")?.[4]).toHaveLength(18);
    expect(fixture.expectedResults.lowestRoundCountbackOrder).toEqual([
      "back_9",
      "back_6",
      "back_3",
    ]);

    expect(storeData.tournament.id).toBe(tournamentId);
    expect(storeData.golfers[0]).toMatchObject({
      id: "g01",
      providerPlayerId: "mock-g01",
      name: "Scottie Scheffler",
    });
    expect(storeData.tournamentGolfers[0]).toMatchObject({
      id: "tg_g01",
      tournamentId,
      golferId: "g01",
      pointValue: 55,
    });
    expect(storeData.golferRoundScores).toHaveLength(636);
  });

  it("resolves a lowest-round tie on back 9 countback", () => {
    const summary = lowestRoundFor({
      tg_g10: holesWithBackNine([4, 4, 4, 3, 4, 4, 3, 4, 3]),
      tg_g51: holesWithBackNine([3, 4, 3, 4, 3, 4, 4, 3, 4]),
    });

    expect(summary.scoreToPar).toBe(-5);
    expect(summary.golfers.map((golfer) => golfer.golfer.name)).toEqual(["Aaron Rai"]);
    expect(summary.countback).toBe("b9");
  });

  it("falls through to back 6 countback when back 9 is tied", () => {
    const summary = lowestRoundFor({
      tg_g10: holesWithBackNine([3, 3, 3, 4, 4, 4, 4, 4, 4]),
      tg_g51: holesWithBackNine([4, 4, 4, 3, 3, 3, 4, 4, 4]),
    });

    expect(summary.golfers.map((golfer) => golfer.golfer.name)).toEqual(["Aaron Rai"]);
    expect(summary.countback).toBe("b6");
  });

  it("falls through to back 3 countback when back 9 and back 6 are tied", () => {
    const summary = lowestRoundFor({
      tg_g10: holesWithBackNine([3, 3, 3, 3, 3, 3, 5, 5, 5]),
      tg_g51: holesWithBackNine([3, 3, 3, 5, 5, 5, 3, 3, 3]),
    });

    expect(summary.golfers.map((golfer) => golfer.golfer.name)).toEqual(["Aaron Rai"]);
    expect(summary.countback).toBe("b3");
  });

  it("keeps joint winners when countback is still tied", () => {
    const tiedHoles = holesWithBackNine([3, 3, 3, 4, 4, 4, 5, 5, 5]);
    const summary = lowestRoundFor({
      tg_g10: tiedHoles,
      tg_g51: tiedHoles,
    });

    expect(summary.golfers.map((golfer) => golfer.golfer.name)).toEqual([
      "Justin Thomas",
      "Aaron Rai",
    ]);
    expect(summary.countback).toBeNull();
  });
});

function lowestRoundFor(holeScoresByTournamentGolferId: Record<string, number[]>) {
  const store = resetInMemoryStoreForTesting();
  const entry: Entry = {
    id: "entry_test",
    tournamentId,
    userId: "u_player1",
    status: "submitted",
    totalPoints: 58,
    liveScore: null,
    finalScore: null,
    submittedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const pickedIds = ["tg_g10", "tg_g51", "tg_g52", "tg_g53"];
  const picks: EntryPick[] = pickedIds.map((tournamentGolferId, index) => ({
    id: `pick_${index}`,
    entryId: entry.id,
    tournamentGolferId,
    pointValueAtPick: 0,
    isDropped: false,
    isCounting: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  store.entries.push(entry);
  store.entryPicks.push(...picks);
  store.golferRoundScores = store.golferRoundScores.map((round) => {
    if (round.roundNumber !== 4 || !(round.tournamentGolferId in holeScoresByTournamentGolferId)) {
      return round;
    }

    return {
      ...round,
      scoreToPar: -5,
      strokes: 65,
      thru: "18",
      holeScores: holeScoresByTournamentGolferId[round.tournamentGolferId],
      status: "finished",
    } satisfies GolferRoundScore;
  });

  return getLowestRoundSummary(tournamentId);
}

function holesWithBackNine(backNine: number[]) {
  return [4, 4, 4, 4, 4, 4, 4, 4, 4, ...backNine];
}
