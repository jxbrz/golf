import { describe, expect, it } from "vitest";
import {
  calculateCutStatus,
  calculateEntryPointTotal,
  validateEntryPicks,
} from "./scoring";
import type { EntryWithDetails } from "@/lib/types";

const basePick = (id: string, madeCut: boolean | null, status = "active") =>
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
      totalScore: 0,
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
      basePick("a", true),
      basePick("b", true),
      basePick("c", true),
      basePick("d", true),
    ]);
    expect(result.status).toBe("drop_required");
  });

  it("qualifies four-through-cut entries after one drop", () => {
    const picks = [
      basePick("a", true),
      basePick("b", true),
      basePick("c", true),
      basePick("d", true),
    ];
    picks[0].isDropped = true;
    const result = calculateCutStatus(picks);
    expect(result.status).toBe("qualified");
    expect(result.countingPickIds).toHaveLength(3);
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
