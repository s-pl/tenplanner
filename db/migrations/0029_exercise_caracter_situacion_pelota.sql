ALTER TYPE "tipo_pelota" ADD VALUE IF NOT EXISTS 'gomaespuma';--> statement-breakpoint
ALTER TYPE "tipo_pelota" ADD VALUE IF NOT EXISTS 'roja';--> statement-breakpoint
ALTER TYPE "tipo_pelota" ADD VALUE IF NOT EXISTS 'naranja';--> statement-breakpoint
ALTER TYPE "tipo_pelota" ADD VALUE IF NOT EXISTS 'verde';--> statement-breakpoint
ALTER TYPE "tipo_pelota" ADD VALUE IF NOT EXISTS 'amarilla';--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "caracter" jsonb;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "situacion_juego" jsonb;
