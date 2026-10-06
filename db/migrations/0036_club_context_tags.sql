ALTER TABLE "calendar_events" ADD COLUMN "club_id" uuid;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "club_id" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "club_id" uuid;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "club_id" uuid;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_events_club_id_idx" ON "calendar_events" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "groups_club_id_idx" ON "groups" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "sessions_club_id_idx" ON "sessions" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "students_club_id_idx" ON "students" USING btree ("club_id");--> statement-breakpoint

-- ─── Extend RLS so a club owner can reach items explicitly tagged with
-- their club (club_id), without widening access to a coach's untagged
-- ("particular") work. The coach keeps full access to everything of
-- theirs regardless of tag. ─────────────────────────────────────────────

-- ALTER POLICY (not DROP+CREATE) keeps the original policy name/identity.
ALTER POLICY "sessions_owner_all" ON sessions
  USING (user_id = auth.uid() OR (club_id IS NOT NULL AND is_active_club_owner(club_id)))
  WITH CHECK (user_id = auth.uid() OR (club_id IS NOT NULL AND is_active_club_owner(club_id)));--> statement-breakpoint

ALTER POLICY "students_coach_all" ON students
  USING (coach_id = auth.uid() OR (club_id IS NOT NULL AND is_active_club_owner(club_id)))
  WITH CHECK (coach_id = auth.uid() OR (club_id IS NOT NULL AND is_active_club_owner(club_id)));--> statement-breakpoint

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON groups TO authenticated;--> statement-breakpoint
CREATE POLICY "groups_coach_or_club_all" ON groups
  FOR ALL
  USING (coach_id = auth.uid() OR (club_id IS NOT NULL AND is_active_club_owner(club_id)))
  WITH CHECK (coach_id = auth.uid() OR (club_id IS NOT NULL AND is_active_club_owner(club_id)));--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_events TO authenticated;--> statement-breakpoint
CREATE POLICY "calendar_events_owner_or_club_all" ON calendar_events
  FOR ALL
  USING (user_id = auth.uid() OR (club_id IS NOT NULL AND is_active_club_owner(club_id)))
  WITH CHECK (user_id = auth.uid() OR (club_id IS NOT NULL AND is_active_club_owner(club_id)));