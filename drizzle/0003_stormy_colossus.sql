CREATE TYPE "public"."invite_role" AS ENUM('admin', 'player');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."league_status" AS ENUM('draft', 'active', 'complete');--> statement-breakpoint
CREATE TYPE "public"."organisation_type" AS ENUM('golf_club', 'society', 'company', 'school', 'friends', 'other');--> statement-breakpoint
CREATE TABLE "invites" (
	"id" text PRIMARY KEY NOT NULL,
	"organisation_id" text NOT NULL,
	"league_id" text,
	"email" text NOT NULL,
	"invite_code" text NOT NULL,
	"role" "invite_role" DEFAULT 'player' NOT NULL,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	CONSTRAINT "invites_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "league_tournaments" (
	"id" text PRIMARY KEY NOT NULL,
	"league_id" text NOT NULL,
	"tournament_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" text PRIMARY KEY NOT NULL,
	"organisation_id" text NOT NULL,
	"name" text NOT NULL,
	"season_year" integer NOT NULL,
	"status" "league_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organisation_members" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "organisation_members" ALTER COLUMN "role" SET DEFAULT 'player'::text;--> statement-breakpoint
UPDATE "organisation_members" SET "role" = 'player' WHERE "role" = 'member';--> statement-breakpoint
DROP TYPE "public"."organisation_role";--> statement-breakpoint
CREATE TYPE "public"."organisation_role" AS ENUM('owner', 'admin', 'player');--> statement-breakpoint
ALTER TABLE "organisation_members" ALTER COLUMN "role" SET DEFAULT 'player'::"public"."organisation_role";--> statement-breakpoint
ALTER TABLE "organisation_members" ALTER COLUMN "role" SET DATA TYPE "public"."organisation_role" USING "role"::"public"."organisation_role";--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "type" "organisation_type" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "created_by_user_id" text;--> statement-breakpoint
UPDATE "organisations"
SET "created_by_user_id" = COALESCE(
	(
		SELECT "organisation_members"."user_id"
		FROM "organisation_members"
		WHERE "organisation_members"."organisation_id" = "organisations"."id"
		ORDER BY CASE WHEN "organisation_members"."role" = 'owner' THEN 0 WHEN "organisation_members"."role" = 'admin' THEN 1 ELSE 2 END
		LIMIT 1
	),
	(SELECT "users"."id" FROM "users" ORDER BY CASE WHEN "users"."role" = 'admin' THEN 0 ELSE 1 END LIMIT 1)
)
WHERE "created_by_user_id" IS NULL;--> statement-breakpoint
ALTER TABLE "organisations" ALTER COLUMN "created_by_user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_tournaments" ADD CONSTRAINT "league_tournaments_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_tournaments" ADD CONSTRAINT "league_tournaments_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisations" ADD CONSTRAINT "organisations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
