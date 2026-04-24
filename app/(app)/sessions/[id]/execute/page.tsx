import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { exercises, sessions, sessionExercises } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ExecuteSessionClient } from "./execute-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExecuteSessionPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { session: authSession },
  } = await supabase.auth.getSession();
  const user = authSession?.user ?? null;
  if (!user) redirect("/login");

  const { id } = await params;

  const [[sessionRow], exerciseRows] = await Promise.all([
    db.select().from(sessions).where(eq(sessions.id, id)).limit(1),
    db
      .select({
        exerciseId: exercises.id,
        name: exercises.name,
        category: exercises.category,
        difficulty: exercises.difficulty,
        description: exercises.description,
        durationMinutes: sessionExercises.durationMinutes,
        defaultDuration: exercises.durationMinutes,
        notes: sessionExercises.notes,
        orderIndex: sessionExercises.orderIndex,
        steps: exercises.steps,
        tips: exercises.tips,
      })
      .from(sessionExercises)
      .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
      .where(eq(sessionExercises.sessionId, id))
      .orderBy(asc(sessionExercises.orderIndex)),
  ]);

  if (!sessionRow) notFound();
  if (sessionRow.userId !== user.id) notFound();

  const resolvedExercises = exerciseRows.map((e) => ({
    exerciseId: e.exerciseId,
    name: e.name,
    category: e.category,
    difficulty: e.difficulty,
    description: e.description,
    durationMinutes: e.durationMinutes ?? e.defaultDuration,
    notes: e.notes,
    orderIndex: e.orderIndex,
    steps: Array.isArray(e.steps) ? e.steps : [],
    tips: e.tips,
  }));

  return (
    <ExecuteSessionClient
      session={{
        id: sessionRow.id,
        title: sessionRow.title,
        durationMinutes: sessionRow.durationMinutes,
        scheduledAt: sessionRow.scheduledAt.toISOString(),
        status: sessionRow.status,
      }}
      exercises={resolvedExercises}
    />
  );
}
