import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { exercises, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { ExerciseDetailClient } from "./exercise-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExercisePage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let exercise;
  let dbUser;
  try {
    const [exerciseResult, userResult] = await Promise.all([
      db.select().from(exercises).where(eq(exercises.id, id)).limit(1),
      db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, user.id)).limit(1),
    ]);
    exercise = exerciseResult[0];
    dbUser = userResult[0];
  } catch {
    notFound();
  }

  if (!exercise) notFound();
  const isAdmin = !!dbUser?.isAdmin;
  const isOwner = exercise.createdBy === user.id;
  const canEdit = isAdmin || (!exercise.isGlobal && isOwner);

  return (
    <ExerciseDetailClient
      canEdit={canEdit}
      isAdmin={isAdmin}
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
        phase: exercise.phase ?? null,
        intensity: exercise.intensity ?? null,
        isGlobal: exercise.isGlobal,
        isAiGenerated: exercise.isAiGenerated,
        createdBy: exercise.createdBy,
        createdAt: exercise.createdAt.toISOString(),
        updatedAt: exercise.updatedAt.toISOString(),
      }}
    />
  );
}
