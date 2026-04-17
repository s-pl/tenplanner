import { notFound } from "next/navigation";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ExerciseDetailClient } from "./exercise-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExercisePage({ params }: PageProps) {
  const { id } = await params;

  let exercise;
  try {
    const result = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, id))
      .limit(1);
    exercise = result[0];
  } catch {
    notFound();
  }

  if (!exercise) notFound();

  return (
    <ExerciseDetailClient
      exercise={{
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
        category: exercise.category,
        difficulty: exercise.difficulty,
        durationMinutes: exercise.durationMinutes,
        createdBy: exercise.createdBy,
        createdAt: exercise.createdAt.toISOString(),
        updatedAt: exercise.updatedAt.toISOString(),
      }}
    />
  );
}
