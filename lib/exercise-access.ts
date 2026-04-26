import { and, eq, inArray, isNull, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { exercises } from "@/db/schema";

export function exerciseVisibleToUserCondition(
  userId: string | null | undefined
): SQL {
  const publicExercise = or(
    eq(exercises.isGlobal, true),
    isNull(exercises.createdBy)
  );

  if (!userId) return publicExercise!;

  return or(publicExercise!, eq(exercises.createdBy, userId))!;
}

export async function getAccessibleExerciseDurationMap(
  userId: string | null | undefined,
  exerciseIds: string[]
): Promise<{
  durationById: Map<string, number>;
  inaccessibleIds: string[];
}> {
  const uniqueIds = Array.from(new Set(exerciseIds));
  if (uniqueIds.length === 0) {
    return { durationById: new Map(), inaccessibleIds: [] };
  }

  const rows = await db
    .select({ id: exercises.id, durationMinutes: exercises.durationMinutes })
    .from(exercises)
    .where(
      and(
        inArray(exercises.id, uniqueIds),
        exerciseVisibleToUserCondition(userId)
      )
    );

  const durationById = new Map(rows.map((row) => [row.id, row.durationMinutes]));
  const inaccessibleIds = uniqueIds.filter((id) => !durationById.has(id));

  return { durationById, inaccessibleIds };
}

export function calculateExercisePlanDuration(
  exerciseItems: { exerciseId: string; durationMinutes?: number | null }[],
  durationById: Map<string, number>
): number {
  return exerciseItems.reduce((sum, item) => {
    const duration =
      item.durationMinutes ?? durationById.get(item.exerciseId) ?? 0;
    return sum + duration;
  }, 0);
}
