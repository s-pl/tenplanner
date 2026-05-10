import Link from "next/link";
import { eq, or, desc, and, ilike, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { classes, classFavorites, classDrafts } from "@/db/schema";
import { Plus, Search, FileText, Heart } from "lucide-react";

const TABS = ["all", "library", "mine", "favorites", "drafts"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  all: "Ver todas",
  library: "Biblioteca",
  mine: "Mis clases",
  favorites: "Favoritos",
  drafts: "Borradores",
};

const NIVEL_FILTERS = [
  { id: "", label: "Todos" },
  { id: "descubrimiento", label: "Descubrimiento (4-6)" },
  { id: "desarrollo", label: "Desarrollo (6-8)" },
  { id: "consolidacion", label: "Consolidación (8-10)" },
  { id: "especializacion", label: "Especialización (10-12)" },
  { id: "precompeticion", label: "Precompetición (12-14)" },
  { id: "competicion", label: "Competición (14-18)" },
  { id: "adultos_iniciacion", label: "Adultos iniciación" },
  { id: "adultos_medio_alto", label: "Adultos medio-alto" },
];

const DURACION_FILTERS = [
  { id: "", label: "Cualquiera" },
  { id: "30", label: "30 min" },
  { id: "45", label: "45 min" },
  { id: "60", label: "60 min" },
  { id: "75", label: "75 min" },
  { id: "90", label: "90 min" },
  { id: "120", label: "+90 min" },
];

const ASPECTO_FILTERS = [
  { id: "", label: "Cualquiera" },
  { id: "tecnica", label: "Técnica" },
  { id: "tactica", label: "Táctica" },
  { id: "mental", label: "Trabajo mental" },
  { id: "fisico", label: "Físico" },
];

const GOLPES_FILTERS = [
  { id: "derecha", label: "Derecha" },
  { id: "reves", label: "Revés" },
  { id: "saque", label: "Saque" },
  { id: "volea", label: "Volea" },
  { id: "remate", label: "Remate" },
  { id: "dejada", label: "Dejada" },
  { id: "globo", label: "Globo" },
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
  const duracion = typeof params.duracion === "string" ? params.duracion : "";
  const aspecto = typeof params.aspecto === "string" ? params.aspecto : "";
  const golpe = typeof params.golpe === "string" ? params.golpe : "";

  // For drafts tab we don't query classes
  let rows: Array<{
    id: string;
    name: string;
    duracionMinutes: number;
    alumnosTipo: string | null;
    nivel: string | null;
    isLibrary: boolean;
    createdAt: Date;
  }> = [];
  let draftCount = 0;
  let draftRows: Array<{
    id: string;
    payload: Record<string, unknown>;
    updatedAt: Date;
  }> = [];

  if (user) {
    draftRows = await db
      .select({
        id: classDrafts.id,
        payload: classDrafts.payload,
        updatedAt: classDrafts.updatedAt,
      })
      .from(classDrafts)
      .where(eq(classDrafts.userId, user.id))
      .orderBy(desc(classDrafts.updatedAt))
      .limit(50);
    draftCount = draftRows.length;
  }

  if (activeTab !== "drafts") {
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
    if (aspecto) conds.push(eq(classes.aspectoJuego, aspecto));
    if (duracion === "120") {
      conds.push(sql`${classes.duracionMinutes} > 90`);
    } else if (duracion) {
      const d = Number(duracion);
      if (Number.isFinite(d)) conds.push(eq(classes.duracionMinutes, d));
    }
    if (golpe) {
      conds.push(sql`${classes.golpes}::jsonb @> ${`["${golpe}"]`}::jsonb`);
    }

    rows = await db
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
  }

  // Favorites set para pintar el corazón si aplica
  const favRows = user
    ? await db
        .select({ classId: classFavorites.classId })
        .from(classFavorites)
        .where(eq(classFavorites.userId, user.id))
    : [];
  const favorites = new Set(favRows.map((f) => f.classId));

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 md:px-10">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-5 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">
            Clases
          </h1>
          <p className="text-[14px] text-foreground/60 mt-1.5 max-w-prose">
            Plantillas reutilizables con bloques y ejercicios. Cárgalas en una
            sesión para impartirlas.
          </p>
        </div>
        {user && (
          <Link
            href="/classes/new"
            className="inline-flex items-center gap-2 rounded-md bg-brand text-brand-foreground px-4 h-10 text-[13px] font-semibold transition-colors hover:bg-brand/90"
          >
            <Plus className="size-4" />
            Nueva clase
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => {
          if (!user && (t === "mine" || t === "favorites" || t === "drafts"))
            return null;
          const active = activeTab === t;
          const sp = new URLSearchParams();
          if (t !== "all") sp.set("tab", t);
          if (q) sp.set("q", q);
          if (nivel) sp.set("nivel", nivel);
          if (duracion) sp.set("duracion", duracion);
          if (aspecto) sp.set("aspecto", aspecto);
          if (golpe) sp.set("golpe", golpe);
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
              {t === "drafts" && draftCount > 0 && (
                <span className="ml-1.5 text-[10px] tabular-nums text-brand/80">
                  ({draftCount})
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {activeTab === "drafts" && user ? (
        draftRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center border-t border-foreground/15">
            <div className="size-14 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center">
              <FileText className="size-6 text-foreground/20" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground/40">
                Sin borradores
              </p>
              <p className="text-sm text-foreground/30 mt-1">
                Las clases que guardes como borrador aparecerán aquí.
              </p>
            </div>
            <Link
              href="/classes/new"
              className="inline-flex items-center gap-2 rounded-lg bg-brand text-background px-4 py-2 text-[13px] font-semibold hover:bg-brand/90 transition-colors mt-1"
            >
              Crear clase
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {draftRows.map((draft, i) => {
              const name =
                (typeof draft.payload?.name === "string" &&
                  (draft.payload.name as string).trim()) ||
                "Clase sin título";
              return (
                <li
                  key={draft.id}
                  className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] px-4 py-3"
                >
                  <span className="font-sans text-[9px] tabular-nums text-foreground/30 shrink-0">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-heading text-foreground truncate">
                      {name}
                    </p>
                    <p className="text-[11px] text-foreground/45 mt-0.5 tabular-nums">
                      {new Intl.DateTimeFormat("es-ES", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(draft.updatedAt))}
                    </p>
                  </div>
                  <Link
                    href={`/classes/new?draft=${draft.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand text-background px-2.5 py-1.5 text-[12px] font-medium hover:bg-brand/90 transition-colors"
                  >
                    Continuar
                  </Link>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        <>
          {/* Filtros: search + nivel + duración + aspecto + golpe */}
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
            <div>
              <label
                htmlFor="duracion"
                className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Duración
              </label>
              <select
                id="duracion"
                name="duracion"
                defaultValue={duracion}
                className="h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 text-foreground"
              >
                {DURACION_FILTERS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="aspecto"
                className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Aspecto
              </label>
              <select
                id="aspecto"
                name="aspecto"
                defaultValue={aspecto}
                className="h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 text-foreground"
              >
                {ASPECTO_FILTERS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="golpe"
                className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Golpe
              </label>
              <select
                id="golpe"
                name="golpe"
                defaultValue={golpe}
                className="h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 text-foreground"
              >
                <option value="">Cualquiera</option>
                {GOLPES_FILTERS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
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
            <div className="border border-dashed border-border rounded-lg bg-card/40 px-6 py-16 text-center">
              <p className="text-[15px] font-medium text-foreground mb-2">
                No hay clases que coincidan
              </p>
              <p className="text-[13px] text-foreground/55 max-w-md mx-auto">
                Prueba a quitar algún filtro o crea una clase nueva.
              </p>
              {user && (
                <Link
                  href="/classes/new"
                  className="inline-flex items-center gap-1.5 mt-5 rounded-md bg-brand text-brand-foreground px-4 py-2 text-[13px] font-semibold hover:bg-brand/90 transition-colors"
                >
                  <Plus className="size-3.5" />
                  Crear la primera
                </Link>
              )}
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((cls) => (
                <li key={cls.id}>
                  <Link
                    href={`/classes/${cls.id}`}
                    className="group flex h-full flex-col justify-between rounded-lg border border-border bg-card p-5 transition-colors hover:border-brand/40"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="text-[11.5px] font-medium text-foreground/55 tabular-nums">
                          {cls.duracionMinutes} min
                        </span>
                        <div className="flex items-center gap-1.5">
                          {cls.isLibrary && (
                            <span className="text-[10px] font-medium text-brand border border-brand/30 bg-brand/[0.06] px-1.5 py-0.5 rounded">
                              Biblioteca
                            </span>
                          )}
                          {favorites.has(cls.id) && (
                            <Heart
                              className="size-3.5 fill-pink-500 text-pink-500"
                              aria-label="Favorito"
                            />
                          )}
                        </div>
                      </div>
                      <h3 className="font-heading text-[17px] font-semibold text-foreground group-hover:text-brand transition-colors line-clamp-3 leading-snug">
                        {cls.name}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-4 mt-4 border-t border-border">
                      {cls.alumnosTipo && (
                        <span className="text-[10.5px] px-1.5 py-0.5 rounded border border-border text-foreground/60 capitalize">
                          {cls.alumnosTipo}
                        </span>
                      )}
                      {cls.nivel && (
                        <span className="text-[10.5px] px-1.5 py-0.5 rounded border border-brand/30 bg-brand/[0.06] text-brand">
                          {cls.nivel.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
