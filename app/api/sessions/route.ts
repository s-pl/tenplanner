import { and, asc, count, eq, gt, inArray, lt, or, type SQL } from "drizzle-orm";
import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  classes,
  exercises,
  sessionBlockItems,
  sessionBlocks,
  sessionExercises,
  sessionStudents,
  sessions,
  students,
  users,
} from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  createSessionSchema,
  sessionsListQuerySchema,
  zodValidationErrorResponse,
} from "./validation";
import {
  calculateExercisePlanDuration,
  exerciseVisibleToUserCondition,
} from "@/lib/exercise-access";
import { getBooleanSetting, getNumberSetting } from "@/lib/app-settings";
import { embedSession } from "@/lib/ai/semantic-search";

function internalServerError() {
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

async function ensureUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
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

type SessionBlockInput = {
  orderIndex: number;
  title?: string | null;
  notes?: string | null;
  items: Array<{
    exerciseId?: string | null;
    freeText?: string | null;
    durationMinutes?: number | null;
    notes?: string | null;
  }>;
};

type TrainingPhase = "activation" | "main" | "cooldown";

type ExerciseSnapshot = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
};

const BLOCK_TITLE_BY_PHASE: Record<number, string> = {
  1: "Bloque inicial",
  2: "Bloque principal",
  3: "Bloque final",
};

function phaseToBlockOrder(phase?: string | null) {
  if (phase === "activation") return 1;
  if (phase === "cooldown") return 3;
  return 2;
}

function buildBlocksFromExercises(
  exerciseItems: {
    exerciseId: string;
    durationMinutes?: number | null;
    notes?: string | null;
    phase?: string | null;
  }[]
): SessionBlockInput[] {
  const grouped = new Map<number, SessionBlockInput>();
  for (const item of exerciseItems) {
    const orderIndex = phaseToBlockOrder(item.phase);
    const block =
      grouped.get(orderIndex) ??
      ({
        orderIndex,
        title: BLOCK_TITLE_BY_PHASE[orderIndex],
        notes: null,
        items: [],
      } satisfies SessionBlockInput);
    block.items.push({
      exerciseId: item.exerciseId,
      freeText: null,
      durationMinutes: item.durationMinutes ?? null,
      notes: item.notes ?? null,
    });
    grouped.set(orderIndex, block);
  }
  return [1, 2, 3].map(
    (orderIndex) =>
      grouped.get(orderIndex) ?? {
        orderIndex,
        title: BLOCK_TITLE_BY_PHASE[orderIndex],
        notes: null,
        items: [],
      }
  );
}

function sumBlockDuration(blocks: SessionBlockInput[]) {
  return blocks.reduce(
    (sum, block) =>
      sum +
      block.items.reduce(
        (blockSum, item) => blockSum + (item.durationMinutes ?? 0),
        0
      ),
    0
  );
}

function normalizeBlocks(
  blocks: SessionBlockInput[] | null | undefined,
  exerciseItems: {
    exerciseId: string;
    durationMinutes?: number | null;
    notes?: string | null;
    phase?: string | null;
  }[]
) {
  const source =
    blocks && blocks.length > 0 ? blocks : buildBlocksFromExercises(exerciseItems);
  const byOrder = new Map<number, SessionBlockInput>();

  for (const block of source) {
    const orderIndex = block.orderIndex;
    const existing =
      byOrder.get(orderIndex) ??
      ({
        orderIndex,
        title: block.title ?? BLOCK_TITLE_BY_PHASE[orderIndex],
        notes: block.notes ?? null,
        items: [],
      } satisfies SessionBlockInput);

    existing.title =
      block.title ?? existing.title ?? BLOCK_TITLE_BY_PHASE[orderIndex];
    existing.notes = block.notes ?? existing.notes ?? null;
    existing.items.push(...block.items);
    byOrder.set(orderIndex, existing);
  }

  return [1, 2, 3].map(
    (orderIndex) =>
      byOrder.get(orderIndex) ?? {
        orderIndex,
        title: BLOCK_TITLE_BY_PHASE[orderIndex],
        notes: null,
        items: [],
      }
  );
}

function exerciseIdsFromBlocks(blocks: SessionBlockInput[]) {
  return blocks.flatMap((block) =>
    block.items.flatMap((item) => (item.exerciseId ? [item.exerciseId] : []))
  );
}

function blockOrderToPhase(orderIndex: number): TrainingPhase {
  if (orderIndex === 1) return "activation";
  if (orderIndex === 3) return "cooldown";
  return "main";
}

function normalizePhase(phase?: string | null): TrainingPhase | null {
  if (phase === "activation" || phase === "main" || phase === "cooldown") {
    return phase;
  }
  return null;
}

function buildCompatibilityExercises(
  blocks: SessionBlockInput[],
  exerciseItems: {
    exerciseId: string;
    durationMinutes?: number | null;
    notes?: string | null;
    phase?: string | null;
    intensity?: number | null;
  }[]
) {
  if (exerciseItems.length > 0) return exerciseItems;

  return blocks.flatMap((block) =>
    block.items.flatMap((item) =>
      item.exerciseId
        ? [
            {
              exerciseId: item.exerciseId,
              durationMinutes: item.durationMinutes ?? null,
              notes: item.notes ?? null,
              phase: blockOrderToPhase(block.orderIndex),
              intensity: null,
            },
          ]
        : []
    )
  );
}

async function getAccessibleExerciseSnapshots(
  userId: string,
  exerciseIds: string[]
) {
  const uniqueIds = Array.from(new Set(exerciseIds));
  if (uniqueIds.length === 0) {
    return { snapshots: new Map<string, ExerciseSnapshot>(), inaccessibleIds: [] };
  }

  const rows = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      description: exercises.description,
      durationMinutes: exercises.durationMinutes,
    })
    .from(exercises)
    .where(
      and(inArray(exercises.id, uniqueIds), exerciseVisibleToUserCondition(userId))
    );

  const snapshots = new Map(rows.map((row) => [row.id, row]));
  const inaccessibleIds = uniqueIds.filter((id) => !snapshots.has(id));

  return { snapshots, inaccessibleIds };
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

    const [totalRow] = await db
      .select({ total: count() })
      .from(sessions)
      .where(whereClause);
    const total = Number(totalRow?.total ?? 0);

    if (sessionRows.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 0,
        },
      });
    }

    const sessionIds = sessionRows.map((s) => s.id);
    const exerciseRows = await db
      .select({
        sessionId: sessionExercises.sessionId,
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
      objective: session.objective,
      material: session.material,
      observations: session.observations,
      sourceClassId: session.sourceClassId,
      intensity: session.intensity,
      tags: session.tags,
      location: session.location,
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
        phase: e.phase,
        intensity: e.intensity,
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

  const sessionCreationEnabled = await getBooleanSetting(
    "feature.session_creation_enabled"
  );
  if (!sessionCreationEnabled) {
    return NextResponse.json(
      { error: "La creación de sesiones está desactivada." },
      { status: 403 }
    );
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

  const {
    title,
    description,
    scheduledAt,
    durationMinutes: providedDuration,
    objective,
    material,
    observations,
    sourceClassId,
    intensity,
    tags,
    location,
    placeId,
    studentIds,
    exercises: exerciseItems,
    blocks,
  } = parsedBody.data;

  try {
    await ensureUser(user);

    const maxSessionsPerUser = await getNumberSetting(
      "system.max_sessions_per_user",
      0
    );
    if (maxSessionsPerUser > 0) {
      const [currentCount] = await db
        .select({ total: count() })
        .from(sessions)
        .where(eq(sessions.userId, user.id));
      if (Number(currentCount?.total ?? 0) >= maxSessionsPerUser) {
        return NextResponse.json(
          { error: "Has alcanzado el límite de sesiones de tu cuenta." },
          { status: 403 }
        );
      }
    }

    const uniqueStudentIds = Array.from(new Set(studentIds ?? []));
    if (uniqueStudentIds.length > 0) {
      const ownedRows = await db
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            eq(students.coachId, user.id),
            inArray(students.id, uniqueStudentIds)
          )
        );
      if (ownedRows.length !== uniqueStudentIds.length) {
        return NextResponse.json(
          { error: "Algunos alumnos no pertenecen al entrenador" },
          { status: 400 }
        );
      }
    }

    if (sourceClassId) {
      const [sourceClass] = await db
        .select({ id: classes.id })
        .from(classes)
        .where(
          and(
            eq(classes.id, sourceClassId),
            or(eq(classes.isLibrary, true), eq(classes.createdBy, user.id))
          )
        )
        .limit(1);

      if (!sourceClass) {
        return NextResponse.json(
          { error: "La clase de origen no existe o no es accesible" },
          { status: 400 }
        );
      }
    }

    const normalizedBlocks = normalizeBlocks(blocks, exerciseItems);
    const compatibilityExercises = buildCompatibilityExercises(
      normalizedBlocks,
      exerciseItems
    );
    const exerciseIds = [
      ...compatibilityExercises.map((item) => item.exerciseId),
      ...exerciseIdsFromBlocks(normalizedBlocks),
    ];
    const { snapshots, inaccessibleIds } = await getAccessibleExerciseSnapshots(
      user.id,
      exerciseIds
    );

    if (inaccessibleIds.length > 0) {
      return NextResponse.json(
        {
          error: "Algunos ejercicios no existen o no son accesibles",
          inaccessibleExerciseIds: inaccessibleIds,
        },
        { status: 400 }
      );
    }

    const computedDuration =
      calculateExercisePlanDuration(
        compatibilityExercises,
        new Map(
          Array.from(snapshots.values()).map((row) => [
            row.id,
            row.durationMinutes,
          ])
        )
      ) || sumBlockDuration(normalizedBlocks);
    const durationMinutes = providedDuration ?? computedDuration ?? 60;

    const normalizedTags =
      tags && tags.length > 0
        ? Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean)))
        : null;

    const result = await db.transaction(async (tx) => {
      const [session] = await tx
        .insert(sessions)
        .values({
          title,
          description: description ?? null,
          scheduledAt: new Date(scheduledAt),
          durationMinutes,
          userId: user.id,
          objective: objective ?? null,
          material: material ?? null,
          observations: observations ?? null,
          sourceClassId: sourceClassId ?? null,
          intensity: intensity ?? null,
          tags: normalizedTags,
          location: location ?? null,
          placeId: placeId ?? null,
        })
        .returning();

      if (compatibilityExercises.length > 0) {
        await tx.insert(sessionExercises).values(
          compatibilityExercises.map((item, idx) => ({
            sessionId: session.id,
            exerciseId: item.exerciseId,
            orderIndex: idx,
            durationMinutes: item.durationMinutes ?? null,
            notes: item.notes ?? null,
            phase: normalizePhase(item.phase),
            intensity: item.intensity ?? null,
          }))
        );
      }

      for (const block of normalizedBlocks) {
        const [sessionBlock] = await tx
          .insert(sessionBlocks)
          .values({
            sessionId: session.id,
            orderIndex: block.orderIndex,
            title: block.title ?? BLOCK_TITLE_BY_PHASE[block.orderIndex],
            notes: block.notes ?? null,
          })
          .returning({ id: sessionBlocks.id });

        if (block.items.length > 0) {
          await tx.insert(sessionBlockItems).values(
            block.items.map((item, idx) => {
              const snapshot = item.exerciseId
                ? snapshots.get(item.exerciseId)
                : undefined;
              return {
                blockId: sessionBlock.id,
                exerciseId: item.exerciseId ?? null,
                exerciseName: snapshot?.name ?? null,
                exerciseDescription: snapshot?.description ?? null,
                freeText: item.freeText?.trim() || null,
                orderIndex: idx,
                durationMinutes:
                  item.durationMinutes ?? snapshot?.durationMinutes ?? null,
                notes: item.notes ?? null,
              };
            })
          );
        }
      }

      if (uniqueStudentIds.length > 0) {
        await tx.insert(sessionStudents).values(
          uniqueStudentIds.map((studentId) => ({
            sessionId: session.id,
            studentId,
          }))
        );
      }

      return session;
    });

    after(() => embedSession(result.id, user.id).catch(console.error));

    return NextResponse.json({ data: result }, { status: 201 });
  } catch {
    return internalServerError();
  }
}
