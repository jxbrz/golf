CREATE TYPE "public"."group_competition_status" AS ENUM('setup', 'picks_open', 'picks_locked', 'round_1_loaded', 'round_2_loaded', 'cut_processed', 'round_3_loaded', 'round_4_loaded', 'finalised');--> statement-breakpoint
CREATE TABLE "competition_rule_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"organisation_id" text NOT NULL,
	"name" text NOT NULL,
	"pick_count" integer NOT NULL,
	"budget_points" integer NOT NULL,
	"required_made_cut_count" integer NOT NULL,
	"max_active_after_cut" integer NOT NULL,
	"lock_policy" text NOT NULL,
	"drop_policy" text NOT NULL,
	"lowest_round_enabled" boolean DEFAULT true NOT NULL,
	"countback_policy" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_competitions" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "group_competitions" ALTER COLUMN "status" SET DATA TYPE "public"."group_competition_status" USING (
	CASE "status"::text
		WHEN 'draft' THEN 'setup'
		WHEN 'picks_open' THEN 'picks_open'
		WHEN 'picks_locked' THEN 'picks_locked'
		WHEN 'round_1' THEN 'round_1_loaded'
		WHEN 'round_2' THEN 'round_2_loaded'
		WHEN 'cut_pending' THEN 'cut_processed'
		WHEN 'drop_open' THEN 'cut_processed'
		WHEN 'round_3' THEN 'round_3_loaded'
		WHEN 'round_4' THEN 'round_4_loaded'
		WHEN 'final' THEN 'finalised'
		ELSE 'setup'
	END
)::"public"."group_competition_status";--> statement-breakpoint
ALTER TABLE "group_competitions" ALTER COLUMN "status" SET DEFAULT 'setup';--> statement-breakpoint
ALTER TABLE "group_competitions" ADD COLUMN "rule_set_id" text;--> statement-breakpoint
ALTER TABLE "group_competitions" ADD COLUMN "picks_lock_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "group_competitions" ADD COLUMN "cut_processed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "group_competitions" ADD COLUMN "finalised_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "group_competitions" ADD COLUMN "current_round" integer;--> statement-breakpoint
ALTER TABLE "competition_rule_sets" ADD CONSTRAINT "competition_rule_sets_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_competitions" ADD CONSTRAINT "group_competitions_rule_set_id_competition_rule_sets_id_fk" FOREIGN KEY ("rule_set_id") REFERENCES "public"."competition_rule_sets"("id") ON DELETE no action ON UPDATE no action;
