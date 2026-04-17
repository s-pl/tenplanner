import Link from "next/link";
import { db } from "@/db";
import { exercises as exercisesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Plus, Clock, ChevronRight, Search } from "lucide-react";

type Category = "technique" | "tactics" | "fitness" | "warm-up";

const CATEGORY_META: Record<
  Category,
  { label: string; color: string; bg: string; dot: string }
> = {
  technique: {
    label: "Technique",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    dot: "bg-blue-400",
  },
  tactics: {
    label: "Tactics",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    dot: "bg-purple-400",
  },
  fitness: {
    label: "Fitness",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    dot: "bg-amber-400",
  },
  "warm-up": {
    label: "Warm-up",
    color: "text-brand",
    bg: "bg-brand/10",
    dot: "bg-brand",
  },
};

const DIFFICULTY_META = {
  beginner: { label: "Beginner", color: "text-brand" },
  intermediate: { label: "Intermediate", color: "text-amber-400" },
  advanced: { label: "Advanced", color: "text-red-400" },
};

const CATEGORIES = ["all", "technique", "tactics", "fitness", "warm-up"] as const;

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function ExercisesPage({ searchParams }: PageProps) {
  const { category, q } = await searchParams;
  const activeCategory = (CATEGORIES.includes(category as never) ? category : "all") as string;

  const allExercises = await db.select().from(exercisesTable).orderBy(exercisesTable.name);

  const filtered = allExercises.filter((ex) => {
    const matchesCategory = activeCategory === "all" || ex.category === activeCategory;
    const matchesSearch = !q || ex.name.toLowerCase().includes(q.toLowerCase()) ||
      (ex.description?.toLowerCase().includes(q.toLowerCase()) ?? false);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="px-6 md:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Exercise Library
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {allExercises.length} exercise{allExercises.length !== 1 ? "s" : ""} available
          </p>
        </div>
        <Link
          href="/exercises/new"
          className="inline-flex items-center gap-2 bg-brand text-brand-foreground text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand/90 transition-colors shrink-0"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Add exercise</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Category tabs */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 overflow-x-auto shrink-0">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const label =
              cat === "all"
                ? "All"
                : CATEGORY_META[cat as Category].label;
            return (
              <Link
                key={cat}
                href={`/exercises?category=${cat}${q ? `&q=${q}` : ""}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Search */}
        <form className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            name="q"
            placeholder="Search exercises…"
            defaultValue={q}
            className="w-full h-9 pl-9 pr-4 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 text-foreground placeholder:text-muted-foreground"
          />
          {/* Preserve category when searching */}
          {activeCategory !== "all" && (
            <input type="hidden" name="category" value={activeCategory} />
          )}
        </form>
      </div>

      {/* Exercise grid */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
          <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Search className="size-5 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground mb-1">No exercises found</p>
          <p className="text-sm text-muted-foreground">
            {q
              ? `No results for "${q}". Try a different search.`
              : "No exercises in this category yet. Add your first one!"}
          </p>
          <Link
            href="/exercises?category=all"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand/80 transition-colors mt-4"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filtered.map((exercise) => {
            const cat = CATEGORY_META[exercise.category as Category];
            const diff = DIFFICULTY_META[exercise.difficulty];
            return (
              <div
                key={exercise.id}
                className="group bg-card border border-border rounded-2xl p-5 hover:border-brand/30 transition-colors flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cat.bg} ${cat.color}`}
                  >
                    <span className={`size-1.5 rounded-full ${cat.dot}`} />
                    {cat.label}
                  </span>
                  <span className={`text-xs font-medium ${diff.color}`}>
                    {diff.label}
                  </span>
                </div>

                <h3 className="font-semibold text-foreground text-sm leading-snug mb-2">
                  {exercise.name}
                </h3>

                {exercise.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                    {exercise.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    {exercise.durationMinutes} min
                  </span>
                  <button className="size-7 rounded-lg bg-muted flex items-center justify-center group-hover:bg-brand/15 transition-colors">
                    <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-brand transition-colors" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Count footer */}
      {filtered.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {filtered.length} of {allExercises.length} exercises
        </p>
      )}
    </div>
  );
}
