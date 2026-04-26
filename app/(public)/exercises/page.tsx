import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  exercises as exercisesTable,
  exerciseDrafts,
  exerciseListItems,
  exerciseLists,
} from "@/db/schema";
import {
  and,
  asc,
  count,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { FavoriteToggle } from "@/components/app/favorite-toggle";
import { ExerciseFilters } from "@/components/app/exercise-filters";
import { ExerciseListsSection } from "@/components/app/exercise-lists-section";
import { ExerciseDraftsPanel } from "@/components/app/exercise-drafts-panel";
import {
  Plus,
  ArrowLeft,
  ArrowUpRight,
  Search,
  ListOrdered,
  Package,
  Globe,
  Sparkles,
  User,
  Clock,
  Lock,
  Heart,
} from "lucide-react";
import { MobileFab } from "@/components/app/mobile-fab";

type Category = "technique" | "tactics" | "fitness" | "warm-up";
type Difficulty = "beginner" | "intermediate" | "advanced";

const CATEGORY_LABEL: Record<Category, string> = {
  technique: "Técnica",
  tactics: "Táctica",
  fitness: "Físico",
  "warm-up": "Calentamiento",
};

const CATEGORY_CODE: Record<Category, string> = {
  technique: "TÉC",
  tactics: "TÁC",
  fitness: "FÍS",
  "warm-up": "CAL",
};

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: "Iniciación",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

const DIFFICULTY_BARS: Record<Difficulty, number> = {
  beginner: 2,
  intermediate: 3,
  advanced: 5,
};

const CATEGORIES = [
  "all",
  "technique",
  "tactics",
  "fitness",
  "warm-up",
] as const;
const DIFFICULTIES = ["all", "beginner", "intermediate", "advanced"] as const;
const TABS = ["all", "global", "mine", "favorites", "drafts"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  all: "Todos",
  global: "Globales",
  mine: "Propios",
  favorites: "Favoritos",
  drafts: "Borradores",
};

const PAGE_SIZE = 30;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getString(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

function getStrings(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function getNumber(v: string | string[] | undefined): number | undefined {
  const s = getString(v);
  const n = Number(s);
  return s && Number.isFinite(n) ? n : undefined;
}

export default async function ExercisesPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const params = await searchParams;

  const activeCategory = (
    CATEGORIES.includes(params.category as never) ? params.category : "all"
  ) as "all" | Category;
  const activeDifficulty = (
    DIFFICULTIES.includes(params.difficulty as never)
      ? params.difficulty
      : "all"
  ) as "all" | Difficulty;

  // Tabs `mine`, `favorites`, `drafts` require auth — fall back to "all" if unauthenticated
  const requestedTab = TABS.includes(params.tab as Tab)
    ? (params.tab as Tab)
    : "all";
  const activeTab: Tab =
    !user &&
    (requestedTab === "mine" ||
      requestedTab === "favorites" ||
      requestedTab === "drafts")
      ? "all"
      : requestedTab;

  const searchTerm = getString(params.q).trim();
  const parsedPage = Number(getString(params.page) || "1");
  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

  // Advanced filters
  const activeFormato = getString(params.formato) || undefined;
  const activeNumJugadores = getNumber(params.numJugadores);
  const activeTipoPelota = getString(params.tipoPelota) || undefined;
  const activeTipoActividad = getString(params.tipoActividad) || undefined;
  const activeGolpes = getStrings(params.golpe);
  const activeEfecto = getStrings(params.efecto);
  const activeMinDuracion = getNumber(params.minDuracion);
  const activeMaxDuracion = getNumber(params.maxDuracion);
  const activeLocation = getString(params.location) || undefined;
  const activePhase = getString(params.phase) || undefined;
  const activeIntensity = getNumber(params.intensity);

  const advancedActive =
    activeFormato ||
    activeNumJugadores != null ||
    activeTipoPelota ||
    activeTipoActividad ||
    activeGolpes.length > 0 ||
    activeEfecto.length > 0 ||
    activeMinDuracion != null ||
    activeMaxDuracion != null ||
    activeLocation ||
    activePhase ||
    activeIntensity != null;

  // Unauthenticated users only see global exercises
  const allVisibleWhere = user
    ? (or(
        eq(exercisesTable.isGlobal, true),
        eq(exercisesTable.createdBy, user.id)
      ) ?? eq(exercisesTable.isGlobal, true))
    : eq(exercisesTable.isGlobal, true);

  const visibilityWhere =
    activeTab === "global"
      ? eq(exercisesTable.isGlobal, true)
      : activeTab === "mine" && user
        ? eq(exercisesTable.createdBy, user.id)
        : allVisibleWhere;

  const listConditions: SQL[] = [];
  // favoritedIds = exercises present in any of the user's lists
  const favRows = user
    ? await db
        .select({ exerciseId: exerciseListItems.exerciseId })
        .from(exerciseListItems)
        .innerJoin(
          exerciseLists,
          eq(exerciseLists.id, exerciseListItems.listId)
        )
        .where(eq(exerciseLists.userId, user.id))
        .catch(() => [] as { exerciseId: string }[])
    : [];
  const favoritedIds = new Set(favRows.map((f) => f.exerciseId));
  const favIdArray = Array.from(favoritedIds);

  {
    if (activeTab === "favorites" && user) {
      listConditions.push(
        favIdArray.length > 0
          ? inArray(exercisesTable.id, favIdArray)
          : sql`1=0`
      );
    } else {
      listConditions.push(visibilityWhere);
    }
    if (activeCategory !== "all")
      listConditions.push(eq(exercisesTable.category, activeCategory));
    if (activeDifficulty !== "all")
      listConditions.push(eq(exercisesTable.difficulty, activeDifficulty));
    if (searchTerm) {
      const searchWhere = or(
        ilike(exercisesTable.name, `%${searchTerm}%`),
        ilike(exercisesTable.description, `%${searchTerm}%`)
      );
      if (searchWhere) listConditions.push(searchWhere);
    }

    if (activeFormato)
      listConditions.push(
        eq(
          exercisesTable.formato,
          activeFormato as "individual" | "parejas" | "grupal" | "multigrupo"
        )
      );
    if (activeNumJugadores != null)
      listConditions.push(eq(exercisesTable.numJugadores, activeNumJugadores));
    if (activeTipoPelota)
      listConditions.push(
        eq(
          exercisesTable.tipoPelota,
          activeTipoPelota as "normal" | "lenta" | "rapida" | "sin_pelota"
        )
      );
    if (activeTipoActividad)
      listConditions.push(
        eq(
          exercisesTable.tipoActividad,
          activeTipoActividad as
            | "tecnico_tactico"
            | "fisico"
            | "cognitivo"
            | "competitivo"
            | "ludico"
        )
      );
    if (activeGolpes.length > 0) {
      const golpeConds = activeGolpes.map(
        (g) =>
          sql`${exercisesTable.golpes}::jsonb @> ${JSON.stringify([g])}::jsonb`
      );
      const combined = or(...golpeConds);
      if (combined) listConditions.push(combined);
    }
    if (activeEfecto.length > 0) {
      const efectoConds = activeEfecto.map(
        (e) =>
          sql`${exercisesTable.efecto}::jsonb @> ${JSON.stringify([e])}::jsonb`
      );
      const combined = or(...efectoConds);
      if (combined) listConditions.push(combined);
    }
    if (activeMinDuracion != null)
      listConditions.push(
        gte(exercisesTable.durationMinutes, activeMinDuracion)
      );
    if (activeMaxDuracion != null)
      listConditions.push(
        lte(exercisesTable.durationMinutes, activeMaxDuracion)
      );
    if (activeLocation)
      listConditions.push(eq(exercisesTable.location, activeLocation));
    if (activePhase)
      listConditions.push(
        eq(
          exercisesTable.phase,
          activePhase as "activation" | "main" | "cooldown"
        )
      );
    if (activeIntensity != null)
      listConditions.push(eq(exercisesTable.intensity, activeIntensity));
  }

  const listWhere = and(...listConditions);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const draftCountRows = user
    ? await db
        .select({ total: count() })
        .from(exerciseDrafts)
        .where(eq(exerciseDrafts.userId, user.id))
    : [{ total: 0 }];
  const draftCount = Number(draftCountRows[0]?.total ?? 0);

  const [rowPage, allRows, globalRows, mineRows, categoryRows] =
    await Promise.all([
      db
        .select({
          id: exercisesTable.id,
          name: exercisesTable.name,
          description: exercisesTable.description,
          category: exercisesTable.category,
          difficulty: exercisesTable.difficulty,
          durationMinutes: exercisesTable.durationMinutes,
          imageUrl: exercisesTable.imageUrl,
          isAiGenerated: exercisesTable.isAiGenerated,
          isGlobal: exercisesTable.isGlobal,
          createdBy: exercisesTable.createdBy,
          formato: exercisesTable.formato,
          numJugadores: exercisesTable.numJugadores,
          tipoActividad: exercisesTable.tipoActividad,
          stepsCount: sql<number>`COALESCE(json_array_length(${exercisesTable.steps}), 0)`,
          materialsCount: sql<number>`COALESCE(json_array_length(${exercisesTable.materials}), 0)`,
        })
        .from(exercisesTable)
        .where(listWhere)
        .orderBy(asc(exercisesTable.name))
        .limit(PAGE_SIZE + 1)
        .offset(offset),
      db.select({ total: count() }).from(exercisesTable).where(allVisibleWhere),
      db
        .select({ total: count() })
        .from(exercisesTable)
        .where(eq(exercisesTable.isGlobal, true)),
      user
        ? db
            .select({ total: count() })
            .from(exercisesTable)
            .where(eq(exercisesTable.createdBy, user.id))
        : Promise.resolve([{ total: 0 }]),
      db
        .select({ category: exercisesTable.category, total: count() })
        .from(exercisesTable)
        .where(visibilityWhere)
        .groupBy(exercisesTable.category),
    ]);

  const hasNextPage = rowPage.length > PAGE_SIZE;
  const filtered = hasNextPage ? rowPage.slice(0, PAGE_SIZE) : rowPage;
  const exerciseListCountRows =
    user && filtered.length > 0
      ? await db
          .select({
            exerciseId: exerciseListItems.exerciseId,
            total: count(),
          })
          .from(exerciseListItems)
          .innerJoin(
            exerciseLists,
            eq(exerciseLists.id, exerciseListItems.listId)
          )
          .where(
            and(
              eq(exerciseLists.userId, user.id),
              inArray(
                exerciseListItems.exerciseId,
                filtered.map((exercise) => exercise.id)
              )
            )
          )
          .groupBy(exerciseListItems.exerciseId)
      : [];
  const exerciseListCountMap = new Map(
    exerciseListCountRows.map((row) => [row.exerciseId, Number(row.total)])
  );

  const byCategoryMap = new Map(
    categoryRows.map((row) => [row.category, Number(row.total)])
  );
  const byCategory = CATEGORIES.slice(1).map((cat) => ({
    cat,
    count: byCategoryMap.get(cat as Category) ?? 0,
  }));

  const tabCounts: Record<Tab, number> = {
    all: Number(allRows[0]?.total ?? 0),
    global: Number(globalRows[0]?.total ?? 0),
    mine: Number(mineRows[0]?.total ?? 0),
    favorites: favIdArray.length,
    drafts: draftCount,
  };
  const masthead = {
    eyebrow: "Método · Catálogo",
    accent: "Biblioteca",
    suffix: "de ejercicios",
    description:
      "Una colección viva: ejercicios globales, propios y generados con criterio. Aquí se edita el lenguaje del método.",
    statusLabel: `${tabCounts.all.toString().padStart(3, "0")} ejercicios visibles`,
  };

  const advancedParams: Record<string, string | string[] | undefined> = {
    formato: activeFormato,
    numJugadores:
      activeNumJugadores != null ? String(activeNumJugadores) : undefined,
    tipoPelota: activeTipoPelota,
    tipoActividad: activeTipoActividad,
    golpe: activeGolpes.length > 0 ? activeGolpes : undefined,
    efecto: activeEfecto.length > 0 ? activeEfecto : undefined,
    minDuracion:
      activeMinDuracion != null ? String(activeMinDuracion) : undefined,
    maxDuracion:
      activeMaxDuracion != null ? String(activeMaxDuracion) : undefined,
    location: activeLocation,
    phase: activePhase,
    intensity: activeIntensity != null ? String(activeIntensity) : undefined,
  };

  function buildHref(params: Record<string, string | string[] | undefined>) {
    const p = new URLSearchParams();
    const merged = { ...advancedParams, ...params };
    if (merged.category && merged.category !== "all")
      p.set("category", merged.category as string);
    if (merged.difficulty && merged.difficulty !== "all")
      p.set("difficulty", merged.difficulty as string);
    if (merged.q) p.set("q", merged.q as string);
    if (merged.tab && merged.tab !== "all") p.set("tab", merged.tab as string);
    if (merged.page && merged.page !== "1")
      p.set("page", merged.page as string);
    if (merged.formato) p.set("formato", merged.formato as string);
    if (merged.numJugadores)
      p.set("numJugadores", merged.numJugadores as string);
    if (merged.tipoPelota) p.set("tipoPelota", merged.tipoPelota as string);
    if (merged.tipoActividad)
      p.set("tipoActividad", merged.tipoActividad as string);
    const gArr = Array.isArray(merged.golpe)
      ? merged.golpe
      : merged.golpe
        ? [merged.golpe]
        : [];
    for (const g of gArr) p.append("golpe", g);
    const eArr = Array.isArray(merged.efecto)
      ? merged.efecto
      : merged.efecto
        ? [merged.efecto]
        : [];
    for (const e of eArr) p.append("efecto", e);
    if (merged.minDuracion) p.set("minDuracion", merged.minDuracion as string);
    if (merged.maxDuracion) p.set("maxDuracion", merged.maxDuracion as string);
    if (merged.location) p.set("location", merged.location as string);
    if (merged.phase) p.set("phase", merged.phase as string);
    if (merged.intensity) p.set("intensity", merged.intensity as string);
    const s = p.toString();
    return `/exercises${s ? `?${s}` : ""}`;
  }

  const FORMATO_LABEL: Record<string, string> = {
    individual: "Individual",
    parejas: "Parejas",
    grupal: "Grupal",
    multigrupo: "Multigrupo",
  };

  const TIPO_ACTIVIDAD_LABEL: Record<string, string> = {
    tecnico_tactico: "Téc-Tác",
    fisico: "Físico",
    cognitivo: "Cognitivo",
    competitivo: "Competitivo",
    ludico: "Lúdico",
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
            {user ? (
              <div className="flex w-full items-center gap-2 sm:w-auto md:shrink-0">
                <Link
                  href="/exercises/new"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand text-background px-4 py-2.5 text-[13px] font-semibold hover:bg-brand/90 transition-colors sm:w-auto"
                >
                  <Plus className="size-4" /> Añadir ejercicio
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-foreground/20 text-foreground/50 px-4 py-2.5 text-[13px] hover:border-foreground/40 hover:text-foreground/70 transition-colors sm:w-auto md:shrink-0"
              >
                <Lock className="size-3.5" strokeWidth={1.8} /> Inicia sesión
                para añadir
              </Link>
            )}
          </div>
        </header>

        <>
          {/* ─── Tabs (propiedad) ─── */}
          <nav className="flex items-end gap-6 overflow-x-auto border-b border-foreground/15 pb-px sm:gap-8">
            {TABS.map((t) => {
              // Hide drafts tab for unauthenticated users
              if (t === "drafts" && !user) return null;

              const isActive = activeTab === t;
              const requiresAuth = !user && (t === "mine" || t === "favorites");

              if (requiresAuth) {
                return (
                  <Link
                    key={t}
                    href="/login"
                    className="group -mb-px flex shrink-0 items-baseline gap-2 border-b-2 border-transparent pb-3 text-foreground/35 hover:text-foreground/50 transition-colors"
                  >
                    <span className="text-[15px] flex items-center gap-1">
                      <Lock className="size-3 inline" strokeWidth={1.8} />
                      {TAB_LABELS[t]}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={t}
                  href={buildHref({
                    category: activeCategory,
                    difficulty: activeDifficulty,
                    q: searchTerm || undefined,
                    tab: t,
                  })}
                  className={`group -mb-px flex shrink-0 items-baseline gap-2 border-b-2 pb-3 transition-colors ${
                    isActive
                      ? "border-brand"
                      : "border-transparent hover:border-foreground/25"
                  }`}
                >
                  <span
                    className={`text-[15px] ${isActive ? "font-heading italic text-foreground" : "text-foreground/60 group-hover:text-foreground"}`}
                  >
                    {TAB_LABELS[t]}
                  </span>
                  <span
                    className={`font-sans text-[10px] tabular-nums tracking-[0.14em] ${isActive ? "text-brand" : "text-foreground/40"}`}
                  >
                    ({tabCounts[t].toString().padStart(2, "0")})
                  </span>
                </Link>
              );
            })}
          </nav>

          {activeTab === "drafts" && user ? (
            <ExerciseDraftsPanel showEmptyState />
          ) : activeTab === "favorites" && user ? (
            <ExerciseListsSection />
          ) : (
            <>
              {/* ─── Category strip ─── */}
              {tabCounts[activeTab] > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 border-t border-b border-foreground/15 divide-foreground/10 md:divide-x divide-y md:divide-y-0">
                  {byCategory.map(({ cat, count }) => {
                    const isActive = activeCategory === cat;
                    return (
                      <Link
                        key={cat}
                        href={buildHref({
                          category: isActive ? "all" : cat,
                          difficulty: activeDifficulty,
                          q: searchTerm || undefined,
                          tab: activeTab,
                        })}
                        className={`group px-5 py-5 transition-colors ${isActive ? "bg-foreground/[0.03]" : "hover:bg-foreground/[0.02]"}`}
                      >
                        <div className="flex items-baseline justify-between">
                          <p
                            className={`font-sans text-[10px] uppercase tracking-[0.2em] ${isActive ? "text-brand" : "text-foreground/45"}`}
                          >
                            {CATEGORY_CODE[cat as Category]} ·{" "}
                            {CATEGORY_LABEL[cat as Category]}
                          </p>
                          {isActive && (
                            <span className="size-1.5 rounded-full bg-brand" />
                          )}
                        </div>
                        <p className="mt-2 font-heading text-3xl tabular-nums leading-none text-foreground">
                          {count}
                        </p>
                        <p className="mt-1.5 font-sans text-[10px] italic text-foreground/45">
                          ejercicios
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* ─── Search + difficulty + filtros avanzados ─── */}
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <form
                    className="flex-1 relative"
                    action="/exercises"
                    method="get"
                  >
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none"
                      strokeWidth={1.6}
                    />
                    <input
                      type="search"
                      name="q"
                      placeholder="Buscar por nombre o descripción…"
                      defaultValue={searchTerm}
                      className="w-full h-10 pl-9 pr-4 text-[13px] bg-transparent border border-foreground/20 rounded-md focus:outline-none focus:border-brand/60 text-foreground placeholder:text-foreground/40 transition-colors"
                    />
                    {activeCategory !== "all" && (
                      <input
                        type="hidden"
                        name="category"
                        value={activeCategory}
                      />
                    )}
                    {activeDifficulty !== "all" && (
                      <input
                        type="hidden"
                        name="difficulty"
                        value={activeDifficulty}
                      />
                    )}
                    {activeTab !== "all" && (
                      <input type="hidden" name="tab" value={activeTab} />
                    )}
                    {activeFormato && (
                      <input
                        type="hidden"
                        name="formato"
                        value={activeFormato}
                      />
                    )}
                    {activeNumJugadores != null && (
                      <input
                        type="hidden"
                        name="numJugadores"
                        value={activeNumJugadores}
                      />
                    )}
                    {activeTipoPelota && (
                      <input
                        type="hidden"
                        name="tipoPelota"
                        value={activeTipoPelota}
                      />
                    )}
                    {activeTipoActividad && (
                      <input
                        type="hidden"
                        name="tipoActividad"
                        value={activeTipoActividad}
                      />
                    )}
                    {activeGolpes.map((g) => (
                      <input key={g} type="hidden" name="golpe" value={g} />
                    ))}
                    {activeEfecto.map((e) => (
                      <input key={e} type="hidden" name="efecto" value={e} />
                    ))}
                    {activeMinDuracion != null && (
                      <input
                        type="hidden"
                        name="minDuracion"
                        value={activeMinDuracion}
                      />
                    )}
                    {activeMaxDuracion != null && (
                      <input
                        type="hidden"
                        name="maxDuracion"
                        value={activeMaxDuracion}
                      />
                    )}
                    {activeLocation && (
                      <input
                        type="hidden"
                        name="location"
                        value={activeLocation}
                      />
                    )}
                    {activePhase && (
                      <input type="hidden" name="phase" value={activePhase} />
                    )}
                    {activeIntensity != null && (
                      <input
                        type="hidden"
                        name="intensity"
                        value={activeIntensity}
                      />
                    )}
                  </form>

                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-foreground/40 px-1 shrink-0">
                      Nivel:
                    </span>
                    {DIFFICULTIES.map((diff) => {
                      const isActive = activeDifficulty === diff;
                      const label =
                        diff === "all"
                          ? "Todos"
                          : DIFFICULTY_LABEL[diff as Difficulty];
                      return (
                        <Link
                          key={diff}
                          href={buildHref({
                            category: activeCategory,
                            difficulty: diff,
                            q: searchTerm || undefined,
                            tab: activeTab,
                          })}
                          className={`px-2.5 py-1.5 text-[11px] font-sans tracking-[0.08em] whitespace-nowrap transition-colors border rounded ${
                            isActive
                              ? "border-brand text-brand bg-brand/5"
                              : "border-foreground/15 text-foreground/55 hover:text-foreground hover:border-foreground/30"
                          }`}
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* ─── Filtros avanzados ─── */}
                <ExerciseFilters
                  currentFilters={{
                    formato: activeFormato,
                    numJugadores: activeNumJugadores,
                    tipoPelota: activeTipoPelota,
                    tipoActividad: activeTipoActividad,
                    golpes: activeGolpes,
                    efecto: activeEfecto,
                    minDuracion: activeMinDuracion,
                    maxDuracion: activeMaxDuracion,
                    location: activeLocation,
                    phase: activePhase,
                    intensity: activeIntensity,
                  }}
                  preserved={{
                    q: searchTerm || undefined,
                    tab: activeTab !== "all" ? activeTab : undefined,
                    category:
                      activeCategory !== "all" ? activeCategory : undefined,
                    difficulty:
                      activeDifficulty !== "all" ? activeDifficulty : undefined,
                  }}
                />

                {/* Active filter summary */}
                {advancedActive && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeFormato && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] bg-brand/8 border border-brand/20 text-brand rounded">
                        Formato: {FORMATO_LABEL[activeFormato]}
                      </span>
                    )}
                    {activeNumJugadores != null && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] bg-brand/8 border border-brand/20 text-brand rounded">
                        {activeNumJugadores} jugador
                        {activeNumJugadores !== 1 ? "es" : ""}
                      </span>
                    )}
                    {activeTipoPelota && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] bg-brand/8 border border-brand/20 text-brand rounded">
                        Pelota: {activeTipoPelota.replace("_", " ")}
                      </span>
                    )}
                    {activeTipoActividad && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] bg-brand/8 border border-brand/20 text-brand rounded">
                        {TIPO_ACTIVIDAD_LABEL[activeTipoActividad] ??
                          activeTipoActividad}
                      </span>
                    )}
                    {activeGolpes.map((g) => (
                      <span
                        key={g}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] bg-brand/8 border border-brand/20 text-brand rounded"
                      >
                        {g.replace(/_/g, " ")}
                      </span>
                    ))}
                    {activeEfecto.map((e) => (
                      <span
                        key={e}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] bg-brand/8 border border-brand/20 text-brand rounded"
                      >
                        Efecto: {e.replace(/_/g, " ")}
                      </span>
                    ))}
                    {(activeMinDuracion != null ||
                      activeMaxDuracion != null) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] bg-brand/8 border border-brand/20 text-brand rounded">
                        {activeMinDuracion ?? ""}–{activeMaxDuracion ?? "∞"} min
                      </span>
                    )}
                    {activeIntensity != null && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] bg-brand/8 border border-brand/20 text-brand rounded">
                        Intensidad {activeIntensity}
                      </span>
                    )}
                    {activePhase && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] bg-brand/8 border border-brand/20 text-brand rounded">
                        Fase: {activePhase}
                      </span>
                    )}
                    {activeLocation && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] bg-brand/8 border border-brand/20 text-brand rounded">
                        {activeLocation}
                      </span>
                    )}
                    <Link
                      href={buildHref({
                        category: activeCategory,
                        difficulty: activeDifficulty,
                        q: searchTerm || undefined,
                        tab: activeTab,
                        formato: undefined,
                        numJugadores: undefined,
                        tipoPelota: undefined,
                        tipoActividad: undefined,
                        golpe: undefined,
                        efecto: undefined,
                        minDuracion: undefined,
                        maxDuracion: undefined,
                        location: undefined,
                        phase: undefined,
                        intensity: undefined,
                      })}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] text-foreground/50 hover:text-foreground border border-foreground/15 rounded transition-colors"
                    >
                      Limpiar filtros
                    </Link>
                  </div>
                )}
              </div>

              {/* ─── Grid ─── */}
              {filtered.length === 0 ? (
                <div className="border-t border-b border-foreground/15 py-20 text-center">
                  <p className="font-heading italic text-2xl text-foreground/80 mb-2">
                    Sin coincidencias.
                  </p>
                  <p className="text-[13px] text-foreground/55 max-w-sm mx-auto mb-5">
                    {searchTerm
                      ? `Nada para «${searchTerm}» con los filtros actuales.`
                      : "Prueba con otra combinación."}
                  </p>
                  <Link
                    href={buildHref({ tab: activeTab })}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand border-b border-brand/40 hover:border-brand transition-colors pb-0.5"
                  >
                    Limpiar filtros
                  </Link>
                </div>
              ) : (
                <ul className="border-t border-foreground/15 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-y divide-foreground/10 md:divide-y-0">
                  {filtered.map((exercise, idx) => {
                    const catLabel =
                      CATEGORY_LABEL[exercise.category as Category];
                    const catCode =
                      CATEGORY_CODE[exercise.category as Category];
                    const diffLabel =
                      DIFFICULTY_LABEL[exercise.difficulty as Difficulty];
                    const diffBars =
                      DIFFICULTY_BARS[exercise.difficulty as Difficulty];
                    const steps = Number(exercise.stepsCount ?? 0);
                    const materials = Number(exercise.materialsCount ?? 0);
                    const globalIdx = offset + idx + 1;

                    let owner: {
                      label: string;
                      icon: React.ElementType;
                    } | null = null;
                    if (exercise.isAiGenerated)
                      owner = { label: "IA", icon: Sparkles };
                    else if (exercise.isGlobal)
                      owner = { label: "GLB", icon: Globe };
                    else if (user && exercise.createdBy === user.id)
                      owner = { label: "PRP", icon: User };

                    const isFavorited = favoritedIds.has(exercise.id);
                    const formatoLabel = exercise.formato
                      ? FORMATO_LABEL[exercise.formato]
                      : null;
                    const actividadLabel = exercise.tipoActividad
                      ? TIPO_ACTIVIDAD_LABEL[exercise.tipoActividad]
                      : null;
                    const savedInLists =
                      exerciseListCountMap.get(exercise.id) ?? 0;

                    return (
                      <li
                        key={exercise.id}
                        className="md:border-b md:border-foreground/10 md:[&:nth-child(3n)]:border-r-0 md:border-r md:border-foreground/10 md:[&:nth-last-child(-n+3)]:border-b-0 flex flex-col"
                      >
                        <div className="flex items-center justify-between px-4 pb-0 pt-5 sm:px-6">
                          <span className="font-sans text-[10px] tabular-nums tracking-[0.18em] text-foreground/35">
                            № {String(globalIdx).padStart(3, "0")}
                          </span>
                          <div className="flex items-center gap-2.5">
                            {owner && (
                              <span
                                className={`inline-flex items-center gap-1 font-sans text-[9px] uppercase tracking-[0.2em] ${
                                  owner.label === "IA"
                                    ? "text-brand"
                                    : "text-foreground/50"
                                }`}
                              >
                                <owner.icon
                                  className="size-2.5"
                                  strokeWidth={1.8}
                                />
                                {owner.label}
                              </span>
                            )}
                            <FavoriteToggle
                              exerciseId={exercise.id}
                              initialFavorited={isFavorited}
                              exerciseName={exercise.name}
                              size="sm"
                              locked={!user}
                            />
                          </div>
                        </div>

                        <Link
                          href={`/exercises/${exercise.id}`}
                          className="group block flex-1 px-4 pb-6 pt-3 transition-colors hover:bg-foreground/[0.02] sm:px-6"
                        >
                          <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-brand mb-1.5">
                            {catCode} · {catLabel}
                          </p>
                          <h3 className="font-heading text-[20px] leading-[1.2] text-foreground mb-2">
                            {exercise.name}
                          </h3>

                          {exercise.description && (
                            <p className="text-[12.5px] text-foreground/60 italic leading-relaxed line-clamp-2 mb-5">
                              {exercise.description}
                            </p>
                          )}

                          {(formatoLabel ||
                            actividadLabel ||
                            exercise.numJugadores) && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {formatoLabel && (
                                <span className="px-1.5 py-0.5 text-[9px] font-sans uppercase tracking-[0.12em] bg-foreground/5 text-foreground/50 rounded">
                                  {formatoLabel}
                                </span>
                              )}
                              {exercise.numJugadores && (
                                <span className="px-1.5 py-0.5 text-[9px] font-sans uppercase tracking-[0.12em] bg-foreground/5 text-foreground/50 rounded">
                                  {exercise.numJugadores}P
                                </span>
                              )}
                              {actividadLabel && (
                                <span className="px-1.5 py-0.5 text-[9px] font-sans uppercase tracking-[0.12em] bg-foreground/5 text-foreground/50 rounded">
                                  {actividadLabel}
                                </span>
                              )}
                            </div>
                          )}

                          {user && savedInLists > 0 ? (
                            <div className="mb-3 flex flex-wrap gap-1">
                              <span className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/8 px-2 py-1 text-[10px] font-medium text-brand">
                                <Heart className="size-3" strokeWidth={1.7} />
                                En {savedInLists} lista
                                {savedInLists !== 1 ? "s" : ""}
                              </span>
                            </div>
                          ) : null}

                          <div className="grid gap-4 border-t border-foreground/10 pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
                            <div className="space-y-1.5">
                              <p className="font-sans text-[9px] uppercase tracking-[0.18em] text-foreground/40">
                                {diffLabel}
                              </p>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <span
                                    key={n}
                                    className={`h-[3px] w-5 rounded-full ${n <= diffBars ? "bg-brand" : "bg-foreground/15"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 font-sans text-[10px] tabular-nums text-foreground/50">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="size-3" strokeWidth={1.6} />{" "}
                                {exercise.durationMinutes}&prime;
                              </span>
                              {steps > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <ListOrdered
                                    className="size-3"
                                    strokeWidth={1.6}
                                  />{" "}
                                  {steps}
                                </span>
                              )}
                              {materials > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <Package
                                    className="size-3"
                                    strokeWidth={1.6}
                                  />{" "}
                                  {materials}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* ─── Pagination ─── */}
              {(currentPage > 1 || hasNextPage) && (
                <footer className="flex flex-col gap-3 border-t border-foreground/15 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/45 tabular-nums">
                    {filtered.length > 0
                      ? `${offset + 1}–${offset + filtered.length}`
                      : "0"}{" "}
                    · Página {currentPage.toString().padStart(2, "0")}
                  </p>
                  <div className="flex items-center gap-5">
                    {currentPage > 1 ? (
                      <Link
                        href={buildHref({
                          category: activeCategory,
                          difficulty: activeDifficulty,
                          q: searchTerm || undefined,
                          tab: activeTab,
                          page: String(currentPage - 1),
                        })}
                        className="inline-flex items-center gap-1.5 text-[12px] text-foreground/70 hover:text-brand transition-colors"
                      >
                        <ArrowLeft className="size-3" /> Anterior
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground/25">
                        <ArrowLeft className="size-3" /> Anterior
                      </span>
                    )}
                    {hasNextPage ? (
                      <Link
                        href={buildHref({
                          category: activeCategory,
                          difficulty: activeDifficulty,
                          q: searchTerm || undefined,
                          tab: activeTab,
                          page: String(currentPage + 1),
                        })}
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
                </footer>
              )}
            </>
          )}
        </>
      </div>
      {user && (
        <MobileFab href="/exercises/new" icon="plus" label="Nuevo ejercicio" />
      )}
    </div>
  );
}
