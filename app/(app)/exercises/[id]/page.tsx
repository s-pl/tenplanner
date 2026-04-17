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
        objectives: exercise.objectives ?? null,
        steps: (exercise.steps as Array<{ title: string; description: string }> | null) ?? null,
        materials: (exercise.materials as string[] | null) ?? null,
        location: (exercise.location as "indoor" | "outdoor" | "any" | null) ?? null,
        videoUrl: exercise.videoUrl ?? null,
        tips: exercise.tips ?? null,
        imageUrl: exercise.imageUrl ?? null,
        createdBy: exercise.createdBy,
        createdAt: exercise.createdAt.toISOString(),
        updatedAt: exercise.updatedAt.toISOString(),
      }}
    />
  );
}
