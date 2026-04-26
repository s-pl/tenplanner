import { and, asc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  exercises,
  sessionExercises,
  sessionStudents,
  sessions,
  students,
} from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  sessionIdParamsSchema,
  updateSessionSchema,
  zodValidationErrorResponse,
} from "../validation";
import {
  calculateExercisePlanDuration,
  getAccessibleExerciseDurationMap,
} from "@/lib/exercise-access";

function internalServerError() {
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

async function calculateDuration(
  userId: string,
  exerciseItems: { exerciseId: string; durationMinutes?: number | null }[]
): Promise<{ duration: number; inaccessibleIds: string[] }> {
  const { durationById, inaccessibleIds } =
    await getAccessibleExerciseDurationMap(
      userId,
      exerciseItems.map((item) => item.exerciseId)
    );
  return {
    duration: calculateExercisePlanDuration(exerciseItems, durationById),
    inaccessibleIds,
  };
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const parsedParams = sessionIdParamsSchema.safeParse(params);
  if (!parsedParams.success) {
    return zodValidationErrorResponse(parsedParams.error);
  }

  const { id } = parsedParams.data;

  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, user.id)))
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const exerciseRows = await db
      .select({
        orderIndex: sessionExercises.orderIndex,
        durationMinutes: sessionExercises.durationMinutes,
        notes: sessionExercises.notes,
        phase: sessionExercises.phase,
        intensity: sessionExercises.intensity,
        exerciseId: exercises.id,
        exerciseName: exercises.name,
        exerciseCategory: exercises.category,
        exerciseDifficulty: exercises.difficulty,
        exerciseDurationMinutes: exercises.durationMinutes,
      })
      .from(sessionExercises)
      .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
      .where(eq(sessionExercises.sessionId, id))
      .orderBy(asc(sessionExercises.orderIndex));

    const studentRows = await db
      .select({
        id: students.id,
        name: students.name,
        imageUrl: students.imageUrl,
      })
      .from(sessionStudents)
      .innerJoin(students, eq(sessionStudents.studentId, students.id))
      .where(eq(sessionStudents.sessionId, id));

    return NextResponse.json({
      data: {
        id: session.id,
        title: session.title,
        description: session.description,
        scheduledAt: session.scheduledAt,
        durationMinutes: session.durationMinutes,
        userId: session.userId,
        objective: session.objective,
        intensity: session.intensity,
        tags: session.tags,
        location: session.location,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        exercises: exerciseRows.map((e) => ({
          exerciseId: e.exerciseId,
          name: e.exerciseName,
          category: e.exerciseCategory,
          difficulty: e.exerciseDifficulty,
          orderIndex: e.orderIndex,
          durationMinutes: e.durationMinutes ?? e.exerciseDurationMinutes,
          notes: e.notes,
          phase: e.phase,
          intensity: e.intensity,
        })),
        students: studentRows,
      },
    });
  } catch {
    return internalServerError();
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const parsedParams = sessionIdParamsSchema.safeParse(params);
  if (!parsedParams.success) {
    return zodValidationErrorResponse(parsedParams.error);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsedBody = updateSessionSchema.safeParse(body);
  if (!parsedBody.success) {
    return zodValidationErrorResponse(parsedBody.error);
  }

  const { id } = parsedParams.data;

  try {
    const [existing] = await db
      .select({ userId: sessions.userId })
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      exercises: exerciseItems,
      studentIds,
      tags,
      ...sessionFields
    } = parsedBody.data;

    if (studentIds !== undefined) {
      const unique = Array.from(new Set(studentIds));
      if (unique.length > 0) {
        const ownedRows = await db
          .select({ id: students.id })
          .from(students)
          .where(
            and(eq(students.coachId, user.id), inArray(students.id, unique))
          );
        if (ownedRows.length !== unique.length) {
          return NextResponse.json(
            { error: "Algunos alumnos no pertenecen al entrenador" },
            { status: 400 }
          );
        }
      }
    }

    const updateValues: Record<string, unknown> = {};
    if (sessionFields.title !== undefined)
      updateValues.title = sessionFields.title;
    if (sessionFields.description !== undefined)
      updateValues.description = sessionFields.description;
    if (sessionFields.scheduledAt !== undefined)
      updateValues.scheduledAt = new Date(sessionFields.scheduledAt);
    if (sessionFields.objective !== undefined)
      updateValues.objective = sessionFields.objective;
    if (sessionFields.intensity !== undefined)
      updateValues.intensity = sessionFields.intensity;
    if (sessionFields.location !== undefined)
      updateValues.location = sessionFields.location;
    if (tags !== undefined) {
      updateValues.tags =
        tags && tags.length > 0
          ? Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean)))
          : null;
    }

    let exerciseAccess:
      | { duration: number; inaccessibleIds: string[] }
      | undefined;
    if (exerciseItems !== undefined) {
      exerciseAccess = await calculateDuration(user.id, exerciseItems);
      if (exerciseAccess.inaccessibleIds.length > 0) {
        return NextResponse.json(
          { error: "Algunos ejercicios no existen o no son accesibles" },
          { status: 400 }
        );
      }
    }

    if (sessionFields.durationMinutes !== undefined) {
      updateValues.durationMinutes = sessionFields.durationMinutes;
    } else if (exerciseItems !== undefined) {
      updateValues.durationMinutes = exerciseAccess?.duration ?? 0;
    }

    const updatedSession = await db.transaction(async (tx) => {
      const [session] = await tx
        .update(sessions)
        .set(updateValues)
        .where(and(eq(sessions.id, id), eq(sessions.userId, user.id)))
        .returning();

      if (exerciseItems !== undefined) {
        await tx
          .delete(sessionExercises)
          .where(eq(sessionExercises.sessionId, id));

        if (exerciseItems.length > 0) {
          await tx.insert(sessionExercises).values(
            exerciseItems.map((item, idx) => ({
              sessionId: id,
              exerciseId: item.exerciseId,
              orderIndex: idx,
              durationMinutes: item.durationMinutes ?? null,
              notes: item.notes ?? null,
              phase: item.phase ?? null,
              intensity: item.intensity ?? null,
            }))
          );
        }
      }

      if (studentIds !== undefined) {
        const unique = Array.from(new Set(studentIds));
        await tx
          .delete(sessionStudents)
          .where(eq(sessionStudents.sessionId, id));
        if (unique.length > 0) {
          await tx
            .insert(sessionStudents)
            .values(unique.map((studentId) => ({ sessionId: id, studentId })));
        }
      }

      return session;
    });

    return NextResponse.json({ data: updatedSession });
  } catch {
    return internalServerError();
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const parsedParams = sessionIdParamsSchema.safeParse(params);
  if (!parsedParams.success) {
    return zodValidationErrorResponse(parsedParams.error);
  }

  const { id } = parsedParams.data;

  try {
    const [existing] = await db
      .select({ userId: sessions.userId })
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(sessions).where(eq(sessions.id, id));

    return NextResponse.json({ ok: true });
  } catch {
    return internalServerError();
  }
}
