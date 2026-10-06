ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "active_club_id" uuid;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_active_club_id_clubs_id_fk" FOREIGN KEY ("active_club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_active_club_id_idx" ON "users" USING btree ("active_club_id");
