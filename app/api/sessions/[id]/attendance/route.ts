import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { sessions, sessionStudents, students } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  studentId: z.string().uuid(),
  attended: z.boolean(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await context.params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Verify session belongs to user
  const [session] = await db
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Verify student belongs to coach
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, parsed.data.studentId), eq(students.coachId, user.id)))
    .limit(1);

  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  // Upsert attendance
  await db
    .insert(sessionStudents)
    .values({
      sessionId,
      studentId: parsed.data.studentId,
      attended: parsed.data.attended,
    })
    .onConflictDoUpdate({
      target: [sessionStudents.sessionId, sessionStudents.studentId],
      set: { attended: parsed.data.attended },
    });

  return NextResponse.json({ ok: true, attended: parsed.data.attended });
}
