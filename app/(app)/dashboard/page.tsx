import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  sessions as sessionsTable,
  sessionExercises,
  exercises as exercisesTable,
  students as studentsTable,
} from "@/db/schema";
import { and, asc, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  Clock,
  Lock,
  CalendarClock,
  BookOpen,
  History,
  MapPin,
  Radio,
  Heart,
  GraduationCap,
  Dumbbell,
  Users,
  Sparkles,
} from "lucide-react";
import { TimeGreeting } from "@/components/app/dashboard/time-greeting";
import { Skeleton } from "@/components/ui/skeleton";
import { greetingForHour } from "@/lib/time-greeting";
import { getBooleanSetting } from "@/lib/app-settings";
import { cn } from "@/lib/utils";

function formatDayMonth(date: Date) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" })
    .format(date)
    .replace(".", "")
    .toUpperCase();
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(date);
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function SectionTitle({
  title,
  id,
}: {
  title: string;
  id?: string;
}) {
  return (
    <h2
      id={id}
      className="font-heading text-[17px] font-semibold text-foreground"
    >
      {title}
    </h2>
  );
}

function DashboardBodySkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <Skeleton className="h-4 w-36 rounded-none" />
        <div className="grid grid-cols-2 border border-foreground/12 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-b border-r border-foreground/10 p-5 last:border-r-0 lg:border-b-0"
            >
              <Skeleton className="h-3 w-24 rounded-none" />
              <Skeleton className="mt-6 h-12 w-20 rounded-none" />
            </div>
          ))}
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-40 rounded-none" />
          <div className="border border-foreground/12">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="grid grid-cols-[84px_1fr_auto] items-center gap-5 border-b border-foreground/10 p-5 last:border-b-0"
              >
                <Skeleton className="h-14 w-20 rounded-none" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-48 rounded-none" />
                  <Skeleton className="h-3 w-28 rounded-none" />
                </div>
                <Skeleton className="size-4 rounded-none" />
              </div>
            ))}
          </div>
        </div>
        <aside className="flex flex-col gap-4">
          <Skeleton className="h-4 w-28 rounded-none" />
          <div className="border border-foreground/12">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-16 rounded-none border-b border-foreground/10 last:border-b-0"
              />
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

async function DashboardBody({
  userId,
  sessionCreationEnabled,
}: {
  userId: string;
  sessionCreationEnabled: boolean;
}) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(now.getDate() - 7);

  const [
    upcomingSessions,
    sessionStats,
    exerciseCount,
    studentCount,
    lastWeekMinutes,
    mostUsedExercise,
  ] = await Promise.all([
      db
        .select({
          id: sessionsTable.id,
          title: sessionsTable.title,
          scheduledAt: sessionsTable.scheduledAt,
          durationMinutes: sessionsTable.durationMinutes,
          location: sessionsTable.location,
        })
        .from(sessionsTable)
        .where(
          and(
            eq(sessionsTable.userId, userId),
            gte(sessionsTable.scheduledAt, now)
          )
        )
        .orderBy(asc(sessionsTable.scheduledAt))
        .limit(4),
      db
        .select({
          total: sql<number>`count(*)`,
          totalMinutes: sql<number>`coalesce(sum(${sessionsTable.durationMinutes}), 0)`,
          thisWeekCount: sql<number>`count(*) filter (where ${sessionsTable.scheduledAt} >= ${weekStart.toISOString()})`,
        })
        .from(sessionsTable)
        .where(eq(sessionsTable.userId, userId)),
      db.select({ count: count() }).from(exercisesTable),
      db
        .select({ count: count() })
        .from(studentsTable)
        .where(eq(studentsTable.coachId, userId)),
      db
        .select({
          minutes: sql<number>`coalesce(sum(${sessionsTable.durationMinutes}), 0)`,
        })
        .from(sessionsTable)
        .where(
          and(
            eq(sessionsTable.userId, userId),
            gte(sessionsTable.scheduledAt, lastWeekStart),
            lt(sessionsTable.scheduledAt, now)
          )
        ),
      db
        .select({
          name: exercisesTable.name,
          uses: sql<number>`count(${sessionExercises.id})`,
        })
        .from(sessionExercises)
        .innerJoin(
          sessionsTable,
          eq(sessionsTable.id, sessionExercises.sessionId)
        )
        .innerJoin(
          exercisesTable,
          eq(exercisesTable.id, sessionExercises.exerciseId)
        )
        .where(eq(sessionsTable.userId, userId))
        .groupBy(exercisesTable.id, exercisesTable.name)
        .orderBy(desc(sql`count(${sessionExercises.id})`))
        .limit(1),
    ]);

  const totalSessions = Number(sessionStats[0]?.total ?? 0);
  const totalMinutes = Number(sessionStats[0]?.totalMinutes ?? 0);
  const thisWeekCount = Number(sessionStats[0]?.thisWeekCount ?? 0);
  const totalHours = Math.round(totalMinutes / 60);
  const studentTotal = Number(studentCount[0]?.count ?? 0);
  const lastWeekMin = Number(lastWeekMinutes[0]?.minutes ?? 0);
  const topExercise = mostUsedExercise[0];

  // Insight: 3 KPIs personalizados (PMV)
  const insightStats = [
    {
      label: "Ejercicio más usado",
      value: topExercise?.name ?? "—",
      unit: topExercise ? `${topExercise.uses}×` : "sin datos",
      icon: Sparkles,
      isText: true,
    },
    {
      label: "Tiempo en pista",
      value: lastWeekMin,
      unit: "min · semana pasada",
      icon: Clock,
      isText: false,
    },
    {
      label: "Mis alumnos",
      value: studentTotal,
      unit: studentTotal === 1 ? "alumno" : "alumnos",
      icon: Users,
      isText: false,
    },
  ];

  const stats = [
    {
      label: "Esta semana",
      value: thisWeekCount,
      unit: "sesiones",
      icon: CalendarClock,
    },
    {
      label: "Biblioteca",
      value: exerciseCount[0]?.count ?? 0,
      unit: "ejercicios",
      icon: BookOpen,
    },
    {
      label: "Tiempo en pista",
      value: totalHours,
      unit: "horas",
      icon: Clock,
    },
    {
      label: "Total sesiones",
      value: totalSessions,
      unit: "registradas",
      icon: History,
    },
  ];

  const actions = [
    ...(sessionCreationEnabled
      ? [
          {
            href: "/sessions/new",
            label: "Nueva sesión",
            desc: "Agendar entrenamiento",
            icon: Plus,
            accent: true,
          },
        ]
      : []),
    {
      href: "/exercises/new",
      label: "Nuevo ejercicio",
      desc: "Añadir a tu biblioteca",
      icon: Dumbbell,
    },
    {
      href: "/exercises?tab=favorites",
      label: "Ejercicios favoritos",
      desc: "Tus marcados",
      icon: Heart,
    },
    {
      href: "/classes?tab=favorites",
      label: "Clases favoritas",
      desc: "Plantillas listas",
      icon: GraduationCap,
    },
    {
      href: "/calendar",
      label: "Calendario",
      desc: "Ver agenda",
      icon: CalendarClock,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Resumen */}
      <section
        aria-labelledby="insight-heading"
        className="flex flex-col gap-4"
      >
        <SectionTitle id="insight-heading" title="Resumen" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {insightStats.map(({ label, value, unit, icon: Icon, isText }) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] text-foreground/65">{label}</p>
                <Icon className="size-4 text-brand" strokeWidth={1.7} />
              </div>
              <div className="mt-4">
                {isText ? (
                  <p
                    className="font-heading text-xl text-foreground line-clamp-2"
                    title={String(value)}
                  >
                    {value}
                  </p>
                ) : (
                  <p className="font-heading text-4xl text-foreground tabular-nums">
                    {value}
                  </p>
                )}
                <p className="mt-1 text-[12px] text-foreground/55">{unit}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Estadísticas */}
      <section
        aria-labelledby="stats-heading"
        className="flex flex-col gap-4"
      >
        <SectionTitle id="stats-heading" title="Estadísticas" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ label, value, unit, icon: Icon }) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] text-foreground/65">{label}</p>
                <Icon className="size-4 text-brand" strokeWidth={1.7} />
              </div>
              <p className="mt-4 font-heading text-4xl text-foreground tabular-nums">
                {value}
              </p>
              <p className="mt-1 text-[12px] text-foreground/55">{unit}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionTitle title="Próximas sesiones" />
            <Link
              href="/sessions?filter=upcoming"
              className="text-[12px] text-foreground/60 hover:text-brand transition-colors inline-flex items-center gap-1"
            >
              Ver todas
              <ArrowUpRight className="size-3" />
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {upcomingSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                <Radio className="size-7 text-foreground/35" strokeWidth={1.6} />
                <div>
                  <p className="text-[15px] font-medium text-foreground">
                    No tienes sesiones próximas
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-[13px] text-foreground/55">
                    Crea una sesión para empezar a planificar.
                  </p>
                </div>
                <Link
                  href="/sessions/new"
                  className="mt-1 inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-[13px] font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
                >
                  <Plus className="size-3.5" />
                  Crear sesión
                </Link>
              </div>
            ) : (
              <ol className="divide-y divide-border">
                {upcomingSessions.map((session) => {
                  const date = new Date(session.scheduledAt);
                  return (
                    <li key={session.id}>
                      <Link
                        href={`/sessions/${session.id}`}
                        className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-foreground/[0.025]"
                      >
                        <div className="w-16 shrink-0 border-r border-border pr-3">
                          <p className="font-heading text-xl leading-none text-foreground tabular-nums">
                            {formatDayMonth(date)}
                          </p>
                          <p className="mt-1 text-[11px] uppercase text-foreground/50 tabular-nums">
                            {formatWeekday(date).slice(0, 3)}{" "}
                            {formatTime(date)}
                          </p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14.5px] text-foreground">
                            {session.title}
                          </p>
                          <p className="mt-1 flex items-center gap-3 text-[12px] text-foreground/55">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3" />
                              {session.durationMinutes} min
                            </span>
                            {session.location && (
                              <span className="inline-flex items-center gap-1 truncate">
                                <MapPin className="size-3" />
                                {session.location}
                              </span>
                            )}
                          </p>
                        </div>
                        <ArrowRight className="size-4 text-foreground/30 transition-colors group-hover:text-brand" />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <SectionTitle title="Accesos rápidos" />
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {actions.map(({ href, label, desc, icon: Icon, accent }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.025]"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-md border",
                    accent
                      ? "border-brand/40 bg-brand/10 text-brand"
                      : "border-border text-foreground/60"
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.7} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-[14px] leading-tight",
                      accent ? "text-brand font-medium" : "text-foreground"
                    )}
                  >
                    {label}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-foreground/55">
                    {desc}
                  </span>
                </span>
                <ArrowRight className="size-3.5 text-foreground/30 transition-colors group-hover:text-brand" />
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  const displayName =
    user.user_metadata?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "Coach";
  const now = new Date();
  const sessionCreationEnabled = await getBooleanSetting(
    "feature.session_creation_enabled"
  );

  return (
    <div className="relative min-h-full">
      <div className="flex flex-col gap-8 px-4 py-6 sm:px-6 md:px-10 md:py-8">
        <header className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-border">
          <div>
            <p className="text-[12px] text-foreground/55 mb-1">
              {formatLongDate(now)}
            </p>
            <TimeGreeting
              name={displayName}
              initialGreeting={greetingForHour(now.getHours())}
            />
          </div>
          {sessionCreationEnabled ? (
            <Link
              href="/sessions/new"
              className="inline-flex items-center gap-2 rounded-md bg-brand text-brand-foreground px-4 h-10 text-[13px] font-semibold transition-colors hover:bg-brand/90"
            >
              <Plus className="size-4" />
              Nueva sesión
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/30 px-4 h-10 text-[13px] text-foreground/40">
              <Lock className="size-4" />
              Sesiones bloqueadas
            </span>
          )}
        </header>

        <Suspense fallback={<DashboardBodySkeleton />}>
          <DashboardBody
            userId={user.id}
            sessionCreationEnabled={sessionCreationEnabled}
          />
        </Suspense>
      </div>
    </div>
  );
}
