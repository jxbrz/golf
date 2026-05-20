CREATE TYPE "public"."entry_status" AS ENUM('draft', 'submitted', 'qualified', 'drop_required', 'eliminated', 'final');--> statement-breakpoint
CREATE TYPE "public"."golfer_status" AS ENUM('active', 'cut', 'wd', 'dq', 'finished');--> statement-breakpoint
CREATE TYPE "public"."major_key" AS ENUM('masters', 'pga', 'us_open', 'the_open');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('draft', 'picks_open', 'picks_locked', 'round_1', 'round_2', 'cut_pending', 'drop_open', 'round_3', 'round_4', 'final');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'player');--> statement-breakpoint
CREATE TABLE "admin_overrides" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_golfer_id" text NOT NULL,
	"field" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"reason" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_team_corrections" (
	"id" text PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"old_pick_ids" text NOT NULL,
	"new_pick_ids" text NOT NULL,
	"reason" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" "entry_status" DEFAULT 'draft' NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"live_score" integer,
	"final_score" integer,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry_picks" (
	"id" text PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"tournament_golfer_id" text NOT NULL,
	"point_value_at_pick" integer NOT NULL,
	"is_dropped" boolean DEFAULT false NOT NULL,
	"is_counting" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "golfer_round_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_golfer_id" text NOT NULL,
	"round_number" integer NOT NULL,
	"score_to_par" integer,
	"strokes" integer,
	"thru" text,
	"hole_scores" text,
	"status" "golfer_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "golfers" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_player_id" text NOT NULL,
	"name" text NOT NULL,
	"country" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "golfers_provider_player_id_unique" UNIQUE("provider_player_id")
);
--> statement-breakpoint
CREATE TABLE "score_sync_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"provider" text NOT NULL,
	"success" boolean NOT NULL,
	"message" text NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_golfers" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"golfer_id" text NOT NULL,
	"point_value" integer,
	"position" text,
	"total_score" integer,
	"today_score" integer,
	"round" integer,
	"thru" text,
	"made_cut" boolean,
	"status" "golfer_status" DEFAULT 'active' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"major_key" "major_key" NOT NULL,
	"year" integer NOT NULL,
	"venue" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"pick_deadline" timestamp with time zone NOT NULL,
	"drop_deadline" timestamp with time zone NOT NULL,
	"status" "tournament_status" DEFAULT 'draft' NOT NULL,
	"provider_tournament_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'player' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admin_overrides" ADD CONSTRAINT "admin_overrides_tournament_golfer_id_tournament_golfers_id_fk" FOREIGN KEY ("tournament_golfer_id") REFERENCES "public"."tournament_golfers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_overrides" ADD CONSTRAINT "admin_overrides_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_team_corrections" ADD CONSTRAINT "admin_team_corrections_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_team_corrections" ADD CONSTRAINT "admin_team_corrections_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_picks" ADD CONSTRAINT "entry_picks_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_picks" ADD CONSTRAINT "entry_picks_tournament_golfer_id_tournament_golfers_id_fk" FOREIGN KEY ("tournament_golfer_id") REFERENCES "public"."tournament_golfers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "golfer_round_scores" ADD CONSTRAINT "golfer_round_scores_tournament_golfer_id_tournament_golfers_id_fk" FOREIGN KEY ("tournament_golfer_id") REFERENCES "public"."tournament_golfers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_sync_logs" ADD CONSTRAINT "score_sync_logs_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_golfers" ADD CONSTRAINT "tournament_golfers_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_golfers" ADD CONSTRAINT "tournament_golfers_golfer_id_golfers_id_fk" FOREIGN KEY ("golfer_id") REFERENCES "public"."golfers"("id") ON DELETE no action ON UPDATE no action;