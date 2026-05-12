-- Exercise library reset + multi-value taxonomy.
-- This intentionally starts the exercise library from zero while keeping
-- sessions/classes themselves alive.

ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "niveles" jsonb;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "aspectos_juego" jsonb;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "parametros" jsonb;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "tipos_actividad" jsonb;--> statement-breakpoint

UPDATE "exercises"
SET
  "niveles" = CASE
    WHEN "niveles" IS NULL AND "nivel" IS NOT NULL THEN jsonb_build_array("nivel")
    ELSE "niveles"
  END,
  "aspectos_juego" = CASE
    WHEN "aspectos_juego" IS NULL AND "aspecto_juego" IS NOT NULL THEN jsonb_build_array("aspecto_juego")
    ELSE "aspectos_juego"
  END,
  "parametros" = CASE
    WHEN "parametros" IS NULL AND "parametro" IS NOT NULL THEN jsonb_build_array("parametro")
    ELSE "parametros"
  END,
  "tipos_actividad" = CASE
    WHEN "tipos_actividad" IS NULL AND "tipologia" IS NOT NULL THEN jsonb_build_array("tipologia")
    WHEN "tipos_actividad" IS NULL AND "tipo_actividad" = 'cognitivo' THEN jsonb_build_array("tipo_actividad"::text)
    ELSE "tipos_actividad"
  END;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "exercises_niveles_gin_idx" ON "exercises" USING gin ("niveles");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exercises_aspectos_juego_gin_idx" ON "exercises" USING gin ("aspectos_juego");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exercises_parametros_gin_idx" ON "exercises" USING gin ("parametros");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exercises_tipos_actividad_gin_idx" ON "exercises" USING gin ("tipos_actividad");--> statement-breakpoint

-- Keep class activity names as free text before exercise_id is nulled by FK.
UPDATE "class_block_exercises" cbe
SET "free_text" = e."name"
FROM "exercises" e
WHERE cbe."exercise_id" = e."id"
  AND cbe."free_text" IS NULL;--> statement-breakpoint

DELETE FROM "ai_document_embeddings"
WHERE "source" = 'exercise';--> statement-breakpoint

DELETE FROM "exercises";--> statement-breakpoint
