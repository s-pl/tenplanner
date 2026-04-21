CREATE INDEX "dr_planner_chats_user_id_idx" ON "dr_planner_chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dr_planner_chats_updated_at_idx" ON "dr_planner_chats" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "session_exercises_session_id_idx" ON "session_exercises" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_scheduled_at_idx" ON "sessions" USING btree ("scheduled_at");