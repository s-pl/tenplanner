import { count, eq, isNull, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, exercises, sessions, aiDocumentEmbeddings } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [
      [totalExercises],
      [totalSessions],
      exerciseEmbeddings,
      sessionEmbeddings,
    ] = await Promise.all([
      db
        .select({ total: count() })
        .from(exercises)
        .where(
          or(
            eq(exercises.isGlobal, true),
            isNull(exercises.createdBy),
            sql`${exercises.createdBy} is not null`
          )
        ),
      db.select({ total: count() }).from(sessions),
      db
        .select({ total: count() })
        .from(aiDocumentEmbeddings)
        .where(eq(aiDocumentEmbeddings.source, "exercise")),
      db
        .select({ total: count() })
        .from(aiDocumentEmbeddings)
        .where(eq(aiDocumentEmbeddings.source, "session")),
    ]);

    return NextResponse.json({
      exercises: {
        total: Number(totalExercises?.total ?? 0),
        embedded: Number(exerciseEmbeddings[0]?.total ?? 0),
      },
      sessions: {
        total: Number(totalSessions?.total ?? 0),
        embedded: Number(sessionEmbeddings[0]?.total ?? 0),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
