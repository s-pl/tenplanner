import { NextResponse } from "next/server";
import { z } from "zod";
import { isAllowedImageUrl, isPublicHttpUrl } from "@/lib/url-safety";

export const exerciseCategorySchema = z.enum([
  "technique",
  "tactics",
  "fitness",
  "warm-up",
]);

export const difficultySchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

export const trainingPhaseSchema = z.enum(["activation", "main", "cooldown"]);

export const ejercicioFormatoSchema = z.enum([
  "individual",
  "parejas",
  "grupal",
  "multigrupo",
]);

export const tipoActividadSchema = z.enum([
  "tecnico_tactico",
  "fisico",
  "cognitivo",
  "competitivo",
  "ludico",
]);

export const tipoPelotaSchema = z.enum([
  "normal",
  "lenta",
  "rapida",
  "sin_pelota",
]);

export const GOLPES_VALUES = [
  "derecha",
  "reves",
  "saque",
  "volea",
  "remate",
  "dejada",
  "globo",
  // Legacy values still accepted for backwards compatibility:
  "smash",
  "bandeja",
  "volea_dcha",
  "volea_rev",
  "bajada_pared",
  "vibora",
  "chiquita",
] as const;

export const NIVEL_PMV_VALUES = [
  "descubrimiento",
  "desarrollo",
  "consolidacion",
  "especializacion",
  "precompeticion",
  "competicion",
  "adultos_iniciacion",
  "adultos_medio_alto",
] as const;

export const ASPECTO_JUEGO_VALUES = [
  "tecnica",
  "tactica",
  "mental",
  "fisico",
] as const;

export const PARAMETRO_VALUES = [
  "altura",
  "profundidad",
  "velocidad",
  "direccion",
] as const;

export const TIPOLOGIA_VALUES = ["juego", "reto", "otros_deportes"] as const;

export const DURACION_RANGO_VALUES = [
  "1-5",
  "5-10",
  "10-15",
  "15-20",
  "+20",
] as const;

export const nivelPmvSchema = z.enum(NIVEL_PMV_VALUES);
export const aspectoJuegoSchema = z.enum(ASPECTO_JUEGO_VALUES);
export const parametroSchema = z.enum(PARAMETRO_VALUES);
export const tipologiaSchema = z.enum(TIPOLOGIA_VALUES);
export const duracionRangoSchema = z.enum(DURACION_RANGO_VALUES);

export const LOCATION_VALUES = [
  "pista",
  "pared",
  "playa",
  "casa",
  // Legacy:
  "indoor",
  "outdoor",
  "any",
] as const;

export const locationSchema = z.enum(LOCATION_VALUES);

export const EFECTO_VALUES = [
  "liftado",
  "cortado",
  "plano",
  "sin_efecto",
] as const;

export const golpeSchema = z.enum(GOLPES_VALUES);
export const efectoSchema = z.enum(EFECTO_VALUES);

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(255, "Name must be 255 characters or fewer");

const descriptionSchema = z
  .string()
  .trim()
  .max(2000, "Description must be 2000 characters or fewer");

const imageUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .refine(isAllowedImageUrl, {
    message:
      "La URL de imagen debe ser http(s) y pertenecer a Supabase, Pexels, Google o GitHub.",
  });

const optionalImageUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .refine((value) => value === "" || isAllowedImageUrl(value), {
    message:
      "La URL de imagen debe ser http(s) y pertenecer a Supabase, Pexels, Google o GitHub.",
  });

const optionalPublicUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || isPublicHttpUrl(value), {
    message: "La URL debe ser http(s) y no puede apuntar a una red local.",
  });

export const exerciseIdParamsSchema = z.object({
  id: z.string().uuid("Exercise id must be a valid UUID"),
});

export const exercisesListQuerySchema = z.object({
  category: exerciseCategorySchema.optional(),
  search: z
    .string()
    .trim()
    .min(1, "Search query cannot be empty")
    .max(255, "Search query must be 255 characters or fewer")
    .optional(),
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be 100 or fewer")
    .default(10),
  formato: ejercicioFormatoSchema.optional(),
  numJugadores: z.coerce.number().int().min(1).max(20).optional(),
  tipoPelota: tipoPelotaSchema.optional(),
  tipoActividad: tipoActividadSchema.optional(),
  golpe: z
    .union([golpeSchema, z.array(golpeSchema)])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional(),
  efecto: z
    .union([efectoSchema, z.array(efectoSchema)])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional(),
  minDuracion: z.coerce.number().int().min(1).optional(),
  maxDuracion: z.coerce.number().int().min(1).optional(),
  location: locationSchema.optional(),
  phase: trainingPhaseSchema.optional(),
  intensity: z.coerce.number().int().min(1).max(5).optional(),
  nivel: nivelPmvSchema.optional(),
  aspectoJuego: aspectoJuegoSchema.optional(),
  parametro: parametroSchema.optional(),
  tipologia: tipologiaSchema.optional(),
  duracionRango: duracionRangoSchema.optional(),
});

export const createExerciseSchema = z.object({
  name: nameSchema,
  description: descriptionSchema.optional().nullable(),
  category: exerciseCategorySchema,
  difficulty: difficultySchema,
  durationMinutes: z
    .number()
    .int()
    .min(1, "Duration must be at least 1 minute")
    .max(300, "Duration must be 300 minutes or fewer"),
  objectives: descriptionSchema.optional().nullable(),
  tips: descriptionSchema.optional().nullable(),
  imageUrl: optionalImageUrlSchema.optional().nullable(),
  location: locationSchema.optional().nullable(),
  videoUrl: optionalPublicUrlSchema.optional().nullable(),
  phase: trainingPhaseSchema.optional().nullable(),
  intensity: z
    .number()
    .int()
    .min(1, "La intensidad mínima es 1")
    .max(5, "La intensidad máxima es 5")
    .optional()
    .nullable(),
  formato: ejercicioFormatoSchema.optional().nullable(),
  numJugadores: z.number().int().min(1).max(6).optional().nullable(),
  tipoPelota: tipoPelotaSchema.optional().nullable(),
  tipoActividad: tipoActividadSchema.optional().nullable(),
  golpes: z.array(golpeSchema).max(15).optional().nullable(),
  efecto: z.array(efectoSchema).max(5).optional().nullable(),
  variantes: z.string().trim().max(2000).optional().nullable(),
  imageUrls: z.array(imageUrlSchema).max(4).optional().nullable(),
  isGlobal: z.boolean().optional(),
  nivel: nivelPmvSchema.optional().nullable(),
  aspectoJuego: aspectoJuegoSchema.optional().nullable(),
  parametro: parametroSchema.optional().nullable(),
  tipologia: tipologiaSchema.optional().nullable(),
  duracionRango: duracionRangoSchema.optional().nullable(),
  steps: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).default(""),
      })
    )
    .max(25)
    .optional()
    .nullable(),
  materials: z.array(z.string().min(1).max(100)).max(30).optional().nullable(),
});

export const updateExerciseSchema = createExerciseSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required for update",
  });

export function zodValidationErrorResponse(error: z.ZodError) {
  return NextResponse.json(
    {
      error: "Validation failed",
      details: error.issues.map((issue) => ({
        path: issue.path.length > 0 ? issue.path.join(".") : "request",
        message: issue.message,
        code: issue.code,
      })),
    },
    { status: 400 }
  );
}
