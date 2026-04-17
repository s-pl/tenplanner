import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  exerciseIdParamsSchema,
  updateExerciseSchema,
  zodValidationErrorResponse,
} from "../validation";

function internalServerError() {
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

type ExerciseRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ExerciseRouteContext) {
  const params = await context.params;
  const parsedParams = exerciseIdParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    return zodValidationErrorResponse(parsedParams.error);
  }

  try {
    const [exercise] = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        description: exercises.description,
        category: exercises.category,
        difficulty: exercises.difficulty,
        durationMinutes: exercises.durationMinutes,
        createdBy: exercises.createdBy,
        createdAt: exercises.createdAt,
        updatedAt: exercises.updatedAt,
      })
      .from(exercises)
      .where(eq(exercises.id, parsedParams.data.id))
      .limit(1);

    if (!exercise) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: exercise });
  } catch {
    return internalServerError();
  }
}

export async function PUT(request: Request, context: ExerciseRouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const parsedParams = exerciseIdParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    return zodValidationErrorResponse(parsedParams.error);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsedBody = updateExerciseSchema.safeParse(body);

  if (!parsedBody.success) {
    return zodValidationErrorResponse(parsedBody.error);
  }

  const updateValues: {
    name?: string;
    description?: string | null;
    category?: "technique" | "tactics" | "fitness" | "warm-up";
    difficulty?: "beginner" | "intermediate" | "advanced";
    durationMinutes?: number;
  } = {};

  if (parsedBody.data.name !== undefined) {
    updateValues.name = parsedBody.data.name;
  }

  if (parsedBody.data.description !== undefined) {
    updateValues.description = parsedBody.data.description;
  }

  if (parsedBody.data.category !== undefined) {
    updateValues.category = parsedBody.data.category;
  }

  if (parsedBody.data.difficulty !== undefined) {
    updateValues.difficulty = parsedBody.data.difficulty;
  }

  if (parsedBody.data.durationMinutes !== undefined) {
    updateValues.durationMinutes = parsedBody.data.durationMinutes;
  }

  try {
    const [updatedExercise] = await db
      .update(exercises)
      .set(updateValues)
      .where(eq(exercises.id, parsedParams.data.id))
      .returning();

    if (!updatedExercise) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updatedExercise });
  } catch {
    return internalServerError();
  }
}

export async function DELETE(_request: Request, context: ExerciseRouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const parsedParams = exerciseIdParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    return zodValidationErrorResponse(parsedParams.error);
  }

  try {
    const [deletedExercise] = await db
      .delete(exercises)
      .where(eq(exercises.id, parsedParams.data.id))
      .returning({ id: exercises.id });

    if (!deletedExercise) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return internalServerError();
  }
}
