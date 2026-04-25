import { db } from "@/db";
import { users, exercises, sessions } from "@/db/schema";
import { count, gte, sql } from "drizzle-orm";

async function getMetrics() {
  const now = new Date();
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    [totalUsers],
    [newUsers7],
    [newUsers30],
    [totalExercises],
    [totalSessions],
    signupsByDay,
  ] = await Promise.all([
    db.select({ total: count() }).from(users),
    db.select({ total: count() }).from(users).where(gte(users.createdAt, last7)),
    db.select({ total: count() }).from(users).where(gte(users.createdAt, last30)),
    db.select({ total: count() }).from(exercises),
    db.select({ total: count() }).from(sessions),
    db
      .select({
        day: sql<string>`date_trunc('day', ${users.createdAt})::date::text`,
        total: count(),
      })
      .from(users)
      .where(gte(users.createdAt, last30))
      .groupBy(sql`date_trunc('day', ${users.createdAt})`),
  ]);

  return {
    totalUsers: Number(totalUsers?.total ?? 0),
    newUsers7: Number(newUsers7?.total ?? 0),
    newUsers30: Number(newUsers30?.total ?? 0),
    totalExercises: Number(totalExercises?.total ?? 0),
    totalSessions: Number(totalSessions?.total ?? 0),
    signupsByDay,
  };
}

export default async function AdminDashboard() {
  const metrics = await getMetrics();

  const stats = [
    { label: "Usuarios totales", value: metrics.totalUsers, sub: null },
    { label: "Nuevos (7 días)", value: metrics.newUsers7, sub: null },
    { label: "Nuevos (30 días)", value: metrics.newUsers30, sub: null },
    { label: "Ejercicios", value: metrics.totalExercises, sub: null },
    { label: "Sesiones", value: metrics.totalSessions, sub: null },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Métricas
        </h1>
        <p className="text-sm text-foreground/50 mt-1">Vista general de la plataforma</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5"
          >
            <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/40 mb-2">
              {s.label}
            </p>
            <p className="font-heading text-3xl font-semibold text-foreground">
              {s.value.toLocaleString("es-ES")}
            </p>
          </div>
        ))}
      </div>

      {/* Signups por día */}
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
        <h2 className="font-heading text-base font-semibold text-foreground mb-4">
          Registros últimos 30 días
        </h2>
        {metrics.signupsByDay.length === 0 ? (
          <p className="text-sm text-foreground/40">Sin datos</p>
        ) : (
          <div className="space-y-2">
            {metrics.signupsByDay
              .sort((a, b) => b.day.localeCompare(a.day))
              .slice(0, 15)
              .map((row) => (
                <div key={row.day} className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-foreground/40 w-24 shrink-0">
                    {row.day}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-foreground/8 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{
                        width: `${Math.min(100, (Number(row.total) / Math.max(...metrics.signupsByDay.map((r) => Number(r.total)))) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="font-sans text-xs text-foreground/60 w-6 text-right">
                    {row.total}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
