import { and, asc, eq, gt, inArray, lt, type SQL } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exercises, sessionExercises, sessions, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  createSessionSchema,
  sessionsListQuerySchema,
  zodValidationErrorResponse,
} from "./validation";

function internalServerError() {
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

async function ensureUser(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) {
  if (!user.email) return;
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : user.email;
  await db
    .insert(users)
    .values({ id: user.id, name: metadataName, email: user.email })
    .onConflictDoNothing();
}

async function calculateDuration(
  exerciseItems: { exerciseId: string; durationMinutes?: number | null }[]
): Promise<number> {
  if (exerciseItems.length === 0) return 0;
  const ids = exerciseItems.map((e) => e.exerciseId);
  const rows = await db
    .select({ id: exercises.id, durationMinutes: exercises.durationMinutes })
    .from(exercises)
    .where(inArray(exercises.id, ids));
  const durMap = new Map(rows.map((r) => [r.id, r.durationMinutes]));
  return exerciseItems.reduce((sum, item) => {
    const dur = item.durationMinutes ?? durMap.get(item.exerciseId) ?? 0;
    return sum + dur;
  }, 0);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedQuery = sessionsListQuerySchema.safeParse({
    filter: request.nextUrl.searchParams.get("filter") ?? undefined,
    page: request.nextUrl.searchParams.get("page") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });

  if (!parsedQuery.success) {
    return zodValidationErrorResponse(parsedQuery.error);
  }

  const { filter, page, limit } = parsedQuery.data;
  const offset = (page - 1) * limit;
  const now = new Date();

  const whereConditions: SQL[] = [eq(sessions.userId, user.id)];

  if (filter === "upcoming") {
    whereConditions.push(gt(sessions.scheduledAt, now));
  } else if (filter === "past") {
    whereConditions.push(lt(sessions.scheduledAt, now));
  }

  const whereClause = and(...whereConditions);

  try {
    const sessionRows = await db
      .select()
      .from(sessions)
      .where(whereClause)
      .orderBy(asc(sessions.scheduledAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ total: sessions.id })
      .from(sessions)
      .where(whereClause);
    const total = totalResult.length;

    if (sessionRows.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
      });
    }

    const sessionIds = sessionRows.map((s) => s.id);
    const exerciseRows = await db
      .select({
        sessionId: sessionExercises.sessionId,
        orderIndex: sessionExercises.orderIndex,
        durationMinutes: sessionExercises.durationMinutes,
        notes: sessionExercises.notes,
        exerciseId: exercises.id,
        exerciseName: exercises.name,
        exerciseCategory: exercises.category,
        exerciseDifficulty: exercises.difficulty,
        exerciseDurationMinutes: exercises.durationMinutes,
      })
      .from(sessionExercises)
      .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
      .where(inArray(sessionExercises.sessionId, sessionIds))
      .orderBy(asc(sessionExercises.orderIndex));

    const exercisesBySession = new Map<string, typeof exerciseRows>();
    for (const row of exerciseRows) {
      const list = exercisesBySession.get(row.sessionId) ?? [];
      list.push(row);
      exercisesBySession.set(row.sessionId, list);
    }

    const data = sessionRows.map((session) => ({
      id: session.id,
      title: session.title,
      description: session.description,
      scheduledAt: session.scheduledAt,
      durationMinutes: session.durationMinutes,
      userId: session.userId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      exercises: (exercisesBySession.get(session.id) ?? []).map((e) => ({
        exerciseId: e.exerciseId,
        name: e.exerciseName,
        category: e.exerciseCategory,
        difficulty: e.exerciseDifficulty,
        orderIndex: e.orderIndex,
        durationMinutes: e.durationMinutes ?? e.exerciseDurationMinutes,
        notes: e.notes,
      })),
    }));

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch {
    return internalServerError();
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsedBody = createSessionSchema.safeParse(body);
  if (!parsedBody.success) {
    return zodValidationErrorResponse(parsedBody.error);
  }

  const { title, description, scheduledAt, exercises: exerciseItems } = parsedBody.data;

  try {
    await ensureUser(user);
    const durationMinutes = await calculateDuration(exerciseItems);

    const result = await db.transaction(async (tx) => {
      const [session] = await tx
        .insert(sessions)
        .values({
          title,
          description: description ?? null,
          scheduledAt: new Date(scheduledAt),
          durationMinutes,
          userId: user.id,
        })
        .returning();

      if (exerciseItems.length > 0) {
        await tx.insert(sessionExercises).values(
          exerciseItems.map((item, idx) => ({
            sessionId: session.id,
            exerciseId: item.exerciseId,
            orderIndex: idx,
            durationMinutes: item.durationMinutes ?? null,
            notes: item.notes ?? null,
          }))
        );
      }

      return session;
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch {
    return internalServerError();
  }
}
