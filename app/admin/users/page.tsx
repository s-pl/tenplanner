import { db } from "@/db";
import { exercises, sessions, users } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { AdminUsersClient } from "./users-client";

export default async function AdminUsersPage() {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      exerciseCount: sql<number>`(
        select count(*)::int from ${exercises}
        where ${exercises.createdBy} = ${users.id}
      )`,
      sessionCount: sql<number>`(
        select count(*)::int from ${sessions}
        where ${sessions.userId} = ${users.id}
      )`,
      globalExerciseCount: sql<number>`(
        select count(*)::int from ${exercises}
        where ${exercises.createdBy} = ${users.id}
        and ${exercises.isGlobal} = true
      )`,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(500);

  const serialized = rows.map((u) => ({
    ...u,
    exerciseCount: Number(u.exerciseCount ?? 0),
    sessionCount: Number(u.sessionCount ?? 0),
    globalExerciseCount: Number(u.globalExerciseCount ?? 0),
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Usuarios
        </h1>
        <p className="text-sm text-foreground/50 mt-1">
          {rows.length} usuarios registrados
        </p>
      </div>
      <AdminUsersClient users={serialized} />
    </div>
  );
}
