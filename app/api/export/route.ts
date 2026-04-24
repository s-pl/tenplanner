import { eq, inArray } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  users as usersTable,
  students as studentsTable,
  sessions as sessionsTable,
  sessionStudents as sessionStudentsTable,
  exercises as exercisesTable,
  sessionExercises as sessionExercisesTable,
  drPlannerChats as drPlannerChatsTable,
  drPlannerMessages as drPlannerMessagesTable,
} from "@/db/schema";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [userRow, userSessions, userStudents, userExercises, userChats] =
    await Promise.all([
      db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, user.id))
        .limit(1),
      db.select().from(sessionsTable).where(eq(sessionsTable.userId, user.id)),
      db.select().from(studentsTable).where(eq(studentsTable.coachId, user.id)),
      db
        .select()
        .from(exercisesTable)
        .where(eq(exercisesTable.createdBy, user.id)),
      db
        .select()
        .from(drPlannerChatsTable)
        .where(eq(drPlannerChatsTable.userId, user.id)),
    ]);

  const sessionIds = userSessions.map((s) => s.id);
  const chatIds = userChats.map((c) => c.id);

  const [sessionExerciseLinks, sessionStudentLinks, chatMessages] =
    await Promise.all([
      sessionIds.length > 0
        ? db
            .select()
            .from(sessionExercisesTable)
            .where(inArray(sessionExercisesTable.sessionId, sessionIds))
        : Promise.resolve([]),
      sessionIds.length > 0
        ? db
            .select()
            .from(sessionStudentsTable)
            .where(inArray(sessionStudentsTable.sessionId, sessionIds))
        : Promise.resolve([]),
      chatIds.length > 0
        ? db
            .select()
            .from(drPlannerMessagesTable)
            .where(inArray(drPlannerMessagesTable.chatId, chatIds))
        : Promise.resolve([]),
    ]);

  const exportData = {
    exportInfo: {
      purpose:
        "Portabilidad RGPD — art. 20. Incluye todos los datos personales asociados a tu cuenta.",
      format: "JSON UTF-8",
      gdprArticle: "20",
      generatedAt: new Date().toISOString(),
    },
    auth: {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      appMetadata: user.app_metadata ?? null,
      userMetadata: user.user_metadata ?? null,
    },
    userRow: userRow[0] ?? null,
    sessions: userSessions,
    students: userStudents,
    sessionStudents: sessionStudentLinks,
    exercises: userExercises,
    sessionExercises: sessionExerciseLinks,
    drPlannerChats: userChats,
    drPlannerMessages: chatMessages,
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="tenplanner-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
