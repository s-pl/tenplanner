import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { sessions as sessionsTable, sessionExercises } from "@/db/schema";
import { and, asc, count, eq, inArray, sql, type SQL } from "drizzle-orm";
import { Plus, Calendar, Clock, Dumbbell, ChevronRight, CheckCircle2, Circle } from "lucide-react";

type Filter = "upcoming" | "past" | "all";
const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ filter?: string; page?: string }>;
}

function formatDate(date: Date) {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days === -1) return "Ayer";

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function SessionsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { filter, page } = await searchParams;
  const activeFilter: Filter =
    filter === "past" || filter === "upcoming" || filter === "all"
      ? filter
      : "all";

  const parsedPage = Number(page ?? "1");
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0
    ? Math.floor(parsedPage)
    : 1;

  const whereConditions: SQL[] = [eq(sessionsTable.userId, user.id)];
  if (activeFilter === "upcoming") {
    whereConditions.push(sql`${sessionsTable.scheduledAt} >= now()`);
  } else if (activeFilter === "past") {
    whereConditions.push(sql`${sessionsTable.scheduledAt} < now()`);
  }
  const whereClause = and(...whereConditions) ?? eq(sessionsTable.userId, user.id);

  const [allCountRows, filteredCountRows] = await Promise.all([
    db
      .select({ total: count() })
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, user.id)),
    db
      .select({ total: count() })
      .from(sessionsTable)
      .where(whereClause),
  ]);

  const totalSessions = Number(allCountRows[0]?.total ?? 0);
  const totalFiltered = Number(filteredCountRows[0]?.total ?? 0);
  const totalPages = totalFiltered > 0 ? Math.ceil(totalFiltered / PAGE_SIZE) : 0;
  const safePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;
  const offset = (safePage - 1) * PAGE_SIZE;

  const sessionRows = await db
    .select()
    .from(sessionsTable)
    .where(whereClause)
    .orderBy(asc(sessionsTable.scheduledAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const sessionIds = sessionRows.map((s) => s.id);
  const exerciseCounts = sessionIds.length > 0
    ? await db
        .select({ sessionId: sessionExercises.sessionId, count: count() })
        .from(sessionExercises)
        .where(inArray(sessionExercises.sessionId, sessionIds))
        .groupBy(sessionExercises.sessionId)
    : [];

  const exerciseCountMap = new Map(
    exerciseCounts.map((r) => [r.sessionId, r.count])
  );

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

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "upcoming", label: "Próximas" },
    { key: "past", label: "Pasadas" },
  ];

  return (
    <div className="px-6 md:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Sesiones de Entrenamiento
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalSessions} {totalSessions !== 1 ? "sesiones" : "sesión"} planificada{totalSessions !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/sessions/new"
          className="inline-flex items-center gap-2 bg-brand text-brand-foreground text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand/90 transition-colors shrink-0"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nueva sesión</span>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 w-fit">
        {FILTERS.map(({ key, label }) => (
          <Link
            key={key}
            href={sessionsHref({ filter: key, page: 1 })}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === key
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Sessions list */}
      {sessionRows.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
          <Calendar className="size-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-medium text-foreground mb-1">
            {activeFilter === "upcoming"
              ? "No hay sesiones próximas"
              : activeFilter === "past"
              ? "No hay sesiones pasadas"
              : "Aún no hay sesiones"}
          </p>
          <p className="text-sm text-muted-foreground mb-5">
            {activeFilter === "all"
              ? "Crea tu primera sesión de entrenamiento para empezar."
              : "Prueba con otro filtro para ver más sesiones."}
          </p>
          <Link
            href="/sessions/new"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand/80 transition-colors"
          >
            <Plus className="size-4" />
            Crear una sesión
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessionRows.map((session) => {
            const date = new Date(session.scheduledAt);
            const isPast = date < now;
            const exerciseCount = exerciseCountMap.get(session.id) ?? 0;

            return (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="group bg-card border border-border rounded-2xl p-5 hover:border-brand/30 transition-colors block"
              >
                <div className="flex items-start gap-4">
                  {/* Status icon */}
                  <div className="shrink-0 mt-0.5">
                    {isPast ? (
                      <CheckCircle2 className="size-5 text-brand" />
                    ) : (
                      <Circle className="size-5 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground text-sm leading-snug">
                        {session.title}
                      </h3>
                      <span
                        className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                          isPast
                            ? "bg-muted text-muted-foreground"
                            : "bg-brand/10 text-brand"
                        }`}
                      >
                        {isPast ? "Completada" : "Próxima"}
                      </span>
                    </div>

                    {session.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {session.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2.5">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="size-3.5" />
                        {formatDate(date)} a las {formatTime(date)}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3.5" />
                        {session.durationMinutes} min
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Dumbbell className="size-3.5" />
                        {exerciseCount} {exerciseCount !== 1 ? "ejercicios" : "ejercicio"}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="shrink-0 size-4 text-muted-foreground group-hover:text-brand transition-colors mt-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {totalFiltered > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Mostrando {sessionRows.length} de {totalFiltered} sesiones
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              {safePage > 1 ? (
                <Link
                  href={sessionsHref({ page: safePage - 1 })}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  Anterior
                </Link>
              ) : (
                <span className="px-3 py-1.5 rounded-lg border border-border/60 text-xs font-semibold text-muted-foreground/40">
                  Anterior
                </span>
              )}

              <span className="text-xs text-muted-foreground">Página {safePage} de {totalPages}</span>

              {safePage < totalPages ? (
                <Link
                  href={sessionsHref({ page: safePage + 1 })}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  Siguiente
                </Link>
              ) : (
                <span className="px-3 py-1.5 rounded-lg border border-border/60 text-xs font-semibold text-muted-foreground/40">
                  Siguiente
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
