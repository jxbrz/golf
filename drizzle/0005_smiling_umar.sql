ALTER TYPE "public"."user_role" ADD VALUE 'owner' BEFORE 'admin';--> statement-breakpoint
INSERT INTO "users" ("id", "name", "email", "role", "created_at")
VALUES ('u_owner', 'Platform Owner', 'owner@majorpicks.local', 'owner', now())
ON CONFLICT ("email") DO UPDATE SET "role" = 'owner';--> statement-breakpoint
UPDATE "users" SET "role" = 'admin' WHERE "email" = 'admin@majorpicks.local' AND "role" = 'owner';
