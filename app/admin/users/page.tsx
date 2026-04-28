import { db } from "@/db";
import { exercises, sessions, users } from "@/db/schema";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { AdminUsersClient } from "./users-client";

const PER_PAGE = 50;

type Filter = "all" | "admins" | "active";

interface PageProps {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const filter = (
    ["all", "admins", "active"].includes(params.filter ?? "")
      ? params.filter
      : "all"
  ) as Filter;
  const page = Math.max(1, Number(params.page ?? 1));
  const offset = (page - 1) * PER_PAGE;

  const conditions = [];

  if (q) {
    conditions.push(
      or(ilike(users.email, `%${q}%`), ilike(users.name, `%${q}%`))
    );
  }
  if (filter === "admins") {
    conditions.push(eq(users.isAdmin, true));
  }
  if (filter === "active") {
    conditions.push(
      sql`(
        (select count(*) from ${exercises} where ${exercises.createdBy} = ${users.id}) +
        (select count(*) from ${sessions} where ${sessions.userId} = ${users.id})
      ) > 0`
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
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
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(PER_PAGE)
      .offset(offset),
    db.select({ total: count() }).from(users).where(where),
  ]);

  const totalPages = Math.ceil(Number(total) / PER_PAGE);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Usuarios
        </h1>
        <p className="text-sm text-foreground/50 mt-1">
          {Number(total).toLocaleString("es-ES")} usuarios
        </p>
      </div>
      <AdminUsersClient
        users={rows.map((u) => ({
          ...u,
          exerciseCount: Number(u.exerciseCount ?? 0),
          sessionCount: Number(u.sessionCount ?? 0),
          globalExerciseCount: Number(u.globalExerciseCount ?? 0),
          createdAt: u.createdAt.toISOString(),
        }))}
        total={Number(total)}
        page={page}
        totalPages={totalPages}
        perPage={PER_PAGE}
        q={q}
        filter={filter}
      />
    </div>
  );
}
