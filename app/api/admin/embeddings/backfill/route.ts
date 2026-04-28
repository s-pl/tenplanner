import { eq, isNull, notInArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, exercises, sessions, aiDocumentEmbeddings } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { embedExercise, embedSession } from "@/lib/ai/semantic-search";

export const maxDuration = 300;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [row] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  return row?.isAdmin ? user : null;
}

export async function POST() {
  const admin = await requireAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let exercisesProcessed = 0;
  let sessionsProcessed = 0;
  let errors = 0;

  try {
    // Find exercises without embeddings
    const embeddedExerciseIds = await db
      .select({ sourceId: aiDocumentEmbeddings.sourceId })
      .from(aiDocumentEmbeddings)
      .where(eq(aiDocumentEmbeddings.source, "exercise"));

    const embeddedIds = embeddedExerciseIds.map((r) => r.sourceId);

    const unembeddedExercises = await db
      .select({
        id: exercises.id,
        createdBy: exercises.createdBy,
        isGlobal: exercises.isGlobal,
        name: exercises.name,
        category: exercises.category,
        difficulty: exercises.difficulty,
        durationMinutes: exercises.durationMinutes,
        description: exercises.description,
        objectives: exercises.objectives,
        tips: exercises.tips,
        materials: exercises.materials,
        location: exercises.location,
      })
      .from(exercises)
      .where(
        embeddedIds.length > 0
          ? notInArray(exercises.id, embeddedIds)
          : or(
              eq(exercises.isGlobal, true),
              isNull(exercises.createdBy),
              eq(exercises.isGlobal, false)
            )
      )
      .limit(200);

    for (const ex of unembeddedExercises) {
      try {
        await embedExercise({
          id: ex.id,
          ownerId: ex.isGlobal ? null : ex.createdBy,
          name: ex.name,
          category: ex.category,
          difficulty: ex.difficulty,
          durationMinutes: ex.durationMinutes,
          description: ex.description,
          objectives: ex.objectives,
          tips: ex.tips,
          materials: ex.materials as string[] | null,
          location: ex.location,
        });
        exercisesProcessed++;
      } catch {
        errors++;
      }
    }

    // Find sessions without embeddings
    const embeddedSessionIds = await db
      .select({ sourceId: aiDocumentEmbeddings.sourceId })
      .from(aiDocumentEmbeddings)
      .where(eq(aiDocumentEmbeddings.source, "session"));

    const embeddedSessIds = embeddedSessionIds.map((r) => r.sourceId);

    const unembeddedSessions = await db
      .select({ id: sessions.id, userId: sessions.userId })
      .from(sessions)
      .where(
        embeddedSessIds.length > 0
          ? notInArray(sessions.id, embeddedSessIds)
          : eq(sessions.id, sessions.id)
      )
      .limit(200);

    for (const sess of unembeddedSessions) {
      try {
        await embedSession(sess.id, sess.userId);
        sessionsProcessed++;
      } catch {
        errors++;
      }
    }

    return NextResponse.json({ exercisesProcessed, sessionsProcessed, errors });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
