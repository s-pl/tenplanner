import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { sessions as sessionsTable, exercises as exercisesTable, sessionExercises } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [userSessions, allExercises, sessionExerciseLinks] = await Promise.all([
    db.select().from(sessionsTable).where(eq(sessionsTable.userId, user.id)),
    db.select().from(exercisesTable),
    db.select().from(sessionExercises),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name,
    },
    sessions: userSessions,
    exercises: allExercises,
    sessionExercises: sessionExerciseLinks.filter((se) =>
      userSessions.some((s) => s.id === se.sessionId)
    ),
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="tenplanner-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
