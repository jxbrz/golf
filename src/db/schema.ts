import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "player"]);
export const organisationRoleEnum = pgEnum("organisation_role", [
  "owner",
  "admin",
  "member",
]);
export const groupRoleEnum = pgEnum("group_role", ["admin", "player"]);
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
export const groupCompetitionStatusEnum = pgEnum("group_competition_status", [
  "setup",
  "picks_open",
  "picks_locked",
  "round_1_loaded",
  "round_2_loaded",
  "cut_processed",
  "round_3_loaded",
  "round_4_loaded",
  "finalised",
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

export const organisations = pgTable("organisations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  billingEmail: text("billing_email"),
  ...timestamps,
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default("player"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const organisationMembers = pgTable("organisation_members", {
  id: text("id").primaryKey(),
  organisationId: text("organisation_id").notNull().references(() => organisations.id),
  userId: text("user_id").notNull().references(() => users.id),
  role: organisationRoleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const groups = pgTable("groups", {
  id: text("id").primaryKey(),
  organisationId: text("organisation_id").notNull().references(() => organisations.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  ...timestamps,
});

export const competitionRuleSets = pgTable("competition_rule_sets", {
  id: text("id").primaryKey(),
  organisationId: text("organisation_id").notNull().references(() => organisations.id),
  name: text("name").notNull(),
  pickCount: integer("pick_count").notNull(),
  budgetPoints: integer("budget_points").notNull(),
  requiredMadeCutCount: integer("required_made_cut_count").notNull(),
  maxActiveAfterCut: integer("max_active_after_cut").notNull(),
  lockPolicy: text("lock_policy").notNull(),
  dropPolicy: text("drop_policy").notNull(),
  lowestRoundEnabled: boolean("lowest_round_enabled").notNull().default(true),
  countbackPolicy: jsonb("countback_policy").notNull(),
  ...timestamps,
});

export const groupMembers = pgTable("group_members", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull().references(() => groups.id),
  userId: text("user_id").notNull().references(() => users.id),
  role: groupRoleEnum("role").notNull().default("player"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tournaments = pgTable("tournaments", {
  id: text("id").primaryKey(),
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

export const groupCompetitions = pgTable("group_competitions", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull().references(() => groups.id),
  tournamentId: text("tournament_id").notNull().references(() => tournaments.id),
  ruleSetId: text("rule_set_id").references(() => competitionRuleSets.id),
  name: text("name").notNull(),
  status: groupCompetitionStatusEnum("status").notNull().default("setup"),
  rosterSize: integer("roster_size").notNull().default(4),
  budget: integer("budget").notNull().default(90),
  picksLockAt: timestamp("picks_lock_at", { withTimezone: true }),
  cutProcessedAt: timestamp("cut_processed_at", { withTimezone: true }),
  finalisedAt: timestamp("finalised_at", { withTimezone: true }),
  currentRound: integer("current_round"),
  ...timestamps,
});

export const golfers = pgTable("golfers", {
  id: text("id").primaryKey(),
  providerPlayerId: text("provider_player_id").notNull().unique(),
  name: text("name").notNull(),
  country: text("country"),
  ...timestamps,
});

export const tournamentGolfers = pgTable("tournament_golfers", {
  id: text("id").primaryKey(),
  tournamentId: text("tournament_id").notNull().references(() => tournaments.id),
  golferId: text("golfer_id").notNull().references(() => golfers.id),
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
  id: text("id").primaryKey(),
  tournamentGolferId: text("tournament_golfer_id")
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
  id: text("id").primaryKey(),
  groupCompetitionId: text("group_competition_id").references(() => groupCompetitions.id),
  tournamentId: text("tournament_id").notNull().references(() => tournaments.id),
  userId: text("user_id").notNull().references(() => users.id),
  status: entryStatusEnum("status").notNull().default("draft"),
  totalPoints: integer("total_points").notNull().default(0),
  liveScore: integer("live_score"),
  finalScore: integer("final_score"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  ...timestamps,
});

export const entryPicks = pgTable("entry_picks", {
  id: text("id").primaryKey(),
  entryId: text("entry_id").notNull().references(() => entries.id),
  tournamentGolferId: text("tournament_golfer_id")
    .notNull()
    .references(() => tournamentGolfers.id),
  pointValueAtPick: integer("point_value_at_pick").notNull(),
  isDropped: boolean("is_dropped").notNull().default(false),
  isCounting: boolean("is_counting").notNull().default(false),
  ...timestamps,
});

export const scoreSyncLogs = pgTable("score_sync_logs", {
  id: text("id").primaryKey(),
  tournamentId: text("tournament_id").notNull().references(() => tournaments.id),
  provider: text("provider").notNull(),
  success: boolean("success").notNull(),
  message: text("message").notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminOverrides = pgTable("admin_overrides", {
  id: text("id").primaryKey(),
  tournamentGolferId: text("tournament_golfer_id")
    .notNull()
    .references(() => tournamentGolfers.id),
  field: text("field").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  reason: text("reason").notNull(),
  createdByUserId: text("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminTeamCorrections = pgTable("admin_team_corrections", {
  id: text("id").primaryKey(),
  entryId: text("entry_id").notNull().references(() => entries.id),
  oldPickIds: text("old_pick_ids").notNull(),
  newPickIds: text("new_pick_ids").notNull(),
  reason: text("reason").notNull(),
  createdByUserId: text("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
