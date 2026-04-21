import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  exercises,
  sessions,
  sessionExercises,
  sessionStudents,
  students,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { SessionDetailClient } from "./session-detail-client";
import {
  computeSessionAnalytics,
  resolveIntensity,
  resolvePhase,
  type AnalyticsExerciseInput,
} from "@/lib/sessions/analytics";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;

  const [[sessionRow], exerciseRows, allExercises, studentRows] =
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
        .orderBy(exercises.name),
      db
        .select({
          id: students.id,
          name: students.name,
          imageUrl: students.imageUrl,
        })
        .from(sessionStudents)
        .innerJoin(students, eq(sessionStudents.studentId, students.id))
        .where(eq(sessionStudents.sessionId, id))
        .orderBy(asc(students.name)),
    ]);

  const session = sessionRow;
  if (!session) notFound();
  if (session.userId !== user.id) notFound();

  const resolvedExercises = exerciseRows.map((e) => ({
    exerciseId: e.exerciseId,
    name: e.name,
    category: e.category,
    difficulty: e.difficulty,
    orderIndex: e.orderIndex,
    durationMinutes: e.durationMinutes ?? e.defaultDurationMinutes,
    notes: e.notes,
  }));

  const analyticsInput: AnalyticsExerciseInput[] = exerciseRows.map((e) => ({
    orderIndex: e.orderIndex,
    durationMinutes: e.durationMinutes ?? e.defaultDurationMinutes,
    category: e.category,
    resolvedPhase: resolvePhase(e.overridePhase, e.exercisePhase),
    resolvedIntensity: resolveIntensity(
      e.overrideIntensity,
      e.exerciseIntensity,
    ),
    name: e.name,
  }));

  const tags = Array.isArray(session.tags) ? session.tags : [];

  const analytics = computeSessionAnalytics(
    analyticsInput,
    studentRows.length,
    tags.length,
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
        intensity: session.intensity,
        tags,
        location: session.location,
      }}
      sessionExercises={resolvedExercises}
      availableExercises={allExercises}
      analytics={analytics}
      students={studentRows}
    />
  );
}
