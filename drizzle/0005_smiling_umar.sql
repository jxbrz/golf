ALTER TYPE "public"."user_role" ADD VALUE 'owner' BEFORE 'admin';--> statement-breakpoint
UPDATE "users" SET "role" = 'owner' WHERE "email" = 'admin@majorpicks.local';
