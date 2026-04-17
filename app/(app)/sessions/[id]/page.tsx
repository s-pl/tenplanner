import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { exercises, sessions, sessionExercises } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { SessionDetailClient } from "./session-detail-client";

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

  let session;
  try {
    const result = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);
    session = result[0];
  } catch {
    notFound();
  }

  if (!session) notFound();
  if (session.userId !== user.id) notFound();

  const exerciseRows = await db
    .select({
      exerciseId: exercises.id,
      name: exercises.name,
      category: exercises.category,
      difficulty: exercises.difficulty,
      orderIndex: sessionExercises.orderIndex,
      durationMinutes: sessionExercises.durationMinutes,
      defaultDurationMinutes: exercises.durationMinutes,
      notes: sessionExercises.notes,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .where(eq(sessionExercises.sessionId, id))
    .orderBy(asc(sessionExercises.orderIndex));

  const allExercises = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      category: exercises.category,
      difficulty: exercises.difficulty,
      durationMinutes: exercises.durationMinutes,
    })
    .from(exercises)
    .orderBy(exercises.name);

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
      }}
      sessionExercises={exerciseRows.map((e) => ({
        exerciseId: e.exerciseId,
        name: e.name,
        category: e.category,
        difficulty: e.difficulty,
        orderIndex: e.orderIndex,
        durationMinutes: e.durationMinutes ?? e.defaultDurationMinutes,
        notes: e.notes,
      }))}
      availableExercises={allExercises}
    />
  );
}
