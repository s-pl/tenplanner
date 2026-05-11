-- PMV racket sports: session snapshots, class lists, neutral student history.

ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "year_started_racket_sports" integer;--> statement-breakpoint
UPDATE "students"
SET "year_started_racket_sports" = "year_started_tennis"
WHERE "year_started_racket_sports" IS NULL
  AND "year_started_tennis" IS NOT NULL;--> statement-breakpoint

ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "num_alumnos" integer;--> statement-breakpoint

ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "material" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "observations" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "source_class_id" uuid;--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_source_class_id_classes_id_fk";--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_source_class_id_classes_id_fk"
  FOREIGN KEY ("source_class_id") REFERENCES "public"."classes"("id")
  ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_source_class_id_idx" ON "sessions" USING btree ("source_class_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "session_blocks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL,
  "order_index" integer NOT NULL,
  "title" varchar(120),
  "notes" text,
  CONSTRAINT "session_blocks_session_id_sessions_id_fk"
    FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id")
    ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "session_blocks_session_order_uniq" ON "session_blocks" USING btree ("session_id","order_index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_blocks_session_id_idx" ON "session_blocks" USING btree ("session_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "session_block_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "block_id" uuid NOT NULL,
  "exercise_id" uuid,
  "exercise_name" varchar(255),
  "exercise_description" text,
  "free_text" text,
  "order_index" integer NOT NULL,
  "duration_minutes" integer,
  "notes" text,
  CONSTRAINT "session_block_items_block_id_session_blocks_id_fk"
    FOREIGN KEY ("block_id") REFERENCES "public"."session_blocks"("id")
    ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "session_block_items_exercise_id_exercises_id_fk"
    FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id")
    ON DELETE set null ON UPDATE no action
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_block_items_block_id_idx" ON "session_block_items" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_block_items_block_order_idx" ON "session_block_items" USING btree ("block_id","order_index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_block_items_exercise_id_idx" ON "session_block_items" USING btree ("exercise_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "class_lists" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "emoji" varchar(10) DEFAULT 'CL',
  "is_default" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "class_lists_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_lists_user_id_idx" ON "class_lists" USING btree ("user_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "class_list_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "list_id" uuid NOT NULL,
  "class_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "class_list_items_list_id_class_lists_id_fk"
    FOREIGN KEY ("list_id") REFERENCES "public"."class_lists"("id")
    ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "class_list_items_class_id_classes_id_fk"
    FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id")
    ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "class_list_items_list_class_uniq" ON "class_list_items" USING btree ("list_id","class_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_list_items_list_id_idx" ON "class_list_items" USING btree ("list_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_list_items_class_id_idx" ON "class_list_items" USING btree ("class_id");
