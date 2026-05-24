import { describe, expect, it } from "vitest";
import {
  calculateLiveEntryScore,
  calculateCutStatus,
  calculateEntryPointTotal,
  validateEntryPicks,
  selectAutomaticDropPick,
} from "./scoring";
import type { EntryWithDetails } from "@/lib/types";

const basePick = (
  id: string,
  madeCut: boolean | null,
  status = "active",
  totalScore = 0,
) =>
  ({
    id,
    entryId: "entry",
    tournamentGolferId: id,
    pointValueAtPick: 20,
    isDropped: false,
    isCounting: false,
    createdAt: "",
    updatedAt: "",
    tournamentGolfer: {
      id,
      tournamentId: "t",
      golferId: id,
      pointValue: 20,
      position: null,
      totalScore,
      todayScore: 0,
      round: 2,
      thru: "F",
      madeCut,
      status,
      lastSyncedAt: null,
      createdAt: "",
      updatedAt: "",
      golfer: {
        id,
        providerPlayerId: id,
        name: id,
        country: "USA",
        createdAt: "",
        updatedAt: "",
      },
    },
  }) as EntryWithDetails["picks"][number];

describe("scoring", () => {
  it("invalidates teams over 90 points", () => {
    expect(
      validateEntryPicks([
        { id: "a", pointValue: 30 },
        { id: "b", pointValue: 30 },
        { id: "c", pointValue: 20 },
        { id: "d", pointValue: 15 },
      ]).valid,
    ).toBe(false);
  });

  it("accepts four-player teams at or under 90 points", () => {
    const result = validateEntryPicks([
      { id: "a", pointValue: 30 },
      { id: "b", pointValue: 25 },
      { id: "c", pointValue: 20 },
      { id: "d", pointValue: 15 },
    ]);
    expect(result.valid).toBe(true);
    expect(calculateEntryPointTotal(result.errors.map((id) => ({ id })))).toBe(0);
  });

  it("eliminates entries with only two players through the cut", () => {
    const result = calculateCutStatus([
      basePick("a", true),
      basePick("b", true),
      basePick("c", false, "cut"),
      basePick("d", false, "cut"),
    ]);
    expect(result.status).toBe("eliminated");
  });

  it("qualifies entries with exactly three players through the cut", () => {
    const result = calculateCutStatus([
      basePick("a", true),
      basePick("b", true),
      basePick("c", true),
      basePick("d", false, "cut"),
    ]);
    expect(result.status).toBe("qualified");
    expect(result.countingPickIds).toHaveLength(3);
  });

  it("requires a drop when all four players make the cut", () => {
    const result = calculateCutStatus([
      basePick("a", true, "active", -2),
      basePick("b", true, "active", -1),
      basePick("c", true, "active", 0),
      basePick("d", true, "active", 1),
    ]);
    expect(result.status).toBe("drop_required");
    expect(result.countingPickIds).toEqual([]);
  });

  it("selects the worst scoring made-cut player for automatic drop", () => {
    const result = selectAutomaticDropPick([
      basePick("a", true, "active", -2),
      basePick("b", true, "active", -1),
      basePick("c", true, "active", 0),
      basePick("d", true, "active", 3),
    ]);
    expect(result?.id).toBe("d");
  });

  it("does not auto-select a drop when only three players make the cut", () => {
    const result = selectAutomaticDropPick([
      basePick("a", true, "active", -2),
      basePick("b", true, "active", -1),
      basePick("c", true, "active", 0),
      basePick("d", false, "cut", 3),
    ]);
    expect(result).toBeNull();
  });

  it("counts the remaining three after a player is dropped", () => {
    const dropped = basePick("d", true, "active", 1);
    dropped.isDropped = true;
    const result = calculateCutStatus([
      basePick("a", true, "active", -2),
      basePick("b", true, "active", -1),
      basePick("c", true, "active", 0),
      dropped,
    ]);
    expect(result.status).toBe("qualified");
    expect(result.countingPickIds).toEqual(["a", "b", "c"]);
  });

  it("never counts a dropped player even if stale counting flags say otherwise", () => {
    const dropped = basePick("a", true, "active", -9);
    dropped.isDropped = true;
    dropped.isCounting = true;
    const picks = [
      dropped,
      basePick("b", true, "active", -1),
      basePick("c", true, "active", 2),
      basePick("d", true, "active", 3),
    ];
    picks[1].isCounting = true;
    picks[2].isCounting = true;
    picks[3].isCounting = true;

    const score = calculateLiveEntryScore(
      {
        id: "entry",
        tournamentId: "t",
        userId: "u",
        status: "qualified",
        totalPoints: 80,
        liveScore: null,
        finalScore: null,
        submittedAt: "",
        createdAt: "",
        updatedAt: "",
        user: {
          id: "u",
          name: "User",
          email: "u@example.com",
          role: "player",
          createdAt: "",
        },
        picks,
      },
      { status: "round_4" },
    );

    expect(score).toBe(4);
  });

  it("uses the best three live scores for the group score", () => {
    const picks = [
      basePick("a", true, "active", -2),
      basePick("b", true, "active", -1),
      basePick("c", true, "active", 0),
      basePick("d", true, "active", 1),
    ];
    const score = calculateLiveEntryScore(
      {
        id: "entry",
        tournamentId: "t",
        userId: "u",
        status: "submitted",
        totalPoints: 80,
        liveScore: null,
        finalScore: null,
        submittedAt: "",
        createdAt: "",
        updatedAt: "",
        user: {
          id: "u",
          name: "User",
          email: "u@example.com",
          role: "player",
          createdAt: "",
        },
        picks,
      },
      { status: "round_1" },
    );
    expect(score).toBe(-3);
  });

  it("handles withdrawn and disqualified players as not made cut unless overridden", () => {
    const result = calculateCutStatus([
      basePick("a", true),
      basePick("b", true),
      basePick("c", false, "wd"),
      basePick("d", false, "dq"),
    ]);
    expect(result.status).toBe("eliminated");
  });
});
