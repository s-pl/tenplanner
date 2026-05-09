import Link from "next/link";
import { eq, or, desc, and, ilike, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { classes, classFavorites } from "@/db/schema";
import { Plus, Search } from "lucide-react";

const TABS = ["all", "library", "mine", "favorites"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  all: "Ver todas",
  library: "Biblioteca",
  mine: "Mis clases",
  favorites: "Favoritos",
};

const NIVEL_FILTERS = [
  { id: "", label: "Todas" },
  { id: "descubrimiento", label: "Descubrimiento" },
  { id: "desarrollo", label: "Desarrollo (pelota roja)" },
  { id: "consolidacion", label: "Consolidación (pelota naranja)" },
  { id: "especializacion", label: "Especialización (pelota verde)" },
  { id: "precompeticion", label: "Precompetición (pelota amarilla)" },
  { id: "competicion", label: "Competición" },
  { id: "adultos_iniciacion", label: "Adultos iniciación" },
  { id: "adultos_medio_alto", label: "Adultos medio-alto" },
];

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ClassesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const requestedTab = (params.tab as string) ?? "all";
  const tab: Tab = TABS.includes(requestedTab as Tab)
    ? (requestedTab as Tab)
    : "all";
  const activeTab: Tab =
    !user && (tab === "mine" || tab === "favorites") ? "all" : tab;

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const nivel = typeof params.nivel === "string" ? params.nivel : "";

  const conds = [];
  if (activeTab === "mine" && user) {
    conds.push(eq(classes.createdBy, user.id));
  } else if (activeTab === "library") {
    conds.push(eq(classes.isLibrary, true));
  } else if (activeTab === "favorites" && user) {
    conds.push(
      sql`${classes.id} IN (SELECT class_id FROM class_favorites WHERE user_id = ${user.id})`
    );
  } else {
    conds.push(
      user
        ? or(eq(classes.isLibrary, true), eq(classes.createdBy, user.id))!
        : eq(classes.isLibrary, true)
    );
  }
  if (q) conds.push(ilike(classes.name, `%${q}%`));
  if (nivel) conds.push(eq(classes.nivel, nivel));

  const rows = await db
    .select({
      id: classes.id,
      name: classes.name,
      duracionMinutes: classes.duracionMinutes,
      alumnosTipo: classes.alumnosTipo,
      nivel: classes.nivel,
      isLibrary: classes.isLibrary,
      createdAt: classes.createdAt,
    })
    .from(classes)
    .where(and(...conds))
    .orderBy(desc(classes.createdAt))
    .limit(60);

  // Favorites set para pintar el corazón si aplica
  const favRows = user
    ? await db
        .select({ classId: classFavorites.classId })
        .from(classFavorites)
        .where(eq(classFavorites.userId, user.id))
    : [];
  const favorites = new Set(favRows.map((f) => f.classId));

  return (
    <div className="max-w-6xl space-y-6 px-4 py-8 sm:px-6 md:px-8">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-4 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
            № 03
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl italic text-foreground leading-tight">
            Clases
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-prose">
            Plantillas reutilizables. Cárgalas en una sesión para impartirlas.
          </p>
        </div>
        {user && (
          <Link
            href="/classes/new"
            className="inline-flex shrink-0 items-center gap-2 bg-brand text-brand-foreground text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand/90 active:scale-95 transition-all duration-150"
          >
            <Plus className="size-4" /> Nueva clase
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => {
          if (!user && (t === "mine" || t === "favorites")) return null;
          const active = activeTab === t;
          const sp = new URLSearchParams();
          if (t !== "all") sp.set("tab", t);
          if (q) sp.set("q", q);
          if (nivel) sp.set("nivel", nivel);
          return (
            <Link
              key={t}
              href={sp.toString() ? `/classes?${sp.toString()}` : "/classes"}
              className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2 ${
                active
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {TAB_LABELS[t]}
            </Link>
          );
        })}
      </div>

      {/* Filtros: search + nivel */}
      <form className="flex flex-wrap gap-3 items-end" action="/classes">
        {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="q"
            className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Nombre, contenido, objetivos…"
              className="w-full h-10 pl-9 pr-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="nivel"
            className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Nivel
          </label>
          <select
            id="nivel"
            name="nivel"
            defaultValue={nivel}
            className="h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 text-foreground"
          >
            {NIVEL_FILTERS.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-10 px-4 text-sm font-semibold bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-colors"
        >
          Filtrar
        </button>
      </form>

      {/* Listado */}
      {rows.length === 0 ? (
        <div className="border border-dashed border-border bg-card/40 px-6 py-20 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground/60 mb-3">
            Resultado · vacío
          </p>
          <p className="font-heading italic text-2xl text-foreground/70 max-w-md mx-auto">
            No hay clases que coincidan con tu búsqueda.
          </p>
          {user && (
            <Link
              href="/classes/new"
              className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-brand border-b border-dotted border-brand/40 hover:border-brand pb-1 transition-colors"
            >
              <Plus className="size-4" /> Crear la primera
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 border border-border">
          {rows.map((cls, idx) => (
            <li key={cls.id} className="bg-card">
              <Link
                href={`/classes/${cls.id}`}
                className="relative block group p-6 lg:p-7 hover:bg-foreground/[0.025] transition-colors h-full min-h-[220px] flex flex-col justify-between"
              >
                {/* Número grande tipo jersey, marca de agua */}
                <span
                  aria-hidden
                  className="absolute top-4 right-5 font-heading italic text-foreground/[0.04] text-[7rem] leading-none select-none tabular-nums group-hover:text-brand/[0.08] transition-colors"
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>

                <div className="relative flex items-start justify-between gap-3 mb-2">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-brand">
                    Clase · {cls.duracionMinutes}&prime;
                  </p>
                  <div className="flex items-center gap-1.5">
                    {cls.isLibrary && (
                      <span className="text-[9.5px] font-mono uppercase tracking-[0.18em] text-brand border border-brand/30 bg-brand/[0.06] px-1.5 py-0.5">
                        BIB
                      </span>
                    )}
                    {favorites.has(cls.id) && (
                      <span
                        className="text-[10px] text-pink-500"
                        aria-label="Favorito"
                      >
                        ♥
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="relative font-heading italic text-xl lg:text-[22px] text-foreground group-hover:text-brand transition-colors line-clamp-3 leading-tight my-3">
                  {cls.name}
                </h3>
                <div className="relative flex flex-wrap gap-1.5 pt-3 border-t border-border/60">
                  {cls.alumnosTipo && (
                    <span className="text-[10px] font-mono uppercase tracking-[0.16em] px-2 py-0.5 border border-border text-muted-foreground capitalize">
                      {cls.alumnosTipo}
                    </span>
                  )}
                  {cls.nivel && (
                    <span className="text-[10px] font-mono uppercase tracking-[0.16em] px-2 py-0.5 border border-brand/30 bg-brand/[0.06] text-brand">
                      {(cls.nivel.replace(/_/g, " "))}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
