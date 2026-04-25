import { db } from "@/db";
import { exercises, sessions, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { AdminContentClient } from "./content-client";

export default async function AdminContentPage() {
  const [exerciseRows, sessionRows] = await Promise.all([
    db
      .select({
        id: exercises.id,
        name: exercises.name,
        category: exercises.category,
        difficulty: exercises.difficulty,
        isGlobal: exercises.isGlobal,
        isAiGenerated: exercises.isAiGenerated,
        createdAt: exercises.createdAt,
        createdByEmail: users.email,
        createdByName: users.name,
      })
      .from(exercises)
      .leftJoin(users, eq(exercises.createdBy, users.id))
      .orderBy(desc(exercises.createdAt))
      .limit(200),
    db
      .select({
        id: sessions.id,
        title: sessions.title,
        status: sessions.status,
        scheduledAt: sessions.scheduledAt,
        createdAt: sessions.createdAt,
        userEmail: users.email,
        userName: users.name,
      })
      .from(sessions)
      .leftJoin(users, eq(sessions.userId, users.id))
      .orderBy(desc(sessions.createdAt))
      .limit(200),
  ]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Contenido
        </h1>
        <p className="text-sm text-foreground/50 mt-1">
          Moderación de ejercicios y sesiones
        </p>
      </div>
      <AdminContentClient
        exercises={exerciseRows.map((e) => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
        }))}
        sessions={sessionRows.map((s) => ({
          ...s,
          scheduledAt: s.scheduledAt.toISOString(),
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
