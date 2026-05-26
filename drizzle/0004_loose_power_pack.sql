CREATE TYPE "public"."organisation_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "organisation_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"organisation_name" text NOT NULL,
	"organisation_type" "organisation_type" DEFAULT 'other' NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"expected_players" integer NOT NULL,
	"message" text,
	"status" "organisation_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_user_id" text
);
--> statement-breakpoint
ALTER TABLE "organisation_requests" ADD CONSTRAINT "organisation_requests_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organisation_members_org_user_unique" ON "organisation_members" USING btree ("organisation_id","user_id");