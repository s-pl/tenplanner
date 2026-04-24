import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  sessions as sessionsTable,
  exercises as exercisesTable,
} from "@/db/schema";
import { and, asc, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  Clock,
  CalendarDays,
  Dumbbell,
  Bot,
} from "lucide-react";
import { AiInsightsWidget } from "@/components/app/dashboard/ai-insights-widget";

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

function DashboardBodySkeleton() {
  return (
    <>
      <section className="space-y-4">
        <div className="h-3 w-32 rounded bg-foreground/10 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-b border-foreground/15 divide-foreground/10 lg:divide-x divide-y lg:divide-y-0">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="px-5 py-6 space-y-3">
              <div className="h-2.5 w-20 rounded bg-foreground/10 animate-pulse" />
              <div className="h-10 w-16 rounded bg-foreground/10 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
      <section className="grid lg:grid-cols-12 gap-10 lg:gap-14">
        <div className="lg:col-span-7 space-y-5">
          <div className="h-3 w-32 rounded bg-foreground/10 animate-pulse" />
          <div className="border-t border-foreground/15 divide-y divide-foreground/10">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="py-5 grid grid-cols-[auto_1fr_auto] items-center gap-5"
              >
                <div className="h-12 w-20 rounded bg-foreground/10 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-40 rounded bg-foreground/10 animate-pulse" />
                  <div className="h-2.5 w-24 rounded bg-foreground/10 animate-pulse" />
                </div>
                <div className="h-3 w-3 rounded bg-foreground/10 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <aside className="lg:col-span-5 space-y-4">
          <div className="h-3 w-24 rounded bg-foreground/10 animate-pulse" />
          <div className="border-t border-foreground/15 divide-y divide-foreground/10">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse" />
            ))}
          </div>
        </aside>
      </section>
    </>
  );
}

function AiInsightsSkeleton() {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-4 pb-2 border-b border-foreground/10">
        <div className="h-3 w-32 rounded bg-foreground/10 animate-pulse" />
        <div className="h-3 w-28 rounded bg-foreground/10 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border border-foreground/15 bg-foreground/[0.02] p-4 space-y-2">
            <div className="h-2.5 w-16 rounded bg-foreground/10 animate-pulse" />
            <div className="h-5 w-28 rounded bg-foreground/10 animate-pulse" />
            <div className="h-3 w-40 rounded bg-foreground/10 animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
}

async function DashboardBody({ userId }: { userId: string }) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());

  const [upcomingSessions, recentSessions, sessionStats, exerciseCount] =
    await Promise.all([
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
            lt(sessionsTable.scheduledAt, now)
          )
        )
        .orderBy(desc(sessionsTable.scheduledAt))
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
    ]);

  const totalSessions = Number(sessionStats[0]?.total ?? 0);
  const totalMinutes = Number(sessionStats[0]?.totalMinutes ?? 0);
  const thisWeekCount = Number(sessionStats[0]?.thisWeekCount ?? 0);
  const totalHours = Math.round(totalMinutes / 60);

  const stats = [
    { label: "Semana en curso", value: thisWeekCount, unit: "sesiones" },
    {
      label: "Biblioteca",
      value: exerciseCount[0]?.count ?? 0,
      unit: "ejercicios",
    },
    { label: "Tiempo pista", value: totalHours, unit: "horas" },
    { label: "Histórico", value: totalSessions, unit: "sesiones" },
  ];

  return (
    <>
      {/* ─── STATS — monocromo, hairline grid ─── */}
      <section aria-labelledby="stats-heading" className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <span className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
                01
              </span>
              <h2
                id="stats-heading"
                className="font-heading italic text-[17px] text-foreground/90"
              >
                Panorámica
              </h2>
            </div>
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-foreground/40">
              Resumen operativo
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-b border-foreground/15 divide-foreground/10 lg:divide-x divide-y lg:divide-y-0">
            {stats.map(({ label, value, unit }, idx) => (
              <div key={label} className="px-5 py-6 relative">
                <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-foreground/45 mb-3">
                  {String(idx + 1).padStart(2, "0")} · {label}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-5xl text-foreground tabular-nums leading-none">
                    {value}
                  </span>
                  <span className="font-sans text-[11px] italic text-foreground/50">
                    {unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── AGENDA + ACCIONES ─── */}
        <section className="grid lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Upcoming — agenda editorial */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-3">
                <span className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
                  02
                </span>
                <h2 className="font-heading italic text-[17px] text-foreground/90">
                  En el horizonte
                </h2>
              </div>
              <Link
                href="/sessions?filter=upcoming"
                className="group font-sans text-[11px] uppercase tracking-[0.18em] text-foreground/55 hover:text-brand transition-colors inline-flex items-center gap-1.5"
              >
                Agenda completa
                <ArrowUpRight className="size-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>

            {upcomingSessions.length === 0 ? (
              <div className="border-t border-b border-foreground/15 py-14 text-center">
                <p className="font-heading italic text-xl text-foreground/80 mb-2">
                  Ninguna sesión en el radar.
                </p>
                <p className="text-[13px] text-foreground/55 max-w-sm mx-auto mb-5">
                  Cuando planifiques entrenamientos aparecerán aquí ordenados
                  por fecha.
                </p>
                <Link
                  href="/sessions/new"
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand border-b border-brand/40 hover:border-brand transition-colors"
                >
                  <Plus className="size-3.5" /> Crear la primera
                </Link>
              </div>
            ) : (
              <ul className="border-t border-foreground/15 divide-y divide-foreground/10">
                {upcomingSessions.map((session, idx) => {
                  const date = new Date(session.scheduledAt);
                  return (
                    <li key={session.id}>
                      <Link
                        href="/sessions"
                        className="group grid grid-cols-[auto_auto_1fr_auto] items-center gap-5 py-5 hover:bg-foreground/[0.02] -mx-3 px-3 transition-colors"
                      >
                        <span className="font-sans text-[10px] tabular-nums tracking-[0.18em] text-foreground/35">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div className="border-l border-foreground/15 pl-5 min-w-[92px]">
                          <p className="font-heading text-[22px] tabular-nums leading-none text-foreground">
                            {formatDayMonth(date)}
                          </p>
                          <p className="mt-1 font-sans text-[10px] tracking-[0.15em] uppercase text-foreground/45 tabular-nums">
                            {formatWeekday(date).slice(0, 3)} ·{" "}
                            {formatTime(date)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[15px] text-foreground leading-tight truncate">
                            {session.title}
                          </p>
                          <p className="mt-1.5 font-sans text-[10px] uppercase tracking-[0.15em] text-foreground/40 tabular-nums">
                            <Clock className="inline size-3 mr-1 -translate-y-px" />
                            {session.durationMinutes} min
                          </p>
                        </div>
                        <ArrowRight className="size-4 text-foreground/30 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Side column — tools + recent */}
          <aside className="lg:col-span-5 space-y-10">
            {/* Tools / quick actions */}
            <div className="space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
                  03
                </span>
                <h2 className="font-heading italic text-[17px] text-foreground/90">
                  Herramientas
                </h2>
              </div>

              <ul className="border-t border-foreground/15 divide-y divide-foreground/10">
                {[
                  {
                    href: "/sessions/dr-planner",
                    label: "Dr. Planner",
                    desc: "Diseña con IA, tú confirmas",
                    tag: "IA",
                    accent: true,
                  },
                  {
                    href: "/sessions/new",
                    label: "Nueva sesión",
                    desc: "Plan manual paso a paso",
                    tag: "MAN",
                  },
                  {
                    href: "/exercises",
                    label: "Biblioteca",
                    desc: "Explora y crea ejercicios",
                    tag: "LIB",
                  },
                  {
                    href: "/calendar",
                    label: "Calendario",
                    desc: "Vista mensual y semanal",
                    tag: "CAL",
                  },
                ].map(({ href, label, desc, tag, accent }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3.5 hover:bg-foreground/[0.02] -mx-3 px-3 transition-colors"
                    >
                      <span
                        className={`font-sans text-[9px] tracking-[0.18em] ${accent ? "text-brand" : "text-foreground/40"}`}
                      >
                        ▸
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`text-[14px] leading-tight ${accent ? "text-brand" : "text-foreground/90"}`}
                        >
                          {label}
                        </p>
                        <p className="text-[11px] text-foreground/55 mt-0.5">
                          {desc}
                        </p>
                      </div>
                      <span
                        className={`font-sans text-[9px] tracking-[0.18em] ${accent ? "text-brand" : "text-foreground/35"} group-hover:text-brand transition-colors`}
                      >
                        {tag}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent activity — archive */}
            {recentSessions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
                    04
                  </span>
                  <h2 className="font-heading italic text-[17px] text-foreground/90">
                    Archivo reciente
                  </h2>
                </div>

                <ul className="border-t border-foreground/15 divide-y divide-foreground/10">
                  {recentSessions.map((session) => {
                    const date = new Date(session.scheduledAt);
                    return (
                      <li
                        key={session.id}
                        className="py-3 grid grid-cols-[auto_1fr_auto] items-baseline gap-4"
                      >
                        <span className="font-sans text-[10px] tracking-[0.14em] tabular-nums text-foreground/45 uppercase">
                          {formatDayMonth(date)}
                        </span>
                        <p className="text-[13px] text-foreground/85 truncate italic">
                          {session.title}
                        </p>
                        <span className="font-sans text-[10px] tabular-nums text-foreground/35">
                          {session.durationMinutes}&prime;
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Editorial footnote */}
            <div className="pt-6 border-t border-foreground/10">
              <p className="font-heading italic text-[13px] text-foreground/45 leading-relaxed">
                &ldquo;La repetición no es memoria: es escultura. Cada sesión
                talla un gesto que acabará siendo instinto.&rdquo;
              </p>
              <p className="mt-2 font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/35">
                Cuaderno · tenplanner
              </p>
            </div>
          </aside>
        </section>
    </>
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

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--foreground) 4%, transparent) 1px, transparent 1px)",
          backgroundSize: "calc(100%/12) 100%",
        }}
      />

      <div className="relative px-6 md:px-10 lg:px-14 py-10 md:py-14 space-y-14">
        {/* ─── MASTHEAD ─── */}
        <header className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50 tabular-nums">
              {formatLongDate(now)}
            </p>
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/40 hidden md:block">
              Pista · Despacho
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-foreground/15">
            <div className="max-w-2xl">
              <h1 className="font-heading text-4xl md:text-5xl leading-[1.05] tracking-tight text-foreground">
                Hola, <em className="italic text-brand">{displayName}</em>.
              </h1>
              <p className="mt-3 text-[15px] text-foreground/65 leading-relaxed">
                Aquí está tu despacho — agenda, biblioteca y asistente, todo a
                un paso.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/sessions/dr-planner"
                className="group inline-flex items-center gap-2 rounded-lg border border-foreground/20 bg-background px-4 py-2.5 text-[13px] font-medium text-foreground/80 hover:border-brand/40 hover:text-brand transition-colors"
              >
                <Bot className="size-4 text-brand" />
                Dr. Planner
              </Link>
              <Link
                href="/sessions/new"
                className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2.5 text-[13px] font-semibold hover:bg-foreground/90 transition-colors"
              >
                <Plus className="size-4" />
                Nueva sesión
              </Link>
            </div>
          </div>
        </header>

        <Suspense fallback={<AiInsightsSkeleton />}>
          <AiInsightsWidget coachId={user.id} />
        </Suspense>

        <Suspense fallback={<DashboardBodySkeleton />}>
          <DashboardBody userId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}
