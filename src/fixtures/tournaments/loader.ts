import fieldFixture from "./pga-championship-2026/field.json";
import expectedResultsFixture from "./pga-championship-2026/expected-results.json";
import roundScoresFixture from "./pga-championship-2026/round-scores.json";
import tournamentFixture from "./pga-championship-2026/tournament.json";
import type {
  Golfer,
  GolferRoundScore,
  GolferStatus,
  MajorKey,
  Tournament,
  TournamentGolfer,
  TournamentStatus,
} from "@/lib/types";

const PGA_CHAMPIONSHIP_2026_SLUG = "pga-championship-2026";

type RoundNumber = 1 | 2 | 3 | 4;

type FieldFixtureRow = {
  id: string;
  name: string;
  country: string | null;
  pointValue: number | null;
};

type RoundScoreFixtureRow = {
  golferId: string;
  rounds: [number, number, number, number];
  holeScores?: Partial<Record<string, number[]>>;
};

type ExpectedResultsFixture = {
  coursePar: number;
  cutLineAfterRoundTwo: number;
  lowestRoundCountbackOrder: string[];
};

export type LoadedTournamentFixture = {
  tournament: Omit<Tournament, "createdAt" | "updatedAt">;
  field: FieldFixtureRow[];
  roundScores: RoundScoreFixtureRow[];
  expectedResults: ExpectedResultsFixture;
  roundScoreFixtures: Map<string, readonly [number, number, number, number]>;
  roundHoleFixtures: Map<string, Partial<Record<RoundNumber, number[]>>>;
};

export function loadTournamentFixture(slug = PGA_CHAMPIONSHIP_2026_SLUG): LoadedTournamentFixture {
  if (slug !== PGA_CHAMPIONSHIP_2026_SLUG) {
    throw new Error(`Tournament fixture not found: ${slug}`);
  }

  const roundScores = roundScoresFixture as RoundScoreFixtureRow[];
  return {
    tournament: {
      ...tournamentFixture,
      majorKey: tournamentFixture.majorKey as MajorKey,
      status: tournamentFixture.status as TournamentStatus,
    },
    field: fieldFixture as FieldFixtureRow[],
    roundScores,
    expectedResults: expectedResultsFixture,
    roundScoreFixtures: new Map(
      roundScores.map((row) => [row.golferId, row.rounds] as const),
    ),
    roundHoleFixtures: new Map(
      roundScores
        .filter((row) => row.holeScores && Object.keys(row.holeScores).length > 0)
        .map((row) => [
          row.golferId,
          Object.fromEntries(
            Object.entries(row.holeScores ?? {}).map(([roundNumber, scores]) => [
              Number(roundNumber) as RoundNumber,
              scores,
            ]),
          ) as Partial<Record<RoundNumber, number[]>>,
        ]),
    ),
  };
}

export function createFixtureStoreData(slug: string, timestamp: string) {
  const fixture = loadTournamentFixture(slug);
  const tournament: Tournament = {
    ...fixture.tournament,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const golfers: Golfer[] = fixture.field.map((golfer) => ({
    id: golfer.id,
    providerPlayerId: `mock-${golfer.id}`,
    name: golfer.name,
    country: golfer.country,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
  const tournamentGolfers: TournamentGolfer[] = fixture.field.map((golfer) => ({
    id: `tg_${golfer.id}`,
    tournamentId: tournament.id,
    golferId: golfer.id,
    pointValue: golfer.pointValue,
    position: null,
    totalScore: null,
    todayScore: null,
    round: null,
    thru: null,
    madeCut: null,
    status: "active" as GolferStatus,
    lastSyncedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
  const golferRoundScores: GolferRoundScore[] = tournamentGolfers.flatMap((golfer) =>
    [1, 2, 3, 4].map((roundNumber) => ({
      id: `rs_${golfer.id}_${roundNumber}`,
      tournamentGolferId: golfer.id,
      roundNumber: roundNumber as RoundNumber,
      scoreToPar: null,
      strokes: null,
      thru: null,
      status: "active" as GolferStatus,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
  );

  return {
    tournament,
    golfers,
    tournamentGolfers,
    golferRoundScores,
  };
}
