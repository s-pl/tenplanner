import { db } from "@/db";
import { users, exercises, sessions, sessionTemplates } from "@/db/schema";
import { count, gte, sql, eq } from "drizzle-orm";

async function getMetrics() {
  const now = new Date();
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    [totalUsers],
    [newUsers7],
    [newUsers30],
    [totalExercises],
    [globalExercises],
    [aiExercises],
    [totalSessions],
    [totalTemplates],
    signupsByDay,
  ] = await Promise.all([
    db.select({ total: count() }).from(users),
    db.select({ total: count() }).from(users).where(gte(users.createdAt, last7)),
    db.select({ total: count() }).from(users).where(gte(users.createdAt, last30)),
    db.select({ total: count() }).from(exercises),
    db.select({ total: count() }).from(exercises).where(eq(exercises.isGlobal, true)),
    db.select({ total: count() }).from(exercises).where(eq(exercises.isAiGenerated, true)),
    db.select({ total: count() }).from(sessions),
    db.select({ total: count() }).from(sessionTemplates),
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
    globalExercises: Number(globalExercises?.total ?? 0),
    aiExercises: Number(aiExercises?.total ?? 0),
    totalSessions: Number(totalSessions?.total ?? 0),
    totalTemplates: Number(totalTemplates?.total ?? 0),
    signupsByDay,
  };
}

export default async function AdminDashboard() {
  const metrics = await getMetrics();

  const userStats = [
    { label: "Usuarios totales", value: metrics.totalUsers, color: "text-foreground" },
    { label: "Nuevos (7 días)", value: metrics.newUsers7, color: "text-brand" },
    { label: "Nuevos (30 días)", value: metrics.newUsers30, color: "text-brand/70" },
  ];

  const contentStats = [
    { label: "Ejercicios", value: metrics.totalExercises, color: "text-foreground" },
    { label: "Globales", value: metrics.globalExercises, color: "text-brand" },
    { label: "Generados IA", value: metrics.aiExercises, color: "text-violet-400" },
    { label: "Sesiones", value: metrics.totalSessions, color: "text-foreground" },
    { label: "Plantillas", value: metrics.totalTemplates, color: "text-amber-400" },
  ];

  const maxSignups = Math.max(...metrics.signupsByDay.map((r) => Number(r.total)), 1);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Métricas
        </h1>
        <p className="text-sm text-foreground/50 mt-1">Vista general de la plataforma</p>
      </div>

      {/* Users */}
      <section>
        <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/40 mb-3">
          Usuarios
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {userStats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5"
            >
              <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/40 mb-2">
                {s.label}
              </p>
              <p className={`font-heading text-3xl font-semibold ${s.color}`}>
                {s.value.toLocaleString("es-ES")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Content */}
      <section>
        <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/40 mb-3">
          Contenido
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {contentStats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5"
            >
              <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/40 mb-2">
                {s.label}
              </p>
              <p className={`font-heading text-3xl font-semibold ${s.color}`}>
                {s.value.toLocaleString("es-ES")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Signups chart */}
      <section>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-heading text-base font-semibold text-foreground">
              Registros últimos 30 días
            </h2>
            <span className="text-xs text-foreground/40">{metrics.newUsers30} en total</span>
          </div>
          {metrics.signupsByDay.length === 0 ? (
            <p className="text-sm text-foreground/40">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {metrics.signupsByDay
                .sort((a, b) => b.day.localeCompare(a.day))
                .slice(0, 20)
                .map((row) => (
                  <div key={row.day} className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-foreground/40 w-24 shrink-0">
                      {new Date(row.day).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-foreground/8 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand transition-all"
                        style={{ width: `${Math.max(4, (Number(row.total) / maxSignups) * 100)}%` }}
                      />
                    </div>
                    <span className="font-sans text-xs font-semibold text-foreground/60 w-6 text-right tabular-nums">
                      {row.total}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Global vs Private ratio */}
      {metrics.totalExercises > 0 && (
        <section>
          <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
            <h2 className="font-heading text-base font-semibold text-foreground mb-4">
              Distribución de ejercicios
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-foreground/50 mb-1">
                  <span>Globales</span>
                  <span>{metrics.globalExercises} ({Math.round(metrics.globalExercises / metrics.totalExercises * 100)}%)</span>
                </div>
                <div className="h-2 rounded-full bg-foreground/8">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${(metrics.globalExercises / metrics.totalExercises) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-foreground/50 mb-1">
                  <span>Generados por IA</span>
                  <span>{metrics.aiExercises} ({Math.round(metrics.aiExercises / metrics.totalExercises * 100)}%)</span>
                </div>
                <div className="h-2 rounded-full bg-foreground/8">
                  <div
                    className="h-full rounded-full bg-violet-400"
                    style={{ width: `${(metrics.aiExercises / metrics.totalExercises) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
