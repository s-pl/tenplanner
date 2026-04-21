import { NextResponse } from "next/server";
import { z } from "zod";

export const genderSchema = z.enum(["male", "female", "other"]);
export const dominantHandSchema = z.enum(["left", "right"]);
export const playerLevelSchema = z.enum([
  "beginner",
  "amateur",
  "intermediate",
  "advanced",
  "competitive",
]);

export const studentIdParamsSchema = z.object({
  id: z.string().uuid("El ID del alumno debe ser un UUID válido"),
});

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)");

export const createStudentSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(255, "Máximo 255 caracteres"),
  email: z.string().trim().email("Email inválido").max(255).optional().nullable().or(z.literal("")),
  gender: genderSchema.optional().nullable(),
  birthDate: dateStringSchema.optional().nullable(),
  heightCm: z.coerce.number().int().min(50, "Mínimo 50 cm").max(250, "Máximo 250 cm").optional().nullable(),
  weightKg: z.coerce.number().int().min(20, "Mínimo 20 kg").max(250, "Máximo 250 kg").optional().nullable(),
  dominantHand: dominantHandSchema.optional().nullable(),
  playerLevel: playerLevelSchema.optional().nullable(),
  yearsExperience: z.coerce.number().int().min(0).max(80).optional().nullable(),
  notes: z.string().trim().max(2000, "Máximo 2000 caracteres").optional().nullable(),
  imageUrl: z.string().trim().max(1000).optional().nullable(),
});

export const updateStudentSchema = createStudentSchema
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
