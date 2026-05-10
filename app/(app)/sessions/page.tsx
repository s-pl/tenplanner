import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  sessions as sessionsTable,
  sessionExercises,
  sessionDrafts,
} from "@/db/schema";
import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import {
  Plus,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Bot,
  Lock,
  Search,
} from "lucide-react";
import { SessionDraftsPanel } from "@/components/app/session-drafts-panel";
import { SessionsSearchInput } from "@/components/app/sessions-search-input";
import { getAppSettings } from "@/lib/app-settings";
type Filter = "upcoming" | "past" | "all" | "drafts";
const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{
    filter?: string;
    page?: string;
    q?: string;
  }>;
}

function formatDayMonth(date: Date) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" })
    .format(date)
    .replace(".", "")
    .toUpperCase();
}
function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("es-ES", { weekday: "short" })
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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");
  const settings = await getAppSettings([
    "feature.dr_planner_enabled",
    "feature.session_creation_enabled",
  ]);
  const drPlannerEnabled = settings.get("feature.dr_planner_enabled") !== false;
  const sessionCreationEnabled =
    settings.get("feature.session_creation_enabled") !== false;

  const { filter, page, q } = await searchParams;
  const activeFilter: Filter =
    filter === "past" ||
    filter === "upcoming" ||
    filter === "all" ||
    filter === "drafts"
      ? filter
      : "all";
  const searchTerm = q?.trim() ?? "";

  const parsedPage = Number(page ?? "1");
  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

  const whereConditions: SQL[] = [eq(sessionsTable.userId, user.id)];
  if (activeFilter === "upcoming")
    whereConditions.push(sql`${sessionsTable.scheduledAt} >= now()`);
  else if (activeFilter === "past")
    whereConditions.push(sql`${sessionsTable.scheduledAt} < now()`);
  if (searchTerm) {
    const searchWhere = or(
      ilike(sessionsTable.title, `%${searchTerm}%`),
      ilike(sessionsTable.description, `%${searchTerm}%`),
      ilike(sessionsTable.objective, `%${searchTerm}%`),
      sql`${sessionsTable.tags}::text ILIKE ${`%${searchTerm}%`}`
    );
    if (searchWhere) whereConditions.push(searchWhere);
  }
  const whereClause =
    and(...whereConditions) ?? eq(sessionsTable.userId, user.id);

  const [allCountRows, filteredCountRows, upcomingCountRows, pastCountRows] =
    await Promise.all([
      db
        .select({ total: count() })
        .from(sessionsTable)
        .where(eq(sessionsTable.userId, user.id)),
      db.select({ total: count() }).from(sessionsTable).where(whereClause),
      db
        .select({ total: count() })
        .from(sessionsTable)
        .where(
          and(
            eq(sessionsTable.userId, user.id),
            sql`${sessionsTable.scheduledAt} >= now()`
          )!
        ),
      db
        .select({ total: count() })
        .from(sessionsTable)
        .where(
          and(
            eq(sessionsTable.userId, user.id),
            sql`${sessionsTable.scheduledAt} < now()`
          )!
        ),
    ]);

  const totalSessions = Number(allCountRows[0]?.total ?? 0);
  const totalFiltered = Number(filteredCountRows[0]?.total ?? 0);
  const upcomingCount = Number(upcomingCountRows[0]?.total ?? 0);
  const pastCount = Number(pastCountRows[0]?.total ?? 0);

  const [draftCountRows] = await db
    .select({ total: count() })
    .from(sessionDrafts)
    .where(eq(sessionDrafts.userId, user.id));
  const draftCount = Number(draftCountRows?.total ?? 0);
  const totalPages =
    totalFiltered > 0 ? Math.ceil(totalFiltered / PAGE_SIZE) : 0;
  const safePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;
  const offset = (safePage - 1) * PAGE_SIZE;

  const sessionRows = await db
    .select({
      id: sessionsTable.id,
      title: sessionsTable.title,
      description: sessionsTable.description,
      scheduledAt: sessionsTable.scheduledAt,
      durationMinutes: sessionsTable.durationMinutes,
      status: sessionsTable.status,
    })
    .from(sessionsTable)
    .where(whereClause)
    .orderBy(asc(sessionsTable.scheduledAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const sessionIds = sessionRows.map((s) => s.id);
  const exerciseCounts =
    sessionIds.length > 0
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

  function sessionsHref(opts: { filter?: Filter; page?: number; q?: string }) {
    const p = new URLSearchParams();
    const f = opts.filter ?? activeFilter;
    if (f !== "all") p.set("filter", f);
    const nextQuery = Object.prototype.hasOwnProperty.call(opts, "q")
      ? opts.q
      : searchTerm;
    if (nextQuery) p.set("q", nextQuery);
    const nextPage = opts.page ?? safePage;
    if (nextPage > 1) p.set("page", String(nextPage));
    const qs = p.toString();
    return qs ? `/sessions?${qs}` : "/sessions";
  }

  const FILTERS: { key: Filter; label: string; n: number }[] = [
    { key: "all", label: "Todas", n: totalSessions },
    { key: "upcoming", label: "Próximas", n: upcomingCount },
    { key: "past", label: "Pasadas", n: pastCount },
    { key: "drafts", label: "Borradores", n: draftCount },
  ];
  return (
    <div className="relative">
      <div className="px-4 sm:px-6 md:px-10 py-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-5 border-b border-border">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-foreground">
              Sesiones
            </h1>
            <p className="mt-1.5 text-[14px] text-foreground/60">
              Entrenamientos agendados con fecha, hora, lugar y alumnos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {drPlannerEnabled && (
              <Link
                href="/sessions/dr-planner"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3.5 h-10 text-[13px] font-medium text-foreground/80 transition-colors hover:border-brand/40 hover:text-brand"
              >
                <Bot className="size-4 text-brand" />
                Dr. Planner
              </Link>
            )}
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
                Bloqueado
              </span>
            )}
          </div>
        </header>

        <>
          {/* Tabs */}
          <nav className="flex flex-wrap gap-1 border-b border-border">
            {FILTERS.map(({ key, label, n }) => {
              const isActive = activeFilter === key;
              return (
                <Link
                  key={key}
                  href={sessionsHref({ filter: key, page: 1 })}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2 ${
                    isActive
                      ? "border-brand text-brand"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  {n > 0 && (
                    <span className="ml-1.5 text-[11px] tabular-nums text-foreground/45">
                      {n}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {activeFilter === "drafts" ? (
            <SessionDraftsPanel showEmptyState />
          ) : (
            <>
              <div className="space-y-3">
                <Suspense
                  fallback={
                    <div className="h-10 w-full rounded-md border border-foreground/20 bg-transparent animate-pulse" />
                  }
                >
                  <SessionsSearchInput defaultValue={searchTerm} />
                </Suspense>

                {searchTerm ? (
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-foreground/55">
                    <span>
                      Resultados para{" "}
                      <span className="font-medium text-foreground">
                        &quot;{searchTerm}&quot;
                      </span>
                    </span>
                    <Link
                      href={sessionsHref({
                        filter: activeFilter,
                        q: undefined,
                        page: 1,
                      })}
                      className="text-brand hover:underline"
                    >
                      Limpiar
                    </Link>
                  </div>
                ) : null}
              </div>

              {sessionRows.length === 0 ? (
                <div className="border border-dashed border-border rounded-lg py-16 text-center">
                  <p className="text-[15px] font-medium text-foreground mb-2">
                    {searchTerm
                      ? "Sin coincidencias"
                      : activeFilter === "upcoming"
                        ? "No tienes sesiones próximas"
                        : activeFilter === "past"
                          ? "No tienes sesiones pasadas"
                          : "Sin sesiones todavía"}
                  </p>
                  <p className="text-[13px] text-foreground/55 max-w-sm mx-auto mb-5">
                    {searchTerm
                      ? `No hay sesiones para "${searchTerm}".`
                      : "Crea una nueva sesión para empezar."}
                  </p>
                  <Link
                    href={
                      searchTerm
                        ? sessionsHref({
                            filter: activeFilter,
                            q: undefined,
                            page: 1,
                          })
                        : "/sessions/new"
                    }
                    className="inline-flex items-center gap-1.5 rounded-md bg-brand text-brand-foreground px-4 py-2 text-[13px] font-semibold hover:bg-brand/90 transition-colors"
                  >
                    {searchTerm ? (
                      <>
                        <Search className="size-3.5" /> Limpiar búsqueda
                      </>
                    ) : (
                      <>
                        <Plus className="size-3.5" /> Crear sesión
                      </>
                    )}
                  </Link>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {sessionRows.map((session) => {
                    const date = new Date(session.scheduledAt);
                    const isPast = date < now;
                    const count = exerciseCountMap.get(session.id) ?? 0;
                    const relative = humanDate(date);
                    const statusLabel =
                      session.status === "completed"
                        ? "Completada"
                        : session.status === "cancelled"
                          ? "Cancelada"
                          : isPast
                            ? "Sin completar"
                            : "Programada";
                    const statusColor =
                      session.status === "completed"
                        ? "bg-brand/10 text-brand border-brand/20"
                        : session.status === "cancelled"
                          ? "bg-destructive/10 text-destructive/80 border-destructive/20"
                          : isPast
                            ? "bg-foreground/5 text-foreground/55 border-border"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/20";

                    return (
                      <li
                        key={session.id}
                        className="rounded-lg border border-border bg-card transition-colors hover:border-brand/30"
                      >
                        <Link
                          href={`/sessions/${session.id}`}
                          className="group flex items-center gap-4 px-4 py-3.5"
                        >
                          <div className="w-20 shrink-0 border-r border-border pr-3">
                            <p className="font-heading text-xl leading-none tabular-nums text-foreground">
                              {formatDayMonth(date)}
                            </p>
                            <p className="mt-1 text-[11px] uppercase text-foreground/50 tabular-nums">
                              {formatWeekday(date)} · {formatTime(date)}
                            </p>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`inline-flex items-center text-[10.5px] font-medium px-1.5 py-0.5 rounded border ${statusColor}`}
                              >
                                {statusLabel}
                              </span>
                              {relative && (
                                <span className="text-[12px] text-foreground/50">
                                  {relative}
                                </span>
                              )}
                            </div>
                            <p className="text-[15px] text-foreground truncate">
                              {session.title}
                            </p>
                            <p className="mt-1 text-[12px] text-foreground/55 tabular-nums">
                              {session.durationMinutes} min ·{" "}
                              {count} {count === 1 ? "ejercicio" : "ejercicios"}
                            </p>
                          </div>

                          <ArrowRight className="size-4 text-foreground/30 group-hover:text-brand transition-colors" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}

              {totalFiltered > 0 && totalPages > 1 && (
                <footer className="flex items-center justify-between pt-3 border-t border-border">
                  <p className="text-[12px] text-foreground/50 tabular-nums">
                    {offset + 1}–{offset + sessionRows.length} de {totalFiltered}
                  </p>
                  <div className="flex items-center gap-3">
                    {safePage > 1 ? (
                      <Link
                        href={sessionsHref({ page: safePage - 1 })}
                        className="inline-flex items-center gap-1.5 text-[13px] text-foreground/70 hover:text-brand transition-colors"
                      >
                        <ArrowLeft className="size-3.5" /> Anterior
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-foreground/25">
                        <ArrowLeft className="size-3.5" /> Anterior
                      </span>
                    )}
                    <span className="text-[12px] text-foreground/50 tabular-nums">
                      {safePage} / {totalPages}
                    </span>
                    {safePage < totalPages ? (
                      <Link
                        href={sessionsHref({ page: safePage + 1 })}
                        className="inline-flex items-center gap-1.5 text-[13px] text-foreground/70 hover:text-brand transition-colors"
                      >
                        Siguiente <ArrowUpRight className="size-3.5" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-foreground/25">
                        Siguiente <ArrowUpRight className="size-3.5" />
                      </span>
                    )}
                  </div>
                </footer>
              )}
            </>
          )}
        </>
      </div>
    </div>
  );
}
