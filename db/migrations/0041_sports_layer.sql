DO $$ BEGIN
  CREATE TYPE "public"."sport" AS ENUM('tenis', 'padel', 'pickleball');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "sport" "sport" DEFAULT 'tenis' NOT NULL;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "sport" "sport" DEFAULT 'tenis' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "active_sport" "sport" DEFAULT 'tenis' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "classes_sport_idx" ON "classes" USING btree ("sport");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exercises_sport_idx" ON "exercises" USING btree ("sport");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_active_sport_idx" ON "users" USING btree ("active_sport");