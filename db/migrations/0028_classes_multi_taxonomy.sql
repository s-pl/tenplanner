ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "niveles" jsonb;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "aspectos_juego" jsonb;--> statement-breakpoint
UPDATE "classes"
SET "niveles" = CASE
  WHEN "niveles" IS NULL AND "nivel" IS NOT NULL THEN jsonb_build_array("nivel")
  ELSE "niveles"
END,
"aspectos_juego" = CASE
  WHEN "aspectos_juego" IS NULL AND "aspecto_juego" IS NOT NULL THEN jsonb_build_array("aspecto_juego")
  ELSE "aspectos_juego"
END;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "classes_niveles_gin_idx" ON "classes" USING gin ("niveles");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "classes_aspectos_juego_gin_idx" ON "classes" USING gin ("aspectos_juego");
