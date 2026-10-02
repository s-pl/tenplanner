ALTER TABLE "exercises" ADD COLUMN "autoria" varchar(64) DEFAULT 'libre';--> statement-breakpoint
CREATE INDEX "exercises_autoria_idx" ON "exercises" USING btree ("autoria");