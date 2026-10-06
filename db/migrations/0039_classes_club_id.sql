ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "club_id" uuid;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "classes" ADD CONSTRAINT "classes_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "classes_club_id_idx" ON "classes" USING btree ("club_id");
