import { NextResponse } from "next/server";
import { z } from "zod";

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
});

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
