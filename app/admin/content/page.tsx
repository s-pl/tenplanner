import { db } from "@/db";
import { exercises, sessions, sessionExercises, users } from "@/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";
import { AdminContentClient } from "./content-client";

export default async function AdminContentPage() {
  const [exerciseRows, sessionRows] = await Promise.all([
    db
      .select({
        id: exercises.id,
        name: exercises.name,
        category: exercises.category,
        difficulty: exercises.difficulty,
        durationMinutes: exercises.durationMinutes,
        isGlobal: exercises.isGlobal,
        isAiGenerated: exercises.isAiGenerated,
        createdAt: exercises.createdAt,
        createdByEmail: users.email,
        createdByName: users.name,
        usageCount: sql<number>`(
          select count(*)::int from ${sessionExercises}
          where ${sessionExercises.exerciseId} = ${exercises.id}
        )`,
      })
      .from(exercises)
      .leftJoin(users, eq(exercises.createdBy, users.id))
      .orderBy(desc(exercises.createdAt))
      .limit(500),
    db
      .select({
        id: sessions.id,
        title: sessions.title,
        status: sessions.status,
        scheduledAt: sessions.scheduledAt,
        durationMinutes: sessions.durationMinutes,
        createdAt: sessions.createdAt,
        userEmail: users.email,
        userName: users.name,
        exerciseCount: sql<number>`(
          select count(*)::int from ${sessionExercises}
          where ${sessionExercises.sessionId} = ${sessions.id}
        )`,
      })
      .from(sessions)
      .leftJoin(users, eq(sessions.userId, users.id))
      .orderBy(desc(sessions.createdAt))
      .limit(500),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Contenido
        </h1>
        <p className="text-sm text-foreground/50 mt-1">
          {exerciseRows.length} ejercicios · {sessionRows.length} sesiones
        </p>
      </div>
      <AdminContentClient
        exercises={exerciseRows.map((e) => ({
          ...e,
          usageCount: Number(e.usageCount ?? 0),
          createdAt: e.createdAt.toISOString(),
        }))}
        sessions={sessionRows.map((s) => ({
          ...s,
          exerciseCount: Number(s.exerciseCount ?? 0),
          scheduledAt: s.scheduledAt.toISOString(),
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
