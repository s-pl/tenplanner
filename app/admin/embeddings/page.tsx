import { count, eq, isNull, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users, exercises, sessions, aiDocumentEmbeddings } from "@/db/schema";
import { AdminPageHeader, adminPageShell } from "../_components/admin-ui";
import { EmbeddingsClient } from "./embeddings-client";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [row] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  if (!row?.isAdmin) redirect("/dashboard");
}

async function getEmbeddingStats() {
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

    return {
      exercises: {
        total: Number(totalExercises?.total ?? 0),
        embedded: Number(exerciseEmbeddings[0]?.total ?? 0),
      },
      sessions: {
        total: Number(totalSessions?.total ?? 0),
        embedded: Number(sessionEmbeddings[0]?.total ?? 0),
      },
    };
  } catch {
    return {
      exercises: { total: 0, embedded: 0 },
      sessions: { total: 0, embedded: 0 },
    };
  }
}

export default async function AdminEmbeddingsPage() {
  await requireAdmin();
  const stats = await getEmbeddingStats();

  return (
    <div className={adminPageShell}>
      <AdminPageHeader
        eyebrow="Admin / IA"
        title="Búsqueda semántica"
        description="Gestión de embeddings vectoriales para Dr. Planner. Los nuevos ejercicios y sesiones se indexan automáticamente. Usa el backfill para indexar contenido existente."
      />

      <EmbeddingsClient stats={stats} />
    </div>
  );
}
