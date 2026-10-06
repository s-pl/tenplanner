ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "autoria" varchar(64) DEFAULT 'libre';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "classes_autoria_idx" ON "classes" USING btree ("autoria");