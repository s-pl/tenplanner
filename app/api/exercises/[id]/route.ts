import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { exercises, users } from "@/db/schema";
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
    const [exercise] = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        description: exercises.description,
        category: exercises.category,
        difficulty: exercises.difficulty,
        durationMinutes: exercises.durationMinutes,
        objectives: exercises.objectives,
        imageUrl: exercises.imageUrl,
        steps: exercises.steps,
        materials: exercises.materials,
        location: exercises.location,
        videoUrl: exercises.videoUrl,
        tips: exercises.tips,
        createdBy: exercises.createdBy,
        isGlobal: exercises.isGlobal,
        formato: exercises.formato,
        numJugadores: exercises.numJugadores,
        tipoPelota: exercises.tipoPelota,
        tipoActividad: exercises.tipoActividad,
        golpes: exercises.golpes,
        efecto: exercises.efecto,
        variantes: exercises.variantes,
        imageUrls: exercises.imageUrls,
        phase: exercises.phase,
        intensity: exercises.intensity,
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

    const canAccess =
      exercise.isGlobal ||
      exercise.createdBy === null ||
      exercise.createdBy === user.id;

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: exercise });
  } catch {
    return internalServerError();
  }
}

async function getCurrentUserIsAdmin(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return !!row?.isAdmin;
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

  try {
    const [existing] = await db
      .select({
        id: exercises.id,
        isGlobal: exercises.isGlobal,
        createdBy: exercises.createdBy,
        imageUrl: exercises.imageUrl,
        imageUrls: exercises.imageUrls,
      })
      .from(exercises)
      .where(eq(exercises.id, parsedParams.data.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      );
    }

    const isAdmin = await getCurrentUserIsAdmin(user.id);

    if (existing.isGlobal && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (
      !existing.isGlobal &&
      existing.createdBy &&
      existing.createdBy !== user.id &&
      !isAdmin
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const d = parsedBody.data;
    const finalImageUrl =
      d.imageUrl !== undefined ? (d.imageUrl ?? null) : existing.imageUrl;
    const finalImageUrls =
      d.imageUrls !== undefined
        ? (d.imageUrls ?? null)
        : ((existing.imageUrls as string[] | null) ?? null);
    const totalImages =
      (finalImageUrl ? 1 : 0) + (finalImageUrls?.length ?? 0);

    if (totalImages > 4) {
      return NextResponse.json(
        { error: "Solo se permiten 4 imágenes por ejercicio" },
        { status: 400 }
      );
    }

    const updateValues: Record<string, unknown> = {};

    const fields = [
      "name",
      "description",
      "category",
      "difficulty",
      "durationMinutes",
      "objectives",
      "imageUrl",
      "tips",
      "location",
      "videoUrl",
      "steps",
      "materials",
      "phase",
      "intensity",
      "formato",
      "numJugadores",
      "tipoPelota",
      "tipoActividad",
      "golpes",
      "efecto",
      "variantes",
      "imageUrls",
    ] as const;

    for (const field of fields) {
      if (d[field] !== undefined) {
        updateValues[field] = d[field];
      }
    }

    if (isAdmin && d.isGlobal !== undefined) {
      updateValues.isGlobal = d.isGlobal;
    }

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
    const [existing] = await db
      .select({
        id: exercises.id,
        isGlobal: exercises.isGlobal,
        createdBy: exercises.createdBy,
      })
      .from(exercises)
      .where(eq(exercises.id, parsedParams.data.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      );
    }

    const isAdmin = await getCurrentUserIsAdmin(user.id);

    if (existing.isGlobal && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (
      !existing.isGlobal &&
      existing.createdBy &&
      existing.createdBy !== user.id &&
      !isAdmin
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
