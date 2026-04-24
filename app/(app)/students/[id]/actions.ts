"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { sessionStudents, sessions, students } from "@/db/schema";

export type SaveFeedbackInput = {
  sessionStudentId: string;
  studentId: string;
  attended: boolean | null;
  rating: number | null;
  feedback: string | null;
};

export async function saveSessionFeedback(input: SaveFeedbackInput) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return { ok: false as const, error: "Unauthorized" };

  const [row] = await db
    .select({ id: sessionStudents.id, coachId: students.coachId })
    .from(sessionStudents)
    .innerJoin(students, eq(sessionStudents.studentId, students.id))
    .innerJoin(sessions, eq(sessionStudents.sessionId, sessions.id))
    .where(
      and(
        eq(sessionStudents.id, input.sessionStudentId),
        eq(sessions.userId, user.id)
      )
    )
    .limit(1);

  if (!row || row.coachId !== user.id) {
    return { ok: false as const, error: "Forbidden" };
  }

  const rating =
    input.rating != null && input.rating >= 1 && input.rating <= 5
      ? input.rating
      : null;
  const feedback =
    input.feedback && input.feedback.trim().length > 0
      ? input.feedback.trim()
      : null;

  await db
    .update(sessionStudents)
    .set({
      attended: input.attended,
      rating,
      feedback,
      feedbackAt:
        feedback || rating != null || input.attended != null
          ? new Date()
          : null,
    })
    .where(eq(sessionStudents.id, input.sessionStudentId));

  revalidatePath(`/students/${input.studentId}`);
  return { ok: true as const };
}

export async function generateProfileLink(studentId: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return { ok: false as const, error: "Unauthorized" };

  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.coachId, user.id)))
    .limit(1);

  if (!student) return { ok: false as const, error: "Forbidden" };

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db
    .update(students)
    .set({ profileToken: token, profileTokenExpiresAt: expiresAt })
    .where(eq(students.id, studentId));

  return { ok: true as const, token };
}
