-- PMV 260506: nueva taxonomía ejercicios + entidades Clases y Lugares + extras alumnos/sesiones.
-- Cambios aditivos. Mantiene compatibilidad con datos existentes.

-- ---------------------------------------------------------------
-- 1. Lugares (Pista 1, Pista 2, Gimnasio…)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "places" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "coach_id" uuid NOT NULL,
  "name" varchar(120) NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "places_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "places_coach_id_idx" ON "places" USING btree ("coach_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "places_coach_name_uniq" ON "places" USING btree ("coach_id","name");--> statement-breakpoint

-- ---------------------------------------------------------------
-- 2. Sesiones: place_id + status_note
-- ---------------------------------------------------------------
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "place_id" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "status_note" text;--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_place_id_places_id_fk";--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_place_id_idx" ON "sessions" USING btree ("place_id");--> statement-breakpoint

-- ---------------------------------------------------------------
-- 3. Ejercicios: nueva taxonomía PMV (aditivo, no toca columnas existentes)
-- ---------------------------------------------------------------
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "nivel" varchar(32);--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "aspecto_juego" varchar(16);--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "parametro" varchar(16);--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "tipologia" varchar(16);--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "duracion_rango" varchar(16);--> statement-breakpoint

-- ---------------------------------------------------------------
-- 4. Alumnos: phone, year_started_tennis, preferred_schedule
-- ---------------------------------------------------------------
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "year_started_tennis" integer;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "phone" varchar(32);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "preferred_schedule" text;--> statement-breakpoint

-- ---------------------------------------------------------------
-- 5. Clases (biblioteca de plantillas reutilizables)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "classes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_by" uuid,
  "name" varchar(255) NOT NULL,
  "duracion_minutes" integer NOT NULL,
  "alumnos_tipo" varchar(16),
  "objetivos" text,
  "material" text,
  "video_url" text,
  "aspectos_importantes" text,
  "nivel" varchar(32),
  "aspecto_juego" varchar(16),
  "golpes" json,
  "is_library" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "classes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "classes_created_by_idx" ON "classes" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "classes_is_library_idx" ON "classes" USING btree ("is_library");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "classes_nivel_idx" ON "classes" USING btree ("nivel");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "classes_name_idx" ON "classes" USING btree ("name");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "class_blocks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "class_id" uuid NOT NULL,
  "order_index" integer NOT NULL,
  "title" varchar(120),
  "notes" text,
  CONSTRAINT "class_blocks_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "class_blocks_class_order_uniq" ON "class_blocks" USING btree ("class_id","order_index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_blocks_class_id_idx" ON "class_blocks" USING btree ("class_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "class_block_exercises" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "block_id" uuid NOT NULL,
  "exercise_id" uuid,
  "free_text" text,
  "order_index" integer NOT NULL,
  "duration_minutes" integer,
  CONSTRAINT "class_block_exercises_block_id_class_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."class_blocks"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "class_block_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_block_exercises_block_id_idx" ON "class_block_exercises" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_block_exercises_block_order_idx" ON "class_block_exercises" USING btree ("block_id","order_index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_block_exercises_exercise_id_idx" ON "class_block_exercises" USING btree ("exercise_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "class_favorites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "class_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "class_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "class_favorites_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "class_favorites_user_class_uniq" ON "class_favorites" USING btree ("user_id","class_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_favorites_user_id_idx" ON "class_favorites" USING btree ("user_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "class_drafts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "payload" json NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "class_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_drafts_user_updated_at_idx" ON "class_drafts" USING btree ("user_id","updated_at");
