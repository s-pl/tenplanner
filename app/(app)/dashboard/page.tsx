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
  Target,
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
  number,
  title,
  meta,
  id,
}: {
  number: string;
  title: string;
  meta?: string;
  id?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] tabular-nums text-brand">
          {number}
        </span>
        <h2 id={id} className="font-heading text-[18px] italic text-foreground">
          {title}
        </h2>
      </div>
      {meta && (
        <span className="hidden font-mono text-[10px] uppercase text-foreground/42 sm:inline">
          {meta}
        </span>
      )}
    </div>
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

  // Panorámica: 4 stats globales
  const stats = [
    {
      label: "Semana en curso",
      value: thisWeekCount,
      unit: "sesiones",
      icon: CalendarClock,
      cue: "carga viva",
    },
    {
      label: "Biblioteca",
      value: exerciseCount[0]?.count ?? 0,
      unit: "ejercicios",
      icon: BookOpen,
      cue: "arsenal",
    },
    {
      label: "Tiempo en pista",
      value: totalHours,
      unit: "horas",
      icon: Clock,
      cue: "volumen",
    },
    {
      label: "Histórico",
      value: totalSessions,
      unit: "sesiones",
      icon: History,
      cue: "archivo",
    },
  ];

  // Herramientas: 5 accesos rápidos
  const actions = [
    ...(sessionCreationEnabled
      ? [
          {
            href: "/sessions/new",
            label: "Nueva sesión",
            desc: "Construcción manual por bloques",
            tag: "PLAN",
            icon: Plus,
            accent: true,
          },
        ]
      : []),
    {
      href: "/exercises/new",
      label: "Nuevo ejercicio",
      desc: "Crea un ejercicio para tu biblioteca",
      tag: "EJE",
      icon: Dumbbell,
    },
    {
      href: "/exercises?tab=favorites",
      label: "Ejercicios favoritos",
      desc: "Tus ejercicios marcados",
      tag: "FAV",
      icon: Heart,
    },
    {
      href: "/classes?tab=favorites",
      label: "Clases favoritas",
      desc: "Plantillas listas para impartir",
      tag: "CLA",
      icon: GraduationCap,
    },
    {
      href: "/calendar",
      label: "Calendario",
      desc: "Ordena la semana de pista",
      tag: "CAL",
      icon: CalendarClock,
    },
  ];

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      {/* Insight: 3 KPIs */}
      <section
        aria-labelledby="insight-heading"
        className="flex flex-col gap-4"
      >
        <SectionTitle
          id="insight-heading"
          number="01"
          title="Insight"
          meta="hoy mismo"
        />
        <div className="ink-panel grid grid-cols-1 border border-foreground/12 bg-card/90 sm:grid-cols-3">
          {insightStats.map(({ label, value, unit, icon: Icon, isText }) => (
            <div
              key={label}
              className="relative min-h-32 border-b border-r border-foreground/10 p-5 last:border-r-0 sm:[&:nth-child(3n)]:border-r-0 sm:border-b-0"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-[12px] text-foreground/72">{label}</p>
                <Icon className="size-4 text-brand" strokeWidth={1.7} />
              </div>
              <div className="mt-5 flex items-end justify-between gap-3">
                {isText ? (
                  <span
                    className="font-heading text-2xl leading-tight italic text-foreground line-clamp-2"
                    title={String(value)}
                  >
                    {value}
                  </span>
                ) : (
                  <span className="font-heading text-5xl leading-none text-foreground tabular-nums">
                    {value}
                  </span>
                )}
                <span className="pb-1 font-mono text-[10px] uppercase text-foreground/45 text-right">
                  {unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Panorámica */}
      <section
        aria-labelledby="panoramica-heading"
        className="flex flex-col gap-4"
      >
        <SectionTitle
          id="panoramica-heading"
          number="02"
          title="Panorámica"
          meta="resumen vivo"
        />

        <div className="ink-panel grid grid-cols-1 border border-foreground/12 bg-card/90 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, unit, icon: Icon, cue }, idx) => (
            <div
              key={label}
              className="relative min-h-36 border-b border-r border-foreground/10 p-5 last:border-r-0 sm:[&:nth-child(2n)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2n)]:border-r xl:last:border-r-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase text-foreground/45">
                    {String(idx + 1).padStart(2, "0")} / {cue}
                  </p>
                  <p className="mt-2 text-[13px] text-foreground/72">{label}</p>
                </div>
                <Icon className="size-4 text-brand" strokeWidth={1.7} />
              </div>
              <div className="mt-7 flex items-end justify-between gap-3">
                <span className="font-heading text-6xl leading-none text-foreground tabular-nums">
                  {value}
                </span>
                <span className="pb-1 font-mono text-[10px] uppercase text-foreground/45">
                  {unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <SectionTitle number="03" title="Horizonte" />
            <Link
              href="/sessions?filter=upcoming"
              className="group inline-flex items-center gap-1.5 font-mono text-[10px] uppercase text-foreground/55 transition-colors hover:text-brand"
            >
              Agenda completa
              <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="ink-panel overflow-hidden border border-foreground/12 bg-card/90">
            {upcomingSessions.length === 0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                <Radio className="size-8 text-brand" strokeWidth={1.6} />
                <div>
                  <p className="font-heading text-2xl italic text-foreground">
                    Radar limpio.
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-foreground/58">
                    Crea la siguiente sesión y la agenda se convertirá en una
                    línea de mando.
                  </p>
                </div>
                <Link
                  href="/sessions/new"
                  className="inline-flex items-center gap-2 border border-brand/45 bg-brand px-4 py-2 text-[12px] font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
                >
                  <Plus className="size-3.5" />
                  Crear sesión
                </Link>
              </div>
            ) : (
              <ol className="divide-y divide-foreground/10">
                {upcomingSessions.map((session, idx) => {
                  const date = new Date(session.scheduledAt);
                  return (
                    <li key={session.id}>
                      <Link
                        href={`/sessions/${session.id}`}
                        className="group grid min-h-24 grid-cols-[88px_1fr_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-foreground/[0.025] sm:grid-cols-[110px_1fr_130px_auto] sm:px-5"
                      >
                        <div className="border-r border-foreground/12 pr-4">
                          <p className="font-mono text-[10px] tabular-nums text-brand">
                            {String(idx + 1).padStart(2, "0")}
                          </p>
                          <p className="mt-2 font-heading text-2xl leading-none text-foreground tabular-nums">
                            {formatDayMonth(date)}
                          </p>
                          <p className="mt-1 font-mono text-[10px] uppercase text-foreground/45">
                            {formatWeekday(date).slice(0, 3)} {formatTime(date)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[15px] leading-tight text-foreground">
                            {session.title}
                          </p>
                          <p className="mt-2 flex items-center gap-2 text-[12px] text-foreground/55">
                            <Clock className="size-3.5 text-brand" />
                            {session.durationMinutes} min
                          </p>
                        </div>
                        <p className="hidden items-center gap-2 truncate font-mono text-[10px] uppercase text-foreground/45 sm:flex">
                          <MapPin className="size-3 text-foreground/35" />
                          {session.location || "pista"}
                        </p>
                        <ArrowRight className="size-4 text-foreground/30 transition-all group-hover:translate-x-1 group-hover:text-brand" />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <SectionTitle number="04" title="Herramientas" />
            <div className="ink-panel border border-foreground/12 bg-card/90">
              {actions.map(({ href, label, desc, tag, icon: Icon, accent }) => (
                <Link
                  key={href}
                  href={href}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-foreground/10 px-4 py-4 transition-colors last:border-b-0 hover:bg-foreground/[0.025]"
                >
                  <span
                    className={`flex size-9 items-center justify-center border ${
                      accent
                        ? "border-brand/45 bg-brand/10 text-brand"
                        : "border-foreground/12 text-foreground/58"
                    }`}
                  >
                    <Icon className="size-4" strokeWidth={1.7} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-[14px] leading-tight ${
                        accent ? "text-brand" : "text-foreground"
                      }`}
                    >
                      {label}
                    </span>
                    <span className="mt-1 block truncate text-[12px] text-foreground/55">
                      {desc}
                    </span>
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase transition-colors ${
                      accent ? "text-brand" : "text-foreground/35"
                    } group-hover:text-brand`}
                  >
                    {tag}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="ledger-surface border border-foreground/12 p-5">
            <p className="font-heading text-[15px] italic leading-relaxed text-foreground/58">
              &ldquo;La repetición no es memoria: es escultura. Cada sesión
              talla un gesto que acabará siendo instinto.&rdquo;
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase text-foreground/40">
              Cuaderno / tenplanner
            </p>
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
      <div className="relative flex flex-col gap-10 px-4 py-6 sm:px-6 md:px-10 md:py-10 lg:px-14 xl:gap-12">
        <header className="ink-panel overflow-hidden border border-foreground/12 bg-card/90">
          <div className="flex min-h-[260px] flex-col gap-9 p-5 sm:p-7 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <p className="font-mono text-[10px] uppercase text-foreground/45">
                {formatLongDate(now)}
              </p>
              <p className="hidden font-mono text-[10px] uppercase text-foreground/38 sm:block">
                Pista · despacho
              </p>
            </div>

            <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="max-w-4xl">
                <TimeGreeting
                  name={displayName}
                  initialGreeting={greetingForHour(now.getHours())}
                />
                <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-foreground/62 sm:text-base">
                  Aquí está tu despacho: agenda, biblioteca y asistente, todo a
                  un paso.
                </p>
              </div>

              <div className="grid gap-2 lg:min-w-[220px]">
                {sessionCreationEnabled ? (
                  <Link
                    href="/sessions/new"
                    className="inline-flex h-11 items-center justify-center gap-2 border border-foreground bg-foreground px-4 text-[13px] font-semibold text-background transition-colors hover:bg-foreground/90"
                  >
                    <Plus className="size-4" />
                    Nueva sesión
                  </Link>
                ) : (
                  <span className="inline-flex h-11 items-center justify-center gap-2 border border-foreground/12 bg-foreground/[0.03] px-4 text-[13px] font-semibold text-foreground/38">
                    <Lock className="size-4" />
                    Sesiones bloqueadas
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-foreground/12" />
          </div>
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
