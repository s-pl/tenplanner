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
import { FeatureLocked } from "@/components/app/feature-locked";
import { getBooleanSetting } from "@/lib/app-settings";
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
  all: "Ver todos",
  global: "Biblioteca",
  mine: "Mis ejercicios",
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
  const [publicExercisesEnabled, exerciseCreationEnabled] = await Promise.all([
    getBooleanSetting("feature.public_exercises_enabled"),
    getBooleanSetting("feature.exercise_creation_enabled"),
  ]);

  if (!publicExercisesEnabled && !user) {
    return (
      <FeatureLocked
        title="Biblioteca global desactivada"
        description="El administrador ha pausado temporalmente la biblioteca pública de ejercicios."
        href="/"
        cta="Volver al inicio"
      />
    );
  }

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
      : !publicExercisesEnabled && requestedTab === "global"
        ? "mine"
        : requestedTab;

  const searchTerm = getString(params.q).trim();
  const parsedPage = Number(getString(params.page) || "1");
  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

  // Advanced filters
  const activeFormato = getString(params.formato) || undefined;
  const activeNivel = getString(params.nivel) || undefined;
  const activeAspectoJuego = getString(params.aspectoJuego) || undefined;
  const activeParametro = getString(params.parametro) || undefined;
  const activeTipologia = getString(params.tipologia) || undefined;
  const activeDuracionRango = getString(params.duracionRango) || undefined;
  const activeNumJugadores = getNumber(params.numJugadores);
  const activeTipoPelota = getString(params.tipoPelota) || undefined;
  const activeTipoActividad = getString(params.tipoActividad) || undefined;
  const activeGolpes = getStrings(params.golpe);
  const activeEfecto = getStrings(params.efecto);
  const activeMinDuracion = getNumber(params.minDuracion);
  const activeMaxDuracion = getNumber(params.maxDuracion);
  const activeLocation = getString(params.location) || undefined;

  const advancedActive =
    activeFormato ||
    activeNivel ||
    activeAspectoJuego ||
    activeParametro ||
    activeTipologia ||
    activeDuracionRango ||
    activeNumJugadores != null ||
    activeTipoPelota ||
    activeTipoActividad ||
    activeGolpes.length > 0 ||
    activeEfecto.length > 0 ||
    activeMinDuracion != null ||
    activeMaxDuracion != null ||
    activeLocation;

  // Unauthenticated users only see global exercises
  const allVisibleWhere = user
    ? publicExercisesEnabled
      ? (or(
          eq(exercisesTable.isGlobal, true),
          eq(exercisesTable.createdBy, user.id)
        ) ?? eq(exercisesTable.createdBy, user.id))
      : eq(exercisesTable.createdBy, user.id)
    : publicExercisesEnabled
      ? eq(exercisesTable.isGlobal, true)
      : sql`1=0`;

  const visibilityWhere =
    activeTab === "global"
      ? publicExercisesEnabled
        ? eq(exercisesTable.isGlobal, true)
        : sql`1=0`
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
    if (activeNivel) listConditions.push(eq(exercisesTable.nivel, activeNivel));
    if (activeAspectoJuego)
      listConditions.push(eq(exercisesTable.aspectoJuego, activeAspectoJuego));
    if (activeParametro)
      listConditions.push(eq(exercisesTable.parametro, activeParametro));
    if (activeTipologia)
      listConditions.push(eq(exercisesTable.tipologia, activeTipologia));
    if (activeDuracionRango)
      listConditions.push(
        eq(exercisesTable.duracionRango, activeDuracionRango)
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
      publicExercisesEnabled
        ? db
            .select({ total: count() })
            .from(exercisesTable)
            .where(eq(exercisesTable.isGlobal, true))
        : Promise.resolve([{ total: 0 }]),
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

  const advancedParams: Record<string, string | string[] | undefined> = {
    formato: activeFormato,
    nivel: activeNivel,
    aspectoJuego: activeAspectoJuego,
    parametro: activeParametro,
    tipologia: activeTipologia,
    duracionRango: activeDuracionRango,
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
    if (merged.nivel) p.set("nivel", merged.nivel as string);
    if (merged.aspectoJuego)
      p.set("aspectoJuego", merged.aspectoJuego as string);
    if (merged.parametro) p.set("parametro", merged.parametro as string);
    if (merged.tipologia) p.set("tipologia", merged.tipologia as string);
    if (merged.duracionRango)
      p.set("duracionRango", merged.duracionRango as string);
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
    <div className="relative min-h-full overflow-hidden bg-[#F4F4F1] text-[#050505] dark:bg-[#050505] dark:text-[#F4F4F1]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_82%_20%,rgba(214,255,56,0.22),transparent_34%),linear-gradient(180deg,rgba(5,5,5,0.06),transparent)] dark:bg-[radial-gradient(circle_at_82%_20%,rgba(214,255,56,0.18),transparent_34%)]" />
      <div className="relative px-4 py-6 sm:px-6 md:px-10 lg:px-12">
        <header className="overflow-hidden rounded-lg bg-[#050505] text-white shadow-[0_24px_80px_rgba(5,5,5,0.18)]">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-8">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-[#D6FF38]">
                Biblioteca pública
              </p>
              <h1 className="mt-3 font-heading text-4xl font-semibold leading-none tracking-normal text-white sm:text-5xl">
                Ejercicios
              </h1>
              <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-white/68">
                Biblioteca de ejercicios sueltos, etiquetados por nivel,
                categoría y duración para entrenadores de deportes de raqueta.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end lg:justify-between">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2">
                  <p className="font-heading text-2xl leading-none text-[#D6FF38]">
                    {tabCounts.all}
                  </p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/45">
                    Total
                  </p>
                </div>
                <div className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2">
                  <p className="font-heading text-2xl leading-none text-white">
                    {tabCounts.global}
                  </p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/45">
                    Global
                  </p>
                </div>
                <div className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2">
                  <p className="font-heading text-2xl leading-none text-white">
                    {tabCounts.favorites}
                  </p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/45">
                    Listas
                  </p>
                </div>
              </div>
              <div>
                {user && exerciseCreationEnabled ? (
                  <Link
                    href="/exercises/new"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D6FF38] px-5 text-[13px] font-black text-[#050505] transition hover:bg-white"
                  >
                    <Plus className="size-4" />
                    Nuevo ejercicio
                  </Link>
                ) : user ? (
                  <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/14 bg-white/[0.04] px-5 text-[13px] font-semibold text-white/45">
                    <Lock className="size-4" />
                    Bloqueado
                  </span>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/18 px-5 text-[13px] font-semibold text-white/72 transition hover:border-[#D6FF38] hover:text-[#D6FF38]"
                  >
                    <Lock className="size-3.5" />
                    Inicia sesión para añadir
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="h-2 bg-[#D6FF38]" />
        </header>

        <div className="mt-6 space-y-6">
          <>
            {/* Tabs */}
            <nav className="flex gap-2 overflow-x-auto rounded-lg border border-[#050505]/10 bg-white/70 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
              {TABS.map((t) => {
                if (t === "global" && !publicExercisesEnabled) return null;
                if (t === "drafts" && !user) return null;

                const isActive = activeTab === t;
                const requiresAuth =
                  !user && (t === "mine" || t === "favorites");

                if (requiresAuth) {
                  return (
                    <Link
                      key={t}
                      href="/login"
                      className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-foreground/35 transition-colors hover:bg-[#050505]/5 hover:text-foreground/55 dark:hover:bg-white/8"
                    >
                      <Lock className="size-3" strokeWidth={1.8} />
                      {TAB_LABELS[t]}
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
                    className={`inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-[#D6FF38] text-[#050505]"
                        : "text-muted-foreground hover:bg-[#050505]/5 hover:text-foreground dark:hover:bg-white/8"
                    }`}
                  >
                    {TAB_LABELS[t]}
                    {tabCounts[t] > 0 && (
                      <span className="ml-1.5 text-[11px] tabular-nums opacity-60">
                        {tabCounts[t]}
                      </span>
                    )}
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
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
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
                          className={`group rounded-lg border px-5 py-5 transition-all ${
                            isActive
                              ? "border-[#D6FF38] bg-[#D6FF38] text-[#050505] shadow-[0_18px_40px_rgba(214,255,56,0.24)]"
                              : "border-[#050505]/10 bg-white/70 hover:border-[#050505]/20 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-[#D6FF38]/40"
                          }`}
                        >
                          <div className="flex items-baseline justify-between">
                            <p
                              className={`font-sans text-[10px] uppercase tracking-[0.2em] ${isActive ? "text-[#050505]/70" : "text-foreground/45"}`}
                            >
                              {CATEGORY_CODE[cat as Category]} ·{" "}
                              {CATEGORY_LABEL[cat as Category]}
                            </p>
                            {isActive && (
                              <span className="size-1.5 rounded-full bg-[#050505]" />
                            )}
                          </div>
                          <p className="mt-2 font-heading text-3xl tabular-nums leading-none">
                            {count}
                          </p>
                          <p className="mt-1.5 font-sans text-[10px] italic opacity-60">
                            ejercicios
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* ─── Search + difficulty + filtros avanzados ─── */}
                <div className="space-y-3 rounded-lg border border-[#050505]/10 bg-white/70 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex flex-col gap-3 md:flex-row">
                    <form
                      className="flex-1 relative"
                      action="/exercises"
                      method="get"
                    >
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-foreground/40"
                        strokeWidth={1.6}
                      />
                      <input
                        type="search"
                        name="q"
                        placeholder="Buscar por nombre o descripción…"
                        defaultValue={searchTerm}
                        className="h-11 w-full rounded-full border border-[#050505]/12 bg-[#F4F4F1] pl-9 pr-4 text-[13px] text-foreground transition-colors placeholder:text-foreground/40 focus:border-[#D6FF38] focus:outline-none focus:ring-2 focus:ring-[#D6FF38]/40 dark:border-white/10 dark:bg-[#050505]"
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
                      {activeNivel && (
                        <input type="hidden" name="nivel" value={activeNivel} />
                      )}
                      {activeAspectoJuego && (
                        <input
                          type="hidden"
                          name="aspectoJuego"
                          value={activeAspectoJuego}
                        />
                      )}
                      {activeParametro && (
                        <input
                          type="hidden"
                          name="parametro"
                          value={activeParametro}
                        />
                      )}
                      {activeTipologia && (
                        <input
                          type="hidden"
                          name="tipologia"
                          value={activeTipologia}
                        />
                      )}
                      {activeDuracionRango && (
                        <input
                          type="hidden"
                          name="duracionRango"
                          value={activeDuracionRango}
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
                    </form>

                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      <span className="shrink-0 px-1 font-sans text-[10px] uppercase tracking-[0.2em] text-foreground/40">
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
                            className={`whitespace-nowrap rounded-full border px-3 py-2 text-[11px] font-sans font-semibold tracking-[0.08em] transition-colors ${
                              isActive
                                ? "border-[#D6FF38] bg-[#D6FF38] text-[#050505]"
                                : "border-foreground/15 text-foreground/55 hover:border-foreground/30 hover:text-foreground"
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
                      nivel: activeNivel,
                      aspectoJuego: activeAspectoJuego,
                      parametro: activeParametro,
                      tipologia: activeTipologia,
                      duracionRango: activeDuracionRango,
                      numJugadores: activeNumJugadores,
                      tipoPelota: activeTipoPelota,
                      tipoActividad: activeTipoActividad,
                      golpes: activeGolpes,
                      efecto: activeEfecto,
                      minDuracion: activeMinDuracion,
                      maxDuracion: activeMaxDuracion,
                      location: activeLocation,
                    }}
                    preserved={{
                      q: searchTerm || undefined,
                      tab: activeTab !== "all" ? activeTab : undefined,
                      category:
                        activeCategory !== "all" ? activeCategory : undefined,
                      difficulty:
                        activeDifficulty !== "all"
                          ? activeDifficulty
                          : undefined,
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
                      {activeNivel && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] bg-brand/8 border border-brand/20 text-brand rounded">
                          Nivel: {activeNivel.replace(/_/g, " ")}
                        </span>
                      )}
                      {activeAspectoJuego && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] bg-brand/8 border border-brand/20 text-brand rounded">
                          Aspecto: {activeAspectoJuego}
                        </span>
                      )}
                      {activeParametro && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] bg-brand/8 border border-brand/20 text-brand rounded">
                          Parametro: {activeParametro}
                        </span>
                      )}
                      {activeTipologia && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] bg-brand/8 border border-brand/20 text-brand rounded">
                          Tipologia: {activeTipologia.replace(/_/g, " ")}
                        </span>
                      )}
                      {activeDuracionRango && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] bg-brand/8 border border-brand/20 text-brand rounded">
                          Rango: {activeDuracionRango}
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
                          {activeMinDuracion ?? ""}–{activeMaxDuracion ?? "∞"}{" "}
                          min
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
                          nivel: undefined,
                          aspectoJuego: undefined,
                          parametro: undefined,
                          tipologia: undefined,
                          duracionRango: undefined,
                          numJugadores: undefined,
                          tipoPelota: undefined,
                          tipoActividad: undefined,
                          golpe: undefined,
                          efecto: undefined,
                          minDuracion: undefined,
                          maxDuracion: undefined,
                          location: undefined,
                        })}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans tracking-[0.08em] text-foreground/50 hover:text-foreground border border-foreground/15 rounded transition-colors"
                      >
                        Limpiar filtros
                      </Link>
                    </div>
                  )}
                </div>

                {filtered.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#050505]/18 bg-white/60 px-6 py-16 text-center dark:border-white/15 dark:bg-white/[0.04]">
                    <p className="text-[15px] font-medium text-foreground mb-2">
                      Sin coincidencias
                    </p>
                    <p className="text-[13px] text-foreground/55 max-w-sm mx-auto mb-4">
                      {searchTerm
                        ? `No hay ejercicios para "${searchTerm}".`
                        : "Prueba con otra combinación."}
                    </p>
                    <Link
                      href={buildHref({ tab: activeTab })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#050505] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#D6FF38] hover:text-[#050505] dark:bg-[#D6FF38] dark:text-[#050505]"
                    >
                      Limpiar filtros
                    </Link>
                  </div>
                ) : (
                  <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((exercise) => {
                      const catLabel =
                        CATEGORY_LABEL[exercise.category as Category];
                      const diffLabel =
                        DIFFICULTY_LABEL[exercise.difficulty as Difficulty];
                      const diffBars =
                        DIFFICULTY_BARS[exercise.difficulty as Difficulty];
                      const steps = Number(exercise.stepsCount ?? 0);
                      const materials = Number(exercise.materialsCount ?? 0);

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
                          className="flex flex-col overflow-hidden rounded-lg border border-[#050505]/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#D6FF38] hover:shadow-[0_24px_50px_rgba(5,5,5,0.12)] dark:border-white/10 dark:bg-white/[0.04]"
                        >
                          <div className="flex items-center justify-between bg-[#050505] px-4 py-3 text-white sm:px-5">
                            <span className="rounded-full bg-[#D6FF38] px-2.5 py-1 text-[11px] font-bold tabular-nums text-[#050505]">
                              {exercise.durationMinutes} min
                            </span>
                            <div className="flex items-center gap-2.5">
                              {owner && (
                                <span
                                  className={`inline-flex items-center gap-1 font-sans text-[9px] uppercase tracking-[0.2em] ${
                                    owner.label === "IA"
                                      ? "text-[#D6FF38]"
                                      : "text-white/55"
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
                            className="group block flex-1 px-4 pb-6 pt-5 transition-colors hover:bg-[#D6FF38]/[0.05] sm:px-6"
                          >
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#6D7F00] dark:text-[#D6FF38]">
                              {catLabel}
                            </p>
                            <h3 className="mb-2 font-heading text-[19px] font-semibold leading-snug text-foreground transition-colors group-hover:text-[#6D7F00] dark:group-hover:text-[#D6FF38]">
                              {exercise.name}
                            </h3>

                            {exercise.description && (
                              <p className="text-[12.5px] text-foreground/60 leading-relaxed line-clamp-2 mb-5">
                                {exercise.description}
                              </p>
                            )}

                            {(formatoLabel ||
                              actividadLabel ||
                              exercise.numJugadores) && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {formatoLabel && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-sans uppercase tracking-[0.12em] bg-muted text-foreground/50 rounded">
                                    {formatoLabel}
                                  </span>
                                )}
                                {exercise.numJugadores && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-sans uppercase tracking-[0.12em] bg-muted text-foreground/50 rounded">
                                    {exercise.numJugadores}P
                                  </span>
                                )}
                                {actividadLabel && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-sans uppercase tracking-[0.12em] bg-muted text-foreground/50 rounded">
                                    {actividadLabel}
                                  </span>
                                )}
                              </div>
                            )}

                            {user && savedInLists > 0 ? (
                              <div className="mb-3 flex flex-wrap gap-1">
                                <span className="inline-flex items-center gap-1 rounded-full border border-[#D6FF38]/40 bg-[#D6FF38]/15 px-2 py-1 text-[10px] font-semibold text-[#5E6F00] dark:text-[#D6FF38]">
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
                                      className={`h-[3px] w-5 rounded-full ${n <= diffBars ? "bg-[#D6FF38]" : "bg-foreground/15"}`}
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
                  <footer className="flex flex-col gap-3 rounded-lg border border-[#050505]/10 bg-white/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/[0.04]">
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
                          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-foreground/70 transition-colors hover:text-[#6D7F00] dark:hover:text-[#D6FF38]"
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
                          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-foreground/70 transition-colors hover:text-[#6D7F00] dark:hover:text-[#D6FF38]"
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
      </div>
    </div>
  );
}
