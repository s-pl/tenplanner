CREATE TYPE "public"."sport" AS ENUM('tenis', 'padel', 'pickleball', 'tenis_playa');--> statement-breakpoint
DROP INDEX "club_members_club_user_uniq";--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "sport" "sport" DEFAULT 'tenis' NOT NULL;--> statement-breakpoint
ALTER TABLE "club_members" ADD COLUMN "sport" "sport" DEFAULT 'tenis' NOT NULL;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "sport" "sport" DEFAULT 'tenis' NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "sport" "sport" DEFAULT 'tenis' NOT NULL;--> statement-breakpoint
ALTER TABLE "session_templates" ADD COLUMN "sport" "sport" DEFAULT 'tenis' NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "sport" "sport" DEFAULT 'tenis' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "active_sport" "sport" DEFAULT 'tenis' NOT NULL;--> statement-breakpoint
CREATE INDEX "classes_sport_idx" ON "classes" USING btree ("sport");--> statement-breakpoint
CREATE UNIQUE INDEX "club_members_club_user_sport_uniq" ON "club_members" USING btree ("club_id","user_id","sport");--> statement-breakpoint
CREATE INDEX "club_members_sport_idx" ON "club_members" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "exercises_sport_idx" ON "exercises" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "groups_sport_idx" ON "groups" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "session_templates_sport_idx" ON "session_templates" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "sessions_sport_idx" ON "sessions" USING btree ("sport");