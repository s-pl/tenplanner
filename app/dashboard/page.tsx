import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { sessions as sessionsTable, exercises as exercisesTable } from "@/db/schema";
import { eq, gte, desc, count } from "drizzle-orm";
import {
  CalendarDays,
  Dumbbell,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle2,
  Circle,
} from "lucide-react";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isUpcoming(date: Date) {
  return date >= new Date();
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName =
    user.user_metadata?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "Coach";

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());

  // Fetch data in parallel
  const [allSessions, exerciseCount, thisWeekSessions] = await Promise.all([
    db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, user.id))
      .orderBy(desc(sessionsTable.scheduledAt))
      .limit(20),
    db.select({ count: count() }).from(exercisesTable),
    db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, user.id))
      .then((rows) =>
        rows.filter((s) => new Date(s.scheduledAt) >= weekStart)
      ),
  ]);

  const upcomingSessions = allSessions
    .filter((s) => isUpcoming(new Date(s.scheduledAt)))
    .slice(0, 3);

  const recentSessions = allSessions
    .filter((s) => !isUpcoming(new Date(s.scheduledAt)))
    .slice(0, 5);

  const totalMinutes = allSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalHours = Math.round(totalMinutes / 60);

  const stats = [
    {
      label: "Sesiones esta semana",
      value: thisWeekSessions.length,
      icon: CalendarDays,
      color: "text-brand",
      bg: "bg-brand/10",
    },
    {
      label: "Ejercicios totales",
      value: exerciseCount[0]?.count ?? 0,
      icon: Dumbbell,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Horas entrenadas",
      value: totalHours,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      label: "Sesiones totales",
      value: allSessions.length,
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  const hour = now.getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="px-6 md:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium">
            {greeting}
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground mt-0.5">
            {displayName} <span className="text-muted-foreground font-normal text-2xl">👋</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {formatDate(now)} — {allSessions.length === 0 ? "¿Listo para planificar tu primera sesión?" : `Tienes ${upcomingSessions.length} ${upcomingSessions.length !== 1 ? "sesiones" : "sesión"} próxima${upcomingSessions.length !== 1 ? "s" : ""}.`}
          </p>
        </div>
        <Link
          href="/sessions"
          className="hidden sm:inline-flex items-center gap-2 bg-brand text-brand-foreground text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand/90 transition-colors shrink-0"
        >
          <Plus className="size-4" />
          Nueva sesión
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5">
            <div className={`size-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`size-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Upcoming sessions */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Sesiones próximas</h2>
            <Link href="/sessions" className="text-xs text-muted-foreground hover:text-brand transition-colors flex items-center gap-1">
              Ver todas <ArrowRight className="size-3" />
            </Link>
          </div>

          {upcomingSessions.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
              <CalendarDays className="size-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No hay sesiones próximas</p>
              <p className="text-xs text-muted-foreground mb-4">Planifica tu próxima sesión de entrenamiento para empezar.</p>
              <Link
                href="/sessions"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand/80 transition-colors"
              >
                <Plus className="size-3.5" /> Crear sesión
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="group bg-card border border-border rounded-2xl p-4 hover:border-brand/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 bg-brand/10 rounded-xl px-3 py-2 text-center min-w-[52px]">
                      <p className="text-xs text-brand font-medium">
                        {new Intl.DateTimeFormat("en-GB", { day: "numeric" }).format(new Date(session.scheduledAt))}
                      </p>
                      <p className="text-xs text-brand/70 uppercase tracking-wide">
                        {new Intl.DateTimeFormat("en-GB", { month: "short" }).format(new Date(session.scheduledAt))}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{session.title}</p>
                      {session.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{session.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {session.durationMinutes} min
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="size-3" />
                          {formatTime(new Date(session.scheduledAt))}
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/sessions"
                      className="shrink-0 text-xs text-muted-foreground group-hover:text-brand transition-colors"
                    >
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <h2 className="font-semibold text-foreground">Acciones rápidas</h2>
          <div className="space-y-2">
            {[
              { href: "/sessions", icon: Plus, label: "Nueva sesión de entrenamiento", description: "Programa una sesión" },
              { href: "/exercises", icon: Dumbbell, label: "Explorar ejercicios", description: "Explora la biblioteca" },
              { href: "/calendar", icon: CalendarDays, label: "Ver calendario", description: "Vista mensual" },
            ].map(({ href, icon: Icon, label, description }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 bg-card border border-border rounded-xl p-3.5 hover:border-brand/30 hover:bg-brand/5 transition-colors"
              >
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-brand/15 transition-colors">
                  <Icon className="size-4 text-muted-foreground group-hover:text-brand transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground ml-auto shrink-0 group-hover:text-brand transition-colors" />
              </Link>
            ))}
          </div>

          {/* Recent activity */}
          {recentSessions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Sesiones pasadas</h3>
              <div className="space-y-2">
                {recentSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="flex items-center gap-2.5 py-2 border-b border-border/50 last:border-0">
                    <CheckCircle2 className="size-4 text-brand shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{session.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(new Date(session.scheduledAt))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
