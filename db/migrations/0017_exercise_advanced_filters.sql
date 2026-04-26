-- New enum types for exercise parametrization
CREATE TYPE "public"."ejercicio_formato" AS ENUM ('individual', 'parejas', 'grupal', 'multigrupo');
CREATE TYPE "public"."tipo_actividad" AS ENUM ('tecnico_tactico', 'fisico', 'cognitivo', 'competitivo', 'ludico');
CREATE TYPE "public"."tipo_pelota" AS ENUM ('normal', 'lenta', 'rapida', 'sin_pelota');

-- New columns on exercises
ALTER TABLE "exercises" ADD COLUMN "formato" "ejercicio_formato";
ALTER TABLE "exercises" ADD COLUMN "num_jugadores" integer;
ALTER TABLE "exercises" ADD COLUMN "tipo_pelota" "tipo_pelota";
ALTER TABLE "exercises" ADD COLUMN "tipo_actividad" "tipo_actividad";
ALTER TABLE "exercises" ADD COLUMN "golpes" json;
ALTER TABLE "exercises" ADD COLUMN "efecto" json;

-- Indexes for enum filter columns
CREATE INDEX "exercises_formato_idx" ON "exercises" ("formato");
CREATE INDEX "exercises_tipo_actividad_idx" ON "exercises" ("tipo_actividad");
CREATE INDEX "exercises_tipo_pelota_idx" ON "exercises" ("tipo_pelota");
CREATE INDEX "exercises_num_jugadores_idx" ON "exercises" ("num_jugadores");
