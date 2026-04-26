import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { sessions as sessionsTable, sessionExercises, sessionDrafts } from "@/db/schema";
import { and, asc, count, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { Plus, ArrowRight, ArrowLeft, ArrowUpRight, Bot, Search } from "lucide-react";
import { MobileFabSpeedDial } from "@/components/app/mobile-fab";
import { SessionDraftsPanel } from "@/components/app/session-drafts-panel";
import { SessionsSearchInput } from "@/components/app/sessions-search-input";
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
function formatYear(date: Date) {
  return new Intl.DateTimeFormat("es-ES", { year: "numeric" }).format(date);
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

  const { filter, page, q } = await searchParams;
  const activeFilter: Filter =
    filter === "past" || filter === "upcoming" || filter === "all" || filter === "drafts"
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

  function sessionsHref(opts: {
    filter?: Filter;
    page?: number;
    q?: string;
  }) {
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
  const masthead = {
    eyebrow: "Planificación · Agenda",
    accent: "Sesiones",
    suffix: "de entrenamiento",
    description:
      "Cada sesión es una hipótesis: un plan que la pista valida o desmiente. Aquí mantienes ritmo, archivo y continuidad.",
    statusLabel: `${totalSessions.toString().padStart(3, "0")} registros`,
  };

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
              {masthead.eyebrow}
            </p>
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/40 tabular-nums">
              {masthead.statusLabel}
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-foreground/15">
            <div className="max-w-2xl">
              <h1 className="font-heading text-4xl md:text-5xl leading-[1.05] tracking-tight text-foreground">
                <em className="italic text-brand">{masthead.accent}</em>{" "}
                {masthead.suffix}
              </h1>
              <p className="mt-3 text-[15px] text-foreground/65 leading-relaxed">
                {masthead.description}
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
                className="inline-flex items-center gap-2 rounded-lg bg-brand text-background px-4 py-2.5 text-[13px] font-semibold hover:bg-brand/90 transition-colors"
              >
                <Plus className="size-4" /> Nueva sesión
              </Link>
            </div>
          </div>
        </header>

        <>
            {/* ─── Filter rail ─── */}
            <nav className="flex items-end gap-8 border-b border-foreground/15">
              {FILTERS.map(({ key, label, n }) => {
                const isActive = activeFilter === key;
                return (
                  <Link
                    key={key}
                    href={sessionsHref({ filter: key, page: 1 })}
                    className={`group pb-3 -mb-px flex items-baseline gap-2 border-b-2 transition-colors ${
                      isActive
                        ? "border-brand"
                        : "border-transparent hover:border-foreground/25"
                    }`}
                  >
                    <span
                      className={`text-[15px] ${isActive ? "font-heading italic text-foreground" : "text-foreground/60 group-hover:text-foreground"}`}
                    >
                      {label}
                    </span>
                    <span
                      className={`font-sans text-[10px] tabular-nums tracking-[0.14em] ${isActive ? "text-brand" : "text-foreground/40"}`}
                    >
                      ({n.toString().padStart(2, "0")})
                    </span>
                  </Link>
                );
              })}
            </nav>

            {activeFilter === "drafts" ? (
              <SessionDraftsPanel showEmptyState />
            ) : <>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-foreground/15 bg-foreground/[0.02] px-4 py-4">
                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/40">
                  Agenda total
                </p>
                <p className="mt-2 font-heading text-3xl leading-none text-foreground">
                  {totalSessions.toString().padStart(2, "0")}
                </p>
                <p className="mt-2 text-[12px] text-foreground/55">
                  Todas las sesiones registradas en tu archivo.
                </p>
              </div>
              <div className="rounded-2xl border border-foreground/15 bg-foreground/[0.02] px-4 py-4">
                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/40">
                  Proximas
                </p>
                <p className="mt-2 font-heading text-3xl leading-none text-foreground">
                  {upcomingCount.toString().padStart(2, "0")}
                </p>
                <p className="mt-2 text-[12px] text-foreground/55">
                  Trabajo futuro ya colocado en la agenda.
                </p>
              </div>
              <div className="rounded-2xl border border-foreground/15 bg-foreground/[0.02] px-4 py-4">
                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/40">
                  Pasadas
                </p>
                <p className="mt-2 font-heading text-3xl leading-none text-foreground">
                  {pastCount.toString().padStart(2, "0")}
                </p>
                <p className="mt-2 text-[12px] text-foreground/55">
                  Archivo util para revisar carga y continuidad.
                </p>
              </div>
              <div className="rounded-2xl border border-brand/20 bg-brand/[0.06] px-4 py-4">
                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-brand/80">
                  Foco actual
                </p>
                <p className="mt-2 font-heading text-3xl leading-none text-foreground">
                  {(searchTerm ? totalFiltered : FILTERS.find((item) => item.key === activeFilter)?.n ?? totalSessions)
                    .toString()
                    .padStart(2, "0")}
                </p>
                <p className="mt-2 text-[12px] text-foreground/60">
                  {searchTerm
                    ? `Coincidencias para «${searchTerm}».`
                    : activeFilter === "all"
                      ? "Vista completa del archivo."
                      : `Sesiones visibles en «${activeFilter === "upcoming" ? "Próximas" : "Pasadas"}».`}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Suspense fallback={
                <div className="h-10 w-full rounded-md border border-foreground/20 bg-transparent animate-pulse" />
              }>
                <SessionsSearchInput defaultValue={searchTerm} />
              </Suspense>

              {searchTerm ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded border border-brand/20 bg-brand/8 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] text-brand">
                    Búsqueda: {searchTerm}
                  </span>
                  <Link
                    href={sessionsHref({
                      filter: activeFilter,
                      q: undefined,
                      page: 1,
                    })}
                    className="inline-flex items-center gap-1 rounded border border-foreground/15 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] text-foreground/50 transition-colors hover:text-foreground"
                  >
                    Limpiar
                  </Link>
                </div>
              ) : null}
            </div>

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
              {searchTerm
                ? `No hay sesiones para «${searchTerm}» con el filtro actual.`
                : activeFilter === "all"
                ? "Diseña tu primera sesión para empezar a dar forma al método."
                : "Prueba con otro filtro o crea una sesión nueva."}
            </p>
            <Link
              href={searchTerm ? sessionsHref({ filter: activeFilter, q: undefined, page: 1 }) : "/sessions/new"}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand border-b border-brand/40 hover:border-brand transition-colors pb-0.5"
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
                        <span
                          className={`font-sans text-[9px] uppercase tracking-[0.2em] ${
                            session.status === "completed"
                              ? "text-brand"
                              : session.status === "cancelled"
                                ? "text-destructive/70"
                                : isPast
                                  ? "text-foreground/55"
                                  : "text-foreground/65"
                          }`}
                        >
                          {session.status === "completed"
                            ? "Completada"
                            : session.status === "cancelled"
                              ? "Cancelada"
                              : isPast
                                ? "Sin completar"
                                : "En agenda"}
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
                        {session.durationMinutes} min{" "}
                        <span className="text-foreground/20 mx-1.5">·</span>{" "}
                        {count} {count === 1 ? "ejercicio" : "ejercicios"}{" "}
                        <span className="text-foreground/20 mx-1.5">·</span>{" "}
                        {formatYear(date)}
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
                  {safePage.toString().padStart(2, "0")} /{" "}
                  {totalPages.toString().padStart(2, "0")}
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
            </>}
        </>
      </div>
      <MobileFabSpeedDial
        primaryLabel="Nueva sesión"
        actions={[
          { href: "/sessions/dr-planner", label: "Dr. Planner", icon: "bot" },
          { href: "/sessions/new", label: "Nueva sesión", icon: "plus" },
        ]}
      />
    </div>
  );
}
