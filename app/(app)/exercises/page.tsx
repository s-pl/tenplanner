import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { exercises as exercisesTable } from "@/db/schema";
import { and, asc, count, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import {
  Plus, ArrowRight, ArrowLeft, ArrowUpRight, Search,
  ListOrdered, Package, Globe, Sparkles, User, Clock,
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

const CATEGORIES = ["all", "technique", "tactics", "fitness", "warm-up"] as const;
const DIFFICULTIES = ["all", "beginner", "intermediate", "advanced"] as const;
const TABS = ["all", "global", "mine"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  all: "Todos",
  global: "Globales",
  mine: "Propios",
};

const PAGE_SIZE = 30;

interface PageProps {
  searchParams: Promise<{ category?: string; difficulty?: string; q?: string; tab?: string; page?: string }>;
}

export default async function ExercisesPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { category, difficulty, q, tab, page } = await searchParams;
  const activeCategory = (CATEGORIES.includes(category as never) ? category : "all") as "all" | Category;
  const activeDifficulty = (DIFFICULTIES.includes(difficulty as never) ? difficulty : "all") as "all" | Difficulty;
  const activeTab: Tab = (TABS.includes(tab as Tab) ? tab : "all") as Tab;
  const searchTerm = q?.trim() ?? "";
  const parsedPage = Number(page ?? "1");
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

  const allVisibleWhere =
    or(eq(exercisesTable.isGlobal, true), eq(exercisesTable.createdBy, user.id))
    ?? eq(exercisesTable.isGlobal, true);

  const visibilityWhere = activeTab === "global"
    ? eq(exercisesTable.isGlobal, true)
    : activeTab === "mine"
      ? eq(exercisesTable.createdBy, user.id)
      : allVisibleWhere;

  const listConditions: SQL[] = [visibilityWhere];
  if (activeCategory !== "all") listConditions.push(eq(exercisesTable.category, activeCategory));
  if (activeDifficulty !== "all") listConditions.push(eq(exercisesTable.difficulty, activeDifficulty));
  if (searchTerm) {
    const searchWhere = or(
      ilike(exercisesTable.name, `%${searchTerm}%`),
      ilike(exercisesTable.description, `%${searchTerm}%`)
    );
    if (searchWhere) listConditions.push(searchWhere);
  }
  const listWhere = and(...listConditions);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const [rowPage, allRows, globalRows, mineRows, categoryRows] = await Promise.all([
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
        stepsCount: sql<number>`COALESCE(json_array_length(${exercisesTable.steps}), 0)`,
        materialsCount: sql<number>`COALESCE(json_array_length(${exercisesTable.materials}), 0)`,
      })
      .from(exercisesTable).where(listWhere).orderBy(asc(exercisesTable.name))
      .limit(PAGE_SIZE + 1).offset(offset),
    db.select({ total: count() }).from(exercisesTable).where(allVisibleWhere),
    db.select({ total: count() }).from(exercisesTable).where(eq(exercisesTable.isGlobal, true)),
    db.select({ total: count() }).from(exercisesTable).where(eq(exercisesTable.createdBy, user.id)),
    db.select({ category: exercisesTable.category, total: count() })
      .from(exercisesTable).where(visibilityWhere).groupBy(exercisesTable.category),
  ]);

  const hasNextPage = rowPage.length > PAGE_SIZE;
  const filtered = hasNextPage ? rowPage.slice(0, PAGE_SIZE) : rowPage;

  const byCategoryMap = new Map(categoryRows.map((row) => [row.category, Number(row.total)]));
  const byCategory = CATEGORIES.slice(1).map((cat) => ({
    cat, count: byCategoryMap.get(cat as Category) ?? 0,
  }));

  const tabCounts: Record<Tab, number> = {
    all: Number(allRows[0]?.total ?? 0),
    global: Number(globalRows[0]?.total ?? 0),
    mine: Number(mineRows[0]?.total ?? 0),
  };

  function buildHref(params: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    if (params.category && params.category !== "all")     p.set("category",   params.category);
    if (params.difficulty && params.difficulty !== "all") p.set("difficulty", params.difficulty);
    if (params.q) p.set("q", params.q);
    if (params.tab && params.tab !== "all") p.set("tab", params.tab);
    if (params.page && params.page !== "1") p.set("page", params.page);
    const s = p.toString();
    return `/exercises${s ? `?${s}` : ""}`;
  }

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
              Método · Catálogo
            </p>
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/40 tabular-nums">
              {tabCounts.all.toString().padStart(3, "0")} ejercicios disponibles
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-foreground/15">
            <div className="max-w-2xl">
              <h1 className="font-heading text-4xl md:text-5xl leading-[1.05] tracking-tight text-foreground">
                <em className="italic text-brand">Biblioteca</em> de ejercicios
              </h1>
              <p className="mt-3 text-[15px] text-foreground/65 leading-relaxed">
                Una colección viva: ejercicios globales, propios y generados con IA.
                El material del que nacen todas las sesiones.
              </p>
            </div>
            <Link
              href="/exercises/new"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2.5 text-[13px] font-semibold hover:bg-foreground/90 transition-colors shrink-0"
            >
              <Plus className="size-4" /> Añadir ejercicio
            </Link>
          </div>
        </header>

        {/* ─── Tabs (propiedad) ─── */}
        <nav className="flex items-end gap-8 border-b border-foreground/15">
          {TABS.map((t) => {
            const isActive = activeTab === t;
            return (
              <Link
                key={t}
                href={buildHref({ category: activeCategory, difficulty: activeDifficulty, q: searchTerm || undefined, tab: t })}
                className={`group pb-3 -mb-px flex items-baseline gap-2 border-b-2 transition-colors ${
                  isActive ? "border-brand" : "border-transparent hover:border-foreground/25"
                }`}
              >
                <span className={`text-[15px] ${isActive ? "font-heading italic text-foreground" : "text-foreground/60 group-hover:text-foreground"}`}>
                  {TAB_LABELS[t]}
                </span>
                <span className={`font-sans text-[10px] tabular-nums tracking-[0.14em] ${isActive ? "text-brand" : "text-foreground/40"}`}>
                  ({tabCounts[t].toString().padStart(2, "0")})
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ─── Category strip — monocromo, solo tipografía ─── */}
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
                    <p className={`font-sans text-[10px] uppercase tracking-[0.2em] ${isActive ? "text-brand" : "text-foreground/45"}`}>
                      {CATEGORY_CODE[cat as Category]} · {CATEGORY_LABEL[cat as Category]}
                    </p>
                    {isActive && <span className="size-1.5 rounded-full bg-brand" />}
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

        {/* ─── Search + difficulty ─── */}
        <div className="flex flex-col md:flex-row gap-3">
          <form className="flex-1 relative" action="/exercises" method="get">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none" strokeWidth={1.6} />
            <input
              type="search" name="q"
              placeholder="Buscar por nombre o descripción…"
              defaultValue={searchTerm}
              className="w-full h-10 pl-9 pr-4 text-[13px] bg-transparent border border-foreground/20 rounded-md focus:outline-none focus:border-brand/60 text-foreground placeholder:text-foreground/40 transition-colors"
            />
            {activeCategory !== "all" && <input type="hidden" name="category" value={activeCategory} />}
            {activeDifficulty !== "all" && <input type="hidden" name="difficulty" value={activeDifficulty} />}
            {activeTab !== "all" && <input type="hidden" name="tab" value={activeTab} />}
          </form>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-foreground/40 px-1 shrink-0">
              Nivel:
            </span>
            {DIFFICULTIES.map((diff) => {
              const isActive = activeDifficulty === diff;
              const label = diff === "all" ? "Todos" : DIFFICULTY_LABEL[diff as Difficulty];
              return (
                <Link
                  key={diff}
                  href={buildHref({ category: activeCategory, difficulty: diff, q: searchTerm || undefined, tab: activeTab })}
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

        {/* ─── Grid ─── */}
        {filtered.length === 0 ? (
          <div className="border-t border-b border-foreground/15 py-20 text-center">
            <p className="font-heading italic text-2xl text-foreground/80 mb-2">
              Sin coincidencias.
            </p>
            <p className="text-[13px] text-foreground/55 max-w-sm mx-auto mb-5">
              {searchTerm ? `Nada para «${searchTerm}» con los filtros actuales.` : "Prueba con otra combinación."}
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
              const catLabel = CATEGORY_LABEL[exercise.category as Category];
              const catCode = CATEGORY_CODE[exercise.category as Category];
              const diffLabel = DIFFICULTY_LABEL[exercise.difficulty as Difficulty];
              const diffBars = DIFFICULTY_BARS[exercise.difficulty as Difficulty];
              const steps = Number(exercise.stepsCount ?? 0);
              const materials = Number(exercise.materialsCount ?? 0);
              const globalIdx = offset + idx + 1;

              let owner: { label: string; icon: React.ElementType } | null = null;
              if (exercise.isAiGenerated) owner = { label: "IA", icon: Sparkles };
              else if (exercise.isGlobal) owner = { label: "GLB", icon: Globe };
              else if (exercise.createdBy === user.id) owner = { label: "PRP", icon: User };

              return (
                <li key={exercise.id} className="md:border-b md:border-foreground/10 md:[&:nth-child(3n)]:border-r-0 md:border-r md:border-foreground/10 md:[&:nth-last-child(-n+3)]:border-b-0">
                  <Link
                    href={`/exercises/${exercise.id}`}
                    className="group block p-6 h-full hover:bg-foreground/[0.02] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <span className="font-sans text-[10px] tabular-nums tracking-[0.18em] text-foreground/35">
                        № {String(globalIdx).padStart(3, "0")}
                      </span>
                      {owner && (
                        <span className={`inline-flex items-center gap-1 font-sans text-[9px] uppercase tracking-[0.2em] ${
                          owner.label === "IA" ? "text-brand" : "text-foreground/50"
                        }`}>
                          <owner.icon className="size-2.5" strokeWidth={1.8} />
                          {owner.label}
                        </span>
                      )}
                    </div>

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

                    <div className="pt-4 border-t border-foreground/10 grid grid-cols-[1fr_auto] items-end gap-4">
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
                          <Clock className="size-3" strokeWidth={1.6} /> {exercise.durationMinutes}&prime;
                        </span>
                        {steps > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <ListOrdered className="size-3" strokeWidth={1.6} /> {steps}
                          </span>
                        )}
                        {materials > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Package className="size-3" strokeWidth={1.6} /> {materials}
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
          <footer className="flex items-center justify-between pt-4 border-t border-foreground/15">
            <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/45 tabular-nums">
              {filtered.length > 0 ? `${offset + 1}–${offset + filtered.length}` : "0"} · Página {currentPage.toString().padStart(2, "0")}
            </p>
            <div className="flex items-center gap-5">
              {currentPage > 1 ? (
                <Link
                  href={buildHref({
                    category: activeCategory, difficulty: activeDifficulty,
                    q: searchTerm || undefined, tab: activeTab, page: String(currentPage - 1),
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
                    category: activeCategory, difficulty: activeDifficulty,
                    q: searchTerm || undefined, tab: activeTab, page: String(currentPage + 1),
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
      </div>
    </div>
  );
}
