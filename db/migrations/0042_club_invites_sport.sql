ALTER TABLE "club_invites" ADD COLUMN "sport" "sport" DEFAULT 'tenis' NOT NULL;--> statement-breakpoint
CREATE INDEX "club_invites_sport_idx" ON "club_invites" USING btree ("sport");