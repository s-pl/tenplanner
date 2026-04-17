import { NextResponse } from "next/server";
import { z } from "zod";

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

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(255, "Name must be 255 characters or fewer");

const descriptionSchema = z
  .string()
  .trim()
  .max(2000, "Description must be 2000 characters or fewer");

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
