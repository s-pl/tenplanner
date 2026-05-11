import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  exercises,
  sessions,
  sessionBlockItems,
  sessionBlocks,
  sessionExercises,
  sessionStudents,
  students,
  exerciseListItems,
  exerciseLists,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { SessionDetailClient } from "./session-detail-client";
import {
  computeSessionAnalytics,
  resolveIntensity,
  resolvePhase,
  type AnalyticsExerciseInput,
} from "@/lib/sessions/analytics";
import { exerciseVisibleToUserCondition } from "@/lib/exercise-access";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { session: authSession },
  } = await supabase.auth.getSession();
  const user = authSession?.user ?? null;

  if (!user) redirect("/login");

  const { id } = await params;

  const [[sessionRow], exerciseRows, allExercises, studentRows, favRows, blockRows] =
    await Promise.all([
      db.select().from(sessions).where(eq(sessions.id, id)).limit(1),
      db
        .select({
          exerciseId: exercises.id,
          name: exercises.name,
          category: exercises.category,
          difficulty: exercises.difficulty,
          orderIndex: sessionExercises.orderIndex,
          durationMinutes: sessionExercises.durationMinutes,
          defaultDurationMinutes: exercises.durationMinutes,
          notes: sessionExercises.notes,
          overridePhase: sessionExercises.phase,
          overrideIntensity: sessionExercises.intensity,
          exercisePhase: exercises.phase,
          exerciseIntensity: exercises.intensity,
          coachRating: sessionExercises.coachRating,
          actualDurationSeconds: sessionExercises.actualDurationSeconds,
          completedAt: sessionExercises.completedAt,
          executionNotes: sessionExercises.executionNotes,
          wasSkipped: sessionExercises.wasSkipped,
          materials: exercises.materials,
        })
        .from(sessionExercises)
        .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
        .where(eq(sessionExercises.sessionId, id))
        .orderBy(asc(sessionExercises.orderIndex)),
      db
        .select({
          id: exercises.id,
          name: exercises.name,
          category: exercises.category,
          difficulty: exercises.difficulty,
          durationMinutes: exercises.durationMinutes,
        })
        .from(exercises)
        .where(exerciseVisibleToUserCondition(user.id))
        .orderBy(exercises.name)
        .limit(200),
      db
        .select({
          id: students.id,
          name: students.name,
          imageUrl: students.imageUrl,
          attended: sessionStudents.attended,
          rating: sessionStudents.rating,
          feedback: sessionStudents.feedback,
        })
        .from(sessionStudents)
        .innerJoin(students, eq(sessionStudents.studentId, students.id))
        .where(eq(sessionStudents.sessionId, id))
        .orderBy(asc(students.name)),
      db
        .select({ exerciseId: exerciseListItems.exerciseId })
        .from(exerciseListItems)
        .innerJoin(
          exerciseLists,
          eq(exerciseLists.id, exerciseListItems.listId)
        )
        .where(eq(exerciseLists.userId, user.id)),
      db
        .select({
          blockId: sessionBlocks.id,
          blockOrderIndex: sessionBlocks.orderIndex,
          blockTitle: sessionBlocks.title,
          blockNotes: sessionBlocks.notes,
          itemId: sessionBlockItems.id,
          itemOrderIndex: sessionBlockItems.orderIndex,
          itemExerciseId: sessionBlockItems.exerciseId,
          itemExerciseName: sessionBlockItems.exerciseName,
          itemExerciseDescription: sessionBlockItems.exerciseDescription,
          itemFreeText: sessionBlockItems.freeText,
          itemDurationMinutes: sessionBlockItems.durationMinutes,
          itemNotes: sessionBlockItems.notes,
        })
        .from(sessionBlocks)
        .leftJoin(sessionBlockItems, eq(sessionBlockItems.blockId, sessionBlocks.id))
        .where(eq(sessionBlocks.sessionId, id))
        .orderBy(asc(sessionBlocks.orderIndex), asc(sessionBlockItems.orderIndex)),
    ]);

  const session = sessionRow;
  if (!session) notFound();
  if (session.userId !== user.id) notFound();

  const favoritedIds = new Set(favRows.map((f) => f.exerciseId));

  const resolvedExercises = exerciseRows.map((e) => ({
    exerciseId: e.exerciseId,
    name: e.name,
    category: e.category,
    difficulty: e.difficulty,
    orderIndex: e.orderIndex,
    durationMinutes: e.durationMinutes ?? e.defaultDurationMinutes,
    notes: e.notes,
    coachRating: e.coachRating,
    actualDurationSeconds: e.actualDurationSeconds,
    completedAt: e.completedAt ? e.completedAt.toISOString() : null,
    executionNotes: e.executionNotes,
    wasSkipped: e.wasSkipped,
    materials: Array.isArray(e.materials) ? e.materials : [],
  }));

  const analyticsInput: AnalyticsExerciseInput[] = exerciseRows.map((e) => ({
    orderIndex: e.orderIndex,
    durationMinutes: e.durationMinutes ?? e.defaultDurationMinutes,
    category: e.category,
    difficulty: e.difficulty,
    resolvedPhase: resolvePhase(e.overridePhase, e.exercisePhase),
    resolvedIntensity: resolveIntensity(
      e.overrideIntensity,
      e.exerciseIntensity
    ),
    name: e.name,
  }));

  const tags = Array.isArray(session.tags) ? session.tags : [];

  const sessionBlocksData = blockRows.reduce<
    Array<{
      id: string;
      orderIndex: number;
      title: string | null;
      notes: string | null;
      items: Array<{
        id: string;
        orderIndex: number;
        exerciseId: string | null;
        exerciseName: string | null;
        exerciseDescription: string | null;
        freeText: string | null;
        durationMinutes: number | null;
        notes: string | null;
      }>;
    }>
  >((blocks, row) => {
    let block = blocks.find((candidate) => candidate.id === row.blockId);
    if (!block) {
      block = {
        id: row.blockId,
        orderIndex: row.blockOrderIndex,
        title: row.blockTitle,
        notes: row.blockNotes,
        items: [],
      };
      blocks.push(block);
    }
    if (row.itemId) {
      block.items.push({
        id: row.itemId,
        orderIndex: row.itemOrderIndex ?? 0,
        exerciseId: row.itemExerciseId,
        exerciseName: row.itemExerciseName,
        exerciseDescription: row.itemExerciseDescription,
        freeText: row.itemFreeText,
        durationMinutes: row.itemDurationMinutes,
        notes: row.itemNotes,
      });
    }
    return blocks;
  }, []);

  const analytics = computeSessionAnalytics(
    analyticsInput,
    studentRows.length,
    tags.length
  );

  return (
    <SessionDetailClient
      session={{
        id: session.id,
        title: session.title,
        description: session.description,
        scheduledAt: session.scheduledAt.toISOString(),
        durationMinutes: session.durationMinutes,
        userId: session.userId,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        objective: session.objective,
        material: session.material,
        observations: session.observations,
        sourceClassId: session.sourceClassId,
        intensity: session.intensity,
        tags,
        location: session.location,
        status: session.status,
      }}
      sessionExercises={resolvedExercises}
      availableExercises={allExercises}
      analytics={analytics}
      students={studentRows}
      favoritedExerciseIds={Array.from(favoritedIds)}
      sessionBlocks={sessionBlocksData}
    />
  );
}
