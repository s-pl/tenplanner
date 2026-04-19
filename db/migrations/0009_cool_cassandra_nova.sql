ALTER TABLE "students" ADD COLUMN "profile_token" varchar(128);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "profile_token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_profile_token_unique" UNIQUE("profile_token");