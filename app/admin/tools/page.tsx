import { count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  users,
  exercises,
  sessions,
  exerciseDrafts,
  sessionDrafts,
  aiUsageEvents,
  drPlannerChats,
  drPlannerMessages,
  aiDocumentEmbeddings,
} from "@/db/schema";
import { AdminToolsClient } from "./tools-client";

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

async function getDbStats() {
  const [
    [usersCount],
    [exercisesCount],
    [sessionsCount],
    [exerciseDraftsCount],
    [sessionDraftsCount],
    [aiEventsCount],
    [chatsCount],
    [messagesCount],
    [embeddingsCount],
  ] = await Promise.all([
    db.select({ total: count() }).from(users),
    db.select({ total: count() }).from(exercises),
    db.select({ total: count() }).from(sessions),
    db.select({ total: count() }).from(exerciseDrafts),
    db.select({ total: count() }).from(sessionDrafts),
    db.select({ total: count() }).from(aiUsageEvents),
    db.select({ total: count() }).from(drPlannerChats),
    db.select({ total: count() }).from(drPlannerMessages),
    db
      .select({ total: count() })
      .from(aiDocumentEmbeddings)
      .catch(() => [{ total: 0 }]),
  ]);

  return {
    users: Number(usersCount?.total ?? 0),
    exercises: Number(exercisesCount?.total ?? 0),
    sessions: Number(sessionsCount?.total ?? 0),
    exerciseDrafts: Number(exerciseDraftsCount?.total ?? 0),
    sessionDrafts: Number(sessionDraftsCount?.total ?? 0),
    aiEvents: Number(aiEventsCount?.total ?? 0),
    chats: Number(chatsCount?.total ?? 0),
    messages: Number(messagesCount?.total ?? 0),
    embeddings: Number(embeddingsCount?.total ?? 0),
  };
}

export default async function AdminToolsPage() {
  await requireAdmin();
  const stats = await getDbStats();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="border-b border-foreground/10 pb-5">
        <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/40">
          Administración
        </p>
        <h1 className="mt-1 font-heading text-2xl font-semibold text-foreground">
          Herramientas
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/55">
          Mantenimiento de base de datos, limpieza de datos temporales y
          exportaciones. Las acciones destructivas son irreversibles.
        </p>
      </div>

      <AdminToolsClient stats={stats} />
    </div>
  );
}
