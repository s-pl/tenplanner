import { NextResponse } from "next/server";
import { z } from "zod";

const phaseEnum = z.enum(["activation", "main", "cooldown"]);

const exerciseItemSchema = z.object({
  exerciseId: z.string().uuid("El ID del ejercicio debe ser un UUID válido"),
  durationMinutes: z
    .number()
    .int()
    .min(1, "Mínimo 1 minuto")
    .max(300, "Máximo 300 minutos")
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(1000, "Máximo 1000 caracteres")
    .optional()
    .nullable(),
  phase: phaseEnum.optional().nullable(),
  intensity: z
    .number()
    .int()
    .min(1, "La intensidad debe ser 1-5")
    .max(5, "La intensidad debe ser 1-5")
    .optional()
    .nullable(),
});

const tagsSchema = z
  .array(z.string().trim().min(1).max(30, "Máximo 30 caracteres por etiqueta"))
  .max(10, "Máximo 10 etiquetas")
  .optional()
  .nullable();

const intensitySchema = z
  .number()
  .int()
  .min(1, "La intensidad debe ser 1-5")
  .max(5, "La intensidad debe ser 1-5")
  .optional()
  .nullable();

const locationSchema = z
  .string()
  .trim()
  .max(50, "Máximo 50 caracteres")
  .optional()
  .nullable();

const studentIdsSchema = z
  .array(z.string().uuid("ID de alumno inválido"))
  .optional()
  .default([]);

export const sessionIdParamsSchema = z.object({
  id: z.string().uuid("Session ID must be a valid UUID"),
});

export const sessionsListQuerySchema = z.object({
  filter: z.enum(["all", "upcoming", "past"]).default("all"),
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be 100 or fewer")
    .default(20),
});

export const createSessionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "El título es obligatorio")
    .max(255, "Máximo 255 caracteres"),
  description: z
    .string()
    .trim()
    .max(2000, "Máximo 2000 caracteres")
    .optional()
    .nullable(),
  scheduledAt: z.string().datetime("Debe ser una fecha/hora ISO válida"),
  durationMinutes: z
    .number()
    .int()
    .min(1, "Mínimo 1 minuto")
    .max(600, "Máximo 600 minutos")
    .optional(),
  objective: z
    .string()
    .trim()
    .max(2000, "Máximo 2000 caracteres")
    .optional()
    .nullable(),
  intensity: intensitySchema,
  tags: tagsSchema,
  location: locationSchema,
  studentIds: studentIdsSchema,
  exercises: z.array(exerciseItemSchema).default([]),
});

export const updateSessionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "El título es obligatorio")
      .max(255, "Máximo 255 caracteres")
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, "Máximo 2000 caracteres")
      .optional()
      .nullable(),
    scheduledAt: z
      .string()
      .datetime("Debe ser una fecha/hora ISO válida")
      .optional(),
    durationMinutes: z
      .number()
      .int()
      .min(1, "Mínimo 1 minuto")
      .max(600, "Máximo 600 minutos")
      .optional(),
    objective: z
      .string()
      .trim()
      .max(2000, "Máximo 2000 caracteres")
      .optional()
      .nullable(),
    intensity: intensitySchema,
    tags: tagsSchema,
    location: locationSchema,
    studentIds: z.array(z.string().uuid("ID de alumno inválido")).optional(),
    exercises: z.array(exerciseItemSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
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
