export type Role = "owner" | "admin" | "player";
export type MajorKey = "masters" | "pga" | "us_open" | "the_open";
export type TournamentStatus =
  | "draft"
  | "picks_open"
  | "picks_locked"
  | "round_1"
  | "round_2"
  | "cut_pending"
  | "drop_open"
  | "round_3"
  | "round_4"
  | "final";
export type EntryStatus =
  | "draft"
  | "submitted"
  | "qualified"
  | "drop_required"
  | "eliminated"
  | "final";
export type GolferStatus = "active" | "cut" | "wd" | "dq" | "finished";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

export type Tournament = {
  id: string;
  name: string;
  majorKey: MajorKey;
  year: number;
  venue: string;
  startDate: string;
  endDate: string;
  pickDeadline: string;
  dropDeadline: string;
  status: TournamentStatus;
  providerTournamentId: string;
  createdAt: string;
  updatedAt: string;
};

export type Golfer = {
  id: string;
  providerPlayerId: string;
  name: string;
  country: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TournamentGolfer = {
  id: string;
  tournamentId: string;
  golferId: string;
  pointValue: number | null;
  position: string | null;
  totalScore: number | null;
  todayScore: number | null;
  round: number | null;
  thru: string | null;
  madeCut: boolean | null;
  status: GolferStatus;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GolferRoundScore = {
  id: string;
  tournamentGolferId: string;
  roundNumber: 1 | 2 | 3 | 4;
  scoreToPar: number | null;
  strokes: number | null;
  thru: string | null;
  holeScores?: number[] | null;
  status: GolferStatus;
  createdAt: string;
  updatedAt: string;
};

export type Entry = {
  id: string;
  tournamentId: string;
  userId: string;
  status: EntryStatus;
  totalPoints: number;
  liveScore: number | null;
  finalScore: number | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EntryPick = {
  id: string;
  entryId: string;
  tournamentGolferId: string;
  pointValueAtPick: number;
  isDropped: boolean;
  isCounting: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminTeamCorrection = {
  id: string;
  entryId: string;
  oldPickIds: string;
  newPickIds: string;
  reason: string;
  createdByUserId: string;
  createdAt: string;
};

export type LeaderboardPlayer = {
  providerPlayerId: string;
  name: string;
  position: string | null;
  totalScore: number | null;
  todayScore: number | null;
  round: number | null;
  thru: string | null;
  madeCut: boolean | null;
  status: GolferStatus;
  lastUpdated: string;
  rounds?: Array<{
    roundNumber: 1 | 2 | 3 | 4;
    scoreToPar: number | null;
    strokes: number | null;
    thru: string | null;
    status: GolferStatus;
  }>;
};

export type ProviderLeaderboard = {
  players: LeaderboardPlayer[];
  roundId: number | null;
  status: string | null;
  roundStatus: string | null;
  cutScore: number | null;
  lastUpdated: string | null;
};

export type ProviderRoundScorecard = {
  roundNumber: 1 | 2 | 3 | 4;
  scoreToPar: number | null;
  strokes: number | null;
  thru: string | null;
  holeScores: number[] | null;
};

export type EntryWithDetails = Entry & {
  user: User;
  picks: Array<
    EntryPick & {
      tournamentGolfer: TournamentGolfer & { golfer: Golfer };
    }
  >;
};

export type LeaderboardRow = {
  rank: number;
  entry: EntryWithDetails;
  score: number | null;
  status: EntryStatus;
  madeCutCount: number;
  needsDrop: boolean;
};

export type AdminEntryRow = {
  user: User;
  entry: EntryWithDetails | null;
};

export type LowestRoundSummary = {
  scoreToPar: number | null;
  roundNumber: number | null;
  golfers: Array<TournamentGolfer & { golfer: Golfer }>;
  pickedBy: User[];
  countback: "b3" | "b6" | "b9" | "b18" | null;
};
