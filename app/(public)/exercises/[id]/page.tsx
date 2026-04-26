import { notFound } from "next/navigation";
import { db } from "@/db";
import { exercises, users, exerciseRatings } from "@/db/schema";
import { and, eq, avg, count } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { ExerciseDetailClient } from "./exercise-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExercisePage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  let exercise;
  let dbUser;
  let ratingData: { avg: number | null; total: number } = { avg: null, total: 0 };
  let userRating: number | null = null;

  try {
    const [exerciseResult, userResult, ratingResult] = await Promise.all([
      db.select().from(exercises).where(eq(exercises.id, id)).limit(1),
      user
        ? db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, user.id)).limit(1)
        : Promise.resolve([]),
      db
        .select({ avg: avg(exerciseRatings.rating), total: count() })
        .from(exerciseRatings)
        .where(eq(exerciseRatings.exerciseId, id)),
    ]);
    exercise = exerciseResult[0];
    dbUser = (userResult as Array<{ isAdmin: boolean | null }>)[0];
    const row = ratingResult[0];
    ratingData = {
      avg: row?.avg != null ? Number(row.avg) : null,
      total: Number(row?.total ?? 0),
    };

    if (user) {
      const userRatingResult = await db
        .select({ rating: exerciseRatings.rating })
        .from(exerciseRatings)
        .where(and(eq(exerciseRatings.userId, user.id), eq(exerciseRatings.exerciseId, id)))
        .limit(1);
      userRating = userRatingResult[0]?.rating ?? null;
    }
  } catch {
    notFound();
  }

  if (!exercise) notFound();

  const canAccess = exercise.isGlobal || exercise.createdBy === null || exercise.createdBy === user?.id;
  if (!canAccess) notFound();

  const isAdmin = !!dbUser?.isAdmin;
  const isOwner = exercise.createdBy === user?.id;
  const canEdit = !!user && (isAdmin || (!exercise.isGlobal && isOwner));

  return (
    <ExerciseDetailClient
      canEdit={canEdit}
      isAdmin={isAdmin}
      userId={user?.id ?? null}
      initialRating={userRating}
      ratingAvg={ratingData.avg}
      ratingTotal={ratingData.total}
      exercise={{
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
        category: exercise.category,
        difficulty: exercise.difficulty,
        durationMinutes: exercise.durationMinutes,
        objectives: exercise.objectives ?? null,
        steps:
          (exercise.steps as Array<{ title: string; description: string }> | null) ?? null,
        materials: (exercise.materials as string[] | null) ?? null,
        location: (exercise.location as "indoor" | "outdoor" | "any" | null) ?? null,
        videoUrl: exercise.videoUrl ?? null,
        tips: exercise.tips ?? null,
        imageUrl: exercise.imageUrl ?? null,
        imageUrls: (exercise.imageUrls as string[] | null) ?? null,
        variantes: exercise.variantes ?? null,
        formato: (exercise.formato as "individual" | "parejas" | "grupal" | "multigrupo" | null) ?? null,
        numJugadores: exercise.numJugadores ?? null,
        tipoPelota: (exercise.tipoPelota as "normal" | "lenta" | "rapida" | "sin_pelota" | null) ?? null,
        tipoActividad: (exercise.tipoActividad as "tecnico_tactico" | "fisico" | "cognitivo" | "competitivo" | "ludico" | null) ?? null,
        golpes: (exercise.golpes as string[] | null) ?? null,
        efecto: (exercise.efecto as string[] | null) ?? null,
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
