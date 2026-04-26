import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  exercises,
  sessionExercises,
  sessionTemplateExercises,
  sessionTemplates,
  sessions,
} from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId } = await params;

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let sanitizeNotes = false;
  let templateTitle: string | null = null;
  let templateDescription: string | null = null;
  try {
    const body = await request.json() as {
      sanitizeNotes?: boolean;
      templateTitle?: string;
      templateDescription?: string | null;
    };
    sanitizeNotes = body.sanitizeNotes === true;
    if (typeof body.templateTitle === "string" && body.templateTitle.trim()) {
      templateTitle = body.templateTitle.trim().slice(0, 255);
    }
    if (typeof body.templateDescription === "string" && body.templateDescription.trim()) {
      templateDescription = body.templateDescription.trim().slice(0, 500);
    }
  } catch {
    // body is optional
  }

  const [template] = await db
    .insert(sessionTemplates)
    .values({
      authorId: user.id,
      title: templateTitle ?? session.title,
      // Use the custom description if provided, otherwise the session description
      // Location is intentionally excluded — it's coach-specific personal data
      description: templateDescription ?? session.description,
      objective: session.objective,
      durationMinutes: session.durationMinutes,
      intensity: session.intensity,
      tags: session.tags,
      location: null,
    })
    .returning();

  const sessionExerciseRows = await db
    .select({
      exerciseId: sessionExercises.exerciseId,
      orderIndex: sessionExercises.orderIndex,
      durationMinutes: sessionExercises.durationMinutes,
      notes: sessionExercises.notes,
      phase: sessionExercises.phase,
      intensity: sessionExercises.intensity,
      isGlobal: exercises.isGlobal,
      createdBy: exercises.createdBy,
    })
    .from(sessionExercises)
    .leftJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(asc(sessionExercises.orderIndex));

  const inaccessibleRows = sessionExerciseRows.filter(
    (se) => se.createdBy !== null && se.createdBy !== user.id && !se.isGlobal
  );
  if (inaccessibleRows.length > 0) {
    return NextResponse.json(
      { error: "La sesión contiene ejercicios privados no accesibles." },
      { status: 400 }
    );
  }

  if (sessionExerciseRows.length > 0) {
    await db.insert(sessionTemplateExercises).values(
      sessionExerciseRows.map((se) => ({
        templateId: template.id,
        exerciseId: se.exerciseId,
        orderIndex: se.orderIndex,
        durationMinutes: se.durationMinutes,
        notes: sanitizeNotes ? null : se.notes,
        phase: se.phase,
        intensity: se.intensity,
      }))
    );
  }

  return NextResponse.json({ data: { templateId: template.id } }, { status: 201 });
}
