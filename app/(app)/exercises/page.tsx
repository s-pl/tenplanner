import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { exercises as exercisesTable } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { Plus, Clock, ChevronRight, Search, ImageIcon, ListOrdered, Package, Globe, Sparkles, User } from "lucide-react";

type Category = "technique" | "tactics" | "fitness" | "warm-up";
type Difficulty = "beginner" | "intermediate" | "advanced";

const CATEGORY_META: Record<Category, { label: string; color: string; bg: string; dot: string; border: string }> = {
  technique: { label: "Técnica",       color: "text-blue-400",   bg: "bg-blue-400/10",   dot: "bg-blue-400",   border: "border-blue-400/20" },
  tactics:   { label: "Táctica",       color: "text-purple-400", bg: "bg-purple-400/10", dot: "bg-purple-400", border: "border-purple-400/20" },
  fitness:   { label: "Fitness",       color: "text-amber-400",  bg: "bg-amber-400/10",  dot: "bg-amber-400",  border: "border-amber-400/20" },
  "warm-up": { label: "Calentamiento", color: "text-brand",      bg: "bg-brand/10",      dot: "bg-brand",      border: "border-brand/20" },
};

const DIFFICULTY_META: Record<Difficulty, { label: string; color: string; bg: string }> = {
  beginner:     { label: "Principiante", color: "text-brand",      bg: "bg-brand/10" },
  intermediate: { label: "Intermedio",   color: "text-amber-400",  bg: "bg-amber-400/10" },
  advanced:     { label: "Avanzado",     color: "text-red-400",    bg: "bg-red-400/10" },
};

const CATEGORIES = ["all", "technique", "tactics", "fitness", "warm-up"] as const;
const DIFFICULTIES = ["all", "beginner", "intermediate", "advanced"] as const;
const TABS = ["all", "global", "mine"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  all: "Todos",
  global: "Globales",
  mine: "Míos",
};

interface PageProps {
  searchParams: Promise<{ category?: string; difficulty?: string; q?: string; tab?: string }>;
}

export default async function ExercisesPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { category, difficulty, q, tab } = await searchParams;
  const activeCategory   = (CATEGORIES.includes(category as never)   ? category   : "all") as string;
  const activeDifficulty = (DIFFICULTIES.includes(difficulty as never) ? difficulty : "all") as string;
  const activeTab: Tab = (TABS.includes(tab as Tab) ? tab : "all") as Tab;

  // Fetch only exercises visible to the user: global OR created by them
  const visibleExercises = await db
    .select()
    .from(exercisesTable)
    .where(or(eq(exercisesTable.isGlobal, true), eq(exercisesTable.createdBy, user.id)))
    .orderBy(exercisesTable.name);

  const filtered = visibleExercises.filter((ex) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "global" && ex.isGlobal) ||
      (activeTab === "mine" && ex.createdBy === user.id);
    const matchesCategory   = activeCategory === "all"   || ex.category   === activeCategory;
    const matchesDifficulty = activeDifficulty === "all" || ex.difficulty  === activeDifficulty;
    const matchesSearch = !q
      || ex.name.toLowerCase().includes(q.toLowerCase())
      || (ex.description?.toLowerCase().includes(q.toLowerCase()) ?? false);
    return matchesTab && matchesCategory && matchesDifficulty && matchesSearch;
  });

  // Stats by category (scoped to active tab for relevance)
  const tabScoped = visibleExercises.filter((ex) => {
    if (activeTab === "global") return ex.isGlobal;
    if (activeTab === "mine") return ex.createdBy === user.id;
    return true;
  });
  const byCategory = CATEGORIES.slice(1).map(cat => ({
    cat,
    count: tabScoped.filter(ex => ex.category === cat).length,
  }));

  const tabCounts: Record<Tab, number> = {
    all: visibleExercises.length,
    global: visibleExercises.filter(e => e.isGlobal).length,
    mine: visibleExercises.filter(e => e.createdBy === user.id).length,
  };

  function buildHref(params: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    if (params.category && params.category !== "all")   p.set("category",   params.category);
    if (params.difficulty && params.difficulty !== "all") p.set("difficulty", params.difficulty);
    if (params.q) p.set("q", params.q);
    if (params.tab && params.tab !== "all") p.set("tab", params.tab);
    const s = p.toString();
    return `/exercises${s ? `?${s}` : ""}`;
  }

  return (
    <div className="px-6 md:px-8 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Biblioteca de Ejercicios
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {tabCounts[activeTab]} ejercicio{tabCounts[activeTab] !== 1 ? "s" : ""} en {TAB_LABELS[activeTab].toLowerCase()}
          </p>
        </div>
        <Link
          href="/exercises/new"
          className="inline-flex items-center gap-2 bg-brand text-brand-foreground text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand/90 transition-colors shrink-0"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Añadir ejercicio</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 w-fit">
        {TABS.map((t) => {
          const isActive = activeTab === t;
          return (
            <Link
              key={t}
              href={buildHref({ category: activeCategory, difficulty: activeDifficulty, q, tab: t })}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                isActive
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {TAB_LABELS[t]}
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isActive ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"}`}>
                {tabCounts[t]}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Category stats strip */}
      {tabScoped.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {byCategory.map(({ cat, count }) => {
            const meta = CATEGORY_META[cat as Category];
            return (
              <Link
                key={cat}
                href={buildHref({ category: activeCategory === cat ? "all" : cat, difficulty: activeDifficulty, q, tab: activeTab })}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  activeCategory === cat
                    ? `${meta.bg} ${meta.border} border`
                    : "bg-card border-border hover:border-brand/20 hover:bg-muted/30"
                }`}
              >
                <span className={`size-2.5 rounded-full shrink-0 ${meta.dot}`} />
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${activeCategory === cat ? meta.color : "text-foreground"}`}>
                    {meta.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{count} ejercicio{count !== 1 ? "s" : ""}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form className="flex-1 relative" action="/exercises" method="get">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="search" name="q"
            placeholder="Buscar ejercicios…"
            defaultValue={q}
            className="w-full h-9 pl-9 pr-4 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 text-foreground placeholder:text-muted-foreground"
          />
          {activeCategory !== "all" && <input type="hidden" name="category"   value={activeCategory} />}
          {activeDifficulty !== "all" && <input type="hidden" name="difficulty" value={activeDifficulty} />}
          {activeTab !== "all" && <input type="hidden" name="tab" value={activeTab} />}
        </form>

        <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 shrink-0 overflow-x-auto">
          {DIFFICULTIES.map((diff) => {
            const isActive = activeDifficulty === diff;
            const label = diff === "all" ? "Todos" : DIFFICULTY_META[diff as Difficulty].label;
            return (
              <Link key={diff}
                href={buildHref({ category: activeCategory, difficulty: diff, q, tab: activeTab })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Exercise grid */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
          <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Search className="size-5 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground mb-1">No se encontraron ejercicios</p>
          <p className="text-sm text-muted-foreground">
            {q ? `Sin resultados para "${q}".` : "Nada en este filtro."}
          </p>
          <Link href={buildHref({ tab: activeTab })}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand/80 transition-colors mt-4">
            Limpiar filtros
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filtered.map((exercise) => {
            const cat  = CATEGORY_META[exercise.category as Category];
            const diff = DIFFICULTY_META[exercise.difficulty as Difficulty];
            const steps    = (exercise.steps    as Array<unknown> | null)?.length ?? 0;
            const materials = (exercise.materials as Array<unknown> | null)?.length ?? 0;

            // Badge priority: AI > Global > Mío
            let ownerBadge: { label: string; icon: React.ElementType; color: string; bg: string } | null = null;
            if (exercise.isAiGenerated) {
              ownerBadge = { label: "IA", icon: Sparkles, color: "text-brand", bg: "bg-brand/10" };
            } else if (exercise.isGlobal) {
              ownerBadge = { label: "Global", icon: Globe, color: "text-purple-400", bg: "bg-purple-400/10" };
            } else if (exercise.createdBy === user.id) {
              ownerBadge = { label: "Mío", icon: User, color: "text-amber-400", bg: "bg-amber-400/10" };
            }

            return (
              <Link key={exercise.id} href={`/exercises/${exercise.id}`}
                className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-brand/30 hover:shadow-md transition-all flex flex-col">

                {exercise.imageUrl ? (
                  <div className="aspect-video w-full overflow-hidden bg-muted shrink-0 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={exercise.imageUrl} alt={exercise.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {ownerBadge && (
                      <span className={`absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${ownerBadge.bg} ${ownerBadge.color} backdrop-blur-sm`}>
                        <ownerBadge.icon className="size-3" />
                        {ownerBadge.label}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className={`aspect-video w-full ${cat.bg} flex items-center justify-center shrink-0 relative`}>
                    <ImageIcon className={`size-8 ${cat.color} opacity-30`} />
                    {ownerBadge && (
                      <span className={`absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${ownerBadge.bg} ${ownerBadge.color}`}>
                        <ownerBadge.icon className="size-3" />
                        {ownerBadge.label}
                      </span>
                    )}
                  </div>
                )}

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cat.bg} ${cat.color}`}>
                      <span className={`size-1.5 rounded-full ${cat.dot}`} />
                      {cat.label}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${diff.bg} ${diff.color}`}>
                      {diff.label}
                    </span>
                  </div>

                  <h3 className="font-semibold text-foreground text-sm leading-snug mb-1.5">
                    {exercise.name}
                  </h3>

                  {exercise.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                      {exercise.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60 gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />{exercise.durationMinutes} min
                      </span>
                      {steps > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ListOrdered className="size-3" />{steps} paso{steps !== 1 ? "s" : ""}
                        </span>
                      )}
                      {materials > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Package className="size-3" />{materials}
                        </span>
                      )}
                    </div>
                    <span className="size-7 rounded-lg bg-muted flex items-center justify-center group-hover:bg-brand/15 transition-colors shrink-0">
                      <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-brand transition-colors" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Mostrando {filtered.length} ejercicio{filtered.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
