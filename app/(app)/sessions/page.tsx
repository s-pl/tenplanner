import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { sessions as sessionsTable, sessionExercises } from "@/db/schema";
import { and, asc, count, eq, inArray, sql, type SQL } from "drizzle-orm";
import { Plus, ArrowRight, ArrowLeft, ArrowUpRight, Bot } from "lucide-react";

type Filter = "upcoming" | "past" | "all";
const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ filter?: string; page?: string }>;
}

function formatDayMonth(date: Date) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" })
    .format(date).replace(".", "").toUpperCase();
}
function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("es-ES", { weekday: "short" })
    .format(date).replace(".", "").toUpperCase();
}
function formatYear(date: Date) {
  return new Intl.DateTimeFormat("es-ES", { year: "numeric" }).format(date);
}
function formatTime(date: Date) {
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(date);
}
function humanDate(date: Date) {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "hoy";
  if (days === 1) return "mañana";
  if (days === -1) return "ayer";
  if (days > 1 && days < 7) return `en ${days} días`;
  if (days < -1 && days > -7) return `hace ${-days} días`;
  return null;
}

export default async function SessionsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { filter, page } = await searchParams;
  const activeFilter: Filter =
    filter === "past" || filter === "upcoming" || filter === "all" ? filter : "all";

  const parsedPage = Number(page ?? "1");
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

  const whereConditions: SQL[] = [eq(sessionsTable.userId, user.id)];
  if (activeFilter === "upcoming") whereConditions.push(sql`${sessionsTable.scheduledAt} >= now()`);
  else if (activeFilter === "past") whereConditions.push(sql`${sessionsTable.scheduledAt} < now()`);
  const whereClause = and(...whereConditions) ?? eq(sessionsTable.userId, user.id);

  const [allCountRows, filteredCountRows, upcomingCountRows, pastCountRows] = await Promise.all([
    db.select({ total: count() }).from(sessionsTable).where(eq(sessionsTable.userId, user.id)),
    db.select({ total: count() }).from(sessionsTable).where(whereClause),
    db.select({ total: count() }).from(sessionsTable)
      .where(and(eq(sessionsTable.userId, user.id), sql`${sessionsTable.scheduledAt} >= now()`)!),
    db.select({ total: count() }).from(sessionsTable)
      .where(and(eq(sessionsTable.userId, user.id), sql`${sessionsTable.scheduledAt} < now()`)!),
  ]);

  const totalSessions = Number(allCountRows[0]?.total ?? 0);
  const totalFiltered = Number(filteredCountRows[0]?.total ?? 0);
  const upcomingCount = Number(upcomingCountRows[0]?.total ?? 0);
  const pastCount = Number(pastCountRows[0]?.total ?? 0);
  const totalPages = totalFiltered > 0 ? Math.ceil(totalFiltered / PAGE_SIZE) : 0;
  const safePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;
  const offset = (safePage - 1) * PAGE_SIZE;

  const sessionRows = await db
    .select().from(sessionsTable).where(whereClause)
    .orderBy(asc(sessionsTable.scheduledAt)).limit(PAGE_SIZE).offset(offset);

  const sessionIds = sessionRows.map((s) => s.id);
  const exerciseCounts = sessionIds.length > 0
    ? await db
        .select({ sessionId: sessionExercises.sessionId, count: count() })
        .from(sessionExercises)
        .where(inArray(sessionExercises.sessionId, sessionIds))
        .groupBy(sessionExercises.sessionId)
    : [];
  const exerciseCountMap = new Map(exerciseCounts.map((r) => [r.sessionId, r.count]));

  const now = new Date();

  function sessionsHref(params: { filter?: Filter; page?: number }) {
    const p = new URLSearchParams();
    const f = params.filter ?? activeFilter;
    if (f !== "all") p.set("filter", f);
    const nextPage = params.page ?? safePage;
    if (nextPage > 1) p.set("page", String(nextPage));
    const q = p.toString();
    return q ? `/sessions?${q}` : "/sessions";
  }

  const FILTERS: { key: Filter; label: string; n: number }[] = [
    { key: "all",      label: "Todas",    n: totalSessions },
    { key: "upcoming", label: "Próximas", n: upcomingCount },
    { key: "past",     label: "Pasadas",  n: pastCount },
  ];

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

      <div className="relative px-4 sm:px-6 md:px-10 lg:px-14 py-10 md:py-14 space-y-10">

        {/* ─── Masthead ─── */}
        <header className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
              Planificación · Agenda
            </p>
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/40 tabular-nums">
              {totalSessions.toString().padStart(3, "0")} registros
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-foreground/15">
            <div className="max-w-2xl">
              <h1 className="font-heading text-4xl md:text-5xl leading-[1.05] tracking-tight text-foreground">
                <em className="italic text-brand">Sesiones</em> de entrenamiento
              </h1>
              <p className="mt-3 text-[15px] text-foreground/65 leading-relaxed">
                Cada sesión es una hipótesis: un plan que la pista valida o desmiente.
                Aquí vives con las que están por venir y las que ya han pasado.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/sessions/dr-planner"
                className="group inline-flex items-center gap-2 rounded-lg border border-foreground/20 bg-background px-4 py-2.5 text-[13px] font-medium text-foreground/80 hover:border-brand/40 hover:text-brand transition-colors"
              >
                <Bot className="size-4 text-brand" /> Dr. Planner
              </Link>
              <Link
                href="/sessions/new"
                className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2.5 text-[13px] font-semibold hover:bg-foreground/90 transition-colors"
              >
                <Plus className="size-4" /> Nueva sesión
              </Link>
            </div>
          </div>
        </header>

        {/* ─── Filter rail ─── */}
        <nav className="flex items-end gap-8 border-b border-foreground/15">
          {FILTERS.map(({ key, label, n }) => {
            const isActive = activeFilter === key;
            return (
              <Link
                key={key}
                href={sessionsHref({ filter: key, page: 1 })}
                className={`group pb-3 -mb-px flex items-baseline gap-2 border-b-2 transition-colors ${
                  isActive ? "border-brand" : "border-transparent hover:border-foreground/25"
                }`}
              >
                <span className={`text-[15px] ${isActive ? "font-heading italic text-foreground" : "text-foreground/60 group-hover:text-foreground"}`}>
                  {label}
                </span>
                <span className={`font-sans text-[10px] tabular-nums tracking-[0.14em] ${isActive ? "text-brand" : "text-foreground/40"}`}>
                  ({n.toString().padStart(2, "0")})
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ─── List ─── */}
        {sessionRows.length === 0 ? (
          <div className="border-t border-b border-foreground/15 py-20 text-center">
            <p className="font-heading italic text-2xl text-foreground/80 mb-2">
              {activeFilter === "upcoming"
                ? "La agenda está despejada."
                : activeFilter === "past"
                ? "Aún no hay archivo que mirar."
                : "Ninguna sesión registrada."}
            </p>
            <p className="text-[13px] text-foreground/55 max-w-sm mx-auto mb-6">
              {activeFilter === "all"
                ? "Diseña tu primera sesión para empezar a dar forma al método."
                : "Prueba con otro filtro o crea una sesión nueva."}
            </p>
            <Link
              href="/sessions/new"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand border-b border-brand/40 hover:border-brand transition-colors pb-0.5"
            >
              <Plus className="size-3.5" /> Crear sesión
            </Link>
          </div>
        ) : (
          <ul className="border-t border-foreground/15 divide-y divide-foreground/10">
            {sessionRows.map((session, idx) => {
              const date = new Date(session.scheduledAt);
              const isPast = date < now;
              const count = exerciseCountMap.get(session.id) ?? 0;
              const relative = humanDate(date);
              const globalIdx = offset + idx + 1;

              return (
                <li key={session.id}>
                  <Link
                    href={`/sessions/${session.id}`}
                    className="group grid grid-cols-[auto_auto_1fr_auto] items-center gap-5 md:gap-8 py-6 -mx-3 px-3 hover:bg-foreground/[0.02] transition-colors"
                  >
                    <span className="font-sans text-[10px] tabular-nums tracking-[0.18em] text-foreground/35 w-6">
                      {String(globalIdx).padStart(2, "0")}
                    </span>

                    <div className="border-l border-foreground/15 pl-5 min-w-[104px]">
                      <p className="font-heading text-[24px] leading-none tabular-nums text-foreground">
                        {formatDayMonth(date)}
                      </p>
                      <p className="mt-1.5 font-sans text-[10px] tracking-[0.15em] uppercase text-foreground/45 tabular-nums">
                        {formatWeekday(date)} · {formatTime(date)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`font-sans text-[9px] uppercase tracking-[0.2em] ${
                          isPast ? "text-foreground/40" : "text-brand"
                        }`}>
                          {isPast ? "Archivada" : "En agenda"}
                        </span>
                        {relative && (
                          <span className="font-sans text-[10px] italic text-foreground/45">
                            · {relative}
                          </span>
                        )}
                      </div>
                      <p className="text-[16px] text-foreground leading-snug truncate">
                        {session.title}
                      </p>
                      {session.description && (
                        <p className="mt-1 text-[12px] text-foreground/55 truncate italic">
                          {session.description}
                        </p>
                      )}
                      <p className="mt-2 font-sans text-[10px] uppercase tracking-[0.16em] text-foreground/40 tabular-nums">
                        {session.durationMinutes} min  <span className="text-foreground/20 mx-1.5">·</span>  {count} {count === 1 ? "ejercicio" : "ejercicios"}  <span className="text-foreground/20 mx-1.5">·</span>  {formatYear(date)}
                      </p>
                    </div>

                    <ArrowRight className="size-4 text-foreground/30 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* ─── Pagination ─── */}
        {totalFiltered > 0 && (
          <footer className="flex items-center justify-between pt-2 border-t border-foreground/15">
            <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/45 tabular-nums">
              {offset + 1}–{offset + sessionRows.length} / {totalFiltered}
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-5">
                {safePage > 1 ? (
                  <Link
                    href={sessionsHref({ page: safePage - 1 })}
                    className="inline-flex items-center gap-1.5 text-[12px] text-foreground/70 hover:text-brand transition-colors"
                  >
                    <ArrowLeft className="size-3" /> Anterior
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground/25">
                    <ArrowLeft className="size-3" /> Anterior
                  </span>
                )}
                <span className="font-sans text-[10px] tracking-[0.18em] text-foreground/50 tabular-nums">
                  {safePage.toString().padStart(2, "0")} / {totalPages.toString().padStart(2, "0")}
                </span>
                {safePage < totalPages ? (
                  <Link
                    href={sessionsHref({ page: safePage + 1 })}
                    className="inline-flex items-center gap-1.5 text-[12px] text-foreground/70 hover:text-brand transition-colors"
                  >
                    Siguiente <ArrowUpRight className="size-3" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground/25">
                    Siguiente <ArrowUpRight className="size-3" />
                  </span>
                )}
              </div>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
