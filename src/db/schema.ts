import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "player"]);
export const majorKeyEnum = pgEnum("major_key", [
  "masters",
  "pga",
  "us_open",
  "the_open",
]);
export const tournamentStatusEnum = pgEnum("tournament_status", [
  "draft",
  "picks_open",
  "picks_locked",
  "round_1",
  "round_2",
  "cut_pending",
  "drop_open",
  "round_3",
  "round_4",
  "final",
]);
export const entryStatusEnum = pgEnum("entry_status", [
  "draft",
  "submitted",
  "qualified",
  "drop_required",
  "eliminated",
  "final",
]);
export const golferStatusEnum = pgEnum("golfer_status", [
  "active",
  "cut",
  "wd",
  "dq",
  "finished",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default("player"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tournaments = pgTable("tournaments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  majorKey: majorKeyEnum("major_key").notNull(),
  year: integer("year").notNull(),
  venue: text("venue").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  pickDeadline: timestamp("pick_deadline", { withTimezone: true }).notNull(),
  dropDeadline: timestamp("drop_deadline", { withTimezone: true }).notNull(),
  status: tournamentStatusEnum("status").notNull().default("draft"),
  providerTournamentId: text("provider_tournament_id").notNull(),
  ...timestamps,
});

export const golfers = pgTable("golfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerPlayerId: text("provider_player_id").notNull().unique(),
  name: text("name").notNull(),
  country: text("country"),
  ...timestamps,
});

export const tournamentGolfers = pgTable("tournament_golfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tournamentId: uuid("tournament_id").notNull().references(() => tournaments.id),
  golferId: uuid("golfer_id").notNull().references(() => golfers.id),
  pointValue: integer("point_value"),
  position: text("position"),
  totalScore: integer("total_score"),
  todayScore: integer("today_score"),
  round: integer("round"),
  thru: text("thru"),
  madeCut: boolean("made_cut"),
  status: golferStatusEnum("status").notNull().default("active"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  ...timestamps,
});

export const golferRoundScores = pgTable("golfer_round_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  tournamentGolferId: uuid("tournament_golfer_id")
    .notNull()
    .references(() => tournamentGolfers.id),
  roundNumber: integer("round_number").notNull(),
  scoreToPar: integer("score_to_par"),
  strokes: integer("strokes"),
  thru: text("thru"),
  holeScores: text("hole_scores"),
  status: golferStatusEnum("status").notNull().default("active"),
  ...timestamps,
});

export const entries = pgTable("entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tournamentId: uuid("tournament_id").notNull().references(() => tournaments.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  status: entryStatusEnum("status").notNull().default("draft"),
  totalPoints: integer("total_points").notNull().default(0),
  liveScore: integer("live_score"),
  finalScore: integer("final_score"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  ...timestamps,
});

export const entryPicks = pgTable("entry_picks", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryId: uuid("entry_id").notNull().references(() => entries.id),
  tournamentGolferId: uuid("tournament_golfer_id")
    .notNull()
    .references(() => tournamentGolfers.id),
  pointValueAtPick: integer("point_value_at_pick").notNull(),
  isDropped: boolean("is_dropped").notNull().default(false),
  isCounting: boolean("is_counting").notNull().default(false),
  ...timestamps,
});

export const scoreSyncLogs = pgTable("score_sync_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tournamentId: uuid("tournament_id").notNull().references(() => tournaments.id),
  provider: text("provider").notNull(),
  success: boolean("success").notNull(),
  message: text("message").notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminOverrides = pgTable("admin_overrides", {
  id: uuid("id").primaryKey().defaultRandom(),
  tournamentGolferId: uuid("tournament_golfer_id")
    .notNull()
    .references(() => tournamentGolfers.id),
  field: text("field").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  reason: text("reason").notNull(),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminTeamCorrections = pgTable("admin_team_corrections", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryId: uuid("entry_id").notNull().references(() => entries.id),
  oldPickIds: text("old_pick_ids").notNull(),
  newPickIds: text("new_pick_ids").notNull(),
  reason: text("reason").notNull(),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
