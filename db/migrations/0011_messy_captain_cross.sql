CREATE INDEX "exercises_created_by_name_idx" ON "exercises" USING btree ("created_by","name");--> statement-breakpoint
CREATE INDEX "exercises_is_global_idx" ON "exercises" USING btree ("is_global");