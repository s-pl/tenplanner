CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "sessions_title_trgm_idx" ON "sessions" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "exercises_name_trgm_idx" ON "exercises" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "dr_planner_chats_user_updated_at_idx" ON "dr_planner_chats" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "exercises_created_by_idx" ON "exercises" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "exercises_category_created_at_idx" ON "exercises" USING btree ("category","created_at");--> statement-breakpoint
CREATE INDEX "exercises_name_idx" ON "exercises" USING btree ("name");--> statement-breakpoint
CREATE INDEX "session_exercises_session_order_idx" ON "session_exercises" USING btree ("session_id","order_index");--> statement-breakpoint
CREATE INDEX "session_students_student_id_idx" ON "session_students" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "sessions_user_scheduled_at_idx" ON "sessions" USING btree ("user_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "students_coach_name_idx" ON "students" USING btree ("coach_id","name");