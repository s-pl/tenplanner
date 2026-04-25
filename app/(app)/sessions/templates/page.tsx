import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { sessionTemplates, users } from "@/db/schema";
import { and, desc, eq, ilike } from "drizzle-orm";
import {
  Clock,
  Zap,
  Download,
  Plus,
  Search,
  BookOpen,
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{ q?: string; filter?: string; tag?: string }>;
}

const INTENSITY_LABEL: Record<number, string> = {
  1: "Muy baja",
  2: "Baja",
  3: "Media",
  4: "Alta",
  5: "Muy alta",
};

export default async function SessionTemplatesPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  const { q, filter, tag } = await searchParams;
  const isMine = filter === "mine";
  const searchTerm = q?.trim() ?? "";

  const conditions = [];
  if (isMine) conditions.push(eq(sessionTemplates.authorId, user.id));
  if (searchTerm) conditions.push(ilike(sessionTemplates.title, `%${searchTerm}%`));

  const rows = await db
    .select({
      id: sessionTemplates.id,
      authorId: sessionTemplates.authorId,
      authorName: users.name,
      title: sessionTemplates.title,
      description: sessionTemplates.description,
      objective: sessionTemplates.objective,
      durationMinutes: sessionTemplates.durationMinutes,
      intensity: sessionTemplates.intensity,
      tags: sessionTemplates.tags,
      location: sessionTemplates.location,
      adoptionsCount: sessionTemplates.adoptionsCount,
      createdAt: sessionTemplates.createdAt,
    })
    .from(sessionTemplates)
    .leftJoin(users, eq(sessionTemplates.authorId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(sessionTemplates.adoptionsCount), desc(sessionTemplates.createdAt))
    .limit(60);

  const templates = tag
    ? rows.filter((r) => Array.isArray(r.tags) && r.tags.includes(tag))
    : rows;

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
        {/* Masthead */}
        <header className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
              Planificación · Mercado
            </p>
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/40 tabular-nums">
              {templates.length.toString().padStart(3, "0")} plantillas
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-foreground/15">
            <div className="max-w-2xl">
              <h1 className="font-heading text-4xl md:text-5xl leading-[1.05] tracking-tight text-foreground">
                <em className="italic text-brand">Plantillas</em>{" "}
                de sesión
              </h1>
              <p className="mt-3 text-[15px] text-foreground/65 leading-relaxed">
                Sesiones publicadas por entrenadores. Adóptalas, adáptalas a tu grupo y asígnalas a tus alumnos.
              </p>
            </div>
            <Link
              href="/sessions/new"
              className="inline-flex items-center gap-2 rounded-lg bg-brand text-background px-4 py-2.5 text-[13px] font-semibold hover:bg-brand/90 transition-colors shrink-0"
            >
              <Plus className="size-4" /> Nueva sesión
            </Link>
          </div>
        </header>

        {/* Filter tabs */}
        <nav className="flex items-end gap-8 border-b border-foreground/15">
          {([
            ["all", "Todas"],
            ["mine", "Mis plantillas"],
          ] as const).map(([key, label]) => {
            const isActive = key === "mine" ? isMine : !isMine;
            const href =
              key === "mine"
                ? `/sessions/templates?filter=mine${searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : ""}`
                : `/sessions/templates${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ""}`;
            return (
              <Link
                key={key}
                href={href}
                className={`pb-3 -mb-px flex items-baseline gap-2 border-b-2 transition-colors ${
                  isActive
                    ? "border-brand"
                    : "border-transparent hover:border-foreground/25"
                }`}
              >
                <span
                  className={`text-[15px] ${
                    isActive
                      ? "font-heading italic text-foreground"
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Search bar */}
        <form method="GET" className="relative max-w-sm">
          {isMine && <input type="hidden" name="filter" value="mine" />}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40" />
          <input
            type="search"
            name="q"
            defaultValue={searchTerm}
            placeholder="Buscar plantillas…"
            className="w-full rounded-lg border border-foreground/15 bg-foreground/[0.02] pl-9 pr-4 py-2 text-[13px] text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-brand/50"
          />
        </form>

        {/* Grid */}
        {templates.length === 0 ? (
          <section className="py-16 border-t border-foreground/10">
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/35 mb-4">
              Sin resultados
            </p>
            <h2 className="font-heading text-2xl text-foreground/60">
              {isMine
                ? "Aún no has publicado ninguna plantilla"
                : "No se encontraron plantillas"}
            </h2>
            <p className="mt-2 text-[14px] text-foreground/45">
              {isMine
                ? "Publica una de tus sesiones existentes para compartirla con la comunidad."
                : "Prueba con otro término de búsqueda."}
            </p>
            {isMine && (
              <Link
                href="/sessions"
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-foreground/20 px-4 py-2.5 text-[13px] font-medium text-foreground/70 hover:border-brand/40 hover:text-brand transition-colors"
              >
                <BookOpen className="size-4" /> Ver mis sesiones
              </Link>
            )}
          </section>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((t, i) => (
              <Link
                key={t.id}
                href={`/sessions/templates/${t.id}`}
                className="group relative flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 hover:border-brand/30 hover:bg-brand/[0.02] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/35 tabular-nums">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  {t.adoptionsCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/8 border border-brand/20 px-2 py-0.5 text-[10px] font-sans text-brand">
                      <Download className="size-3" />
                      {t.adoptionsCount}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-heading text-[17px] leading-snug text-foreground group-hover:text-brand transition-colors line-clamp-2">
                    {t.title}
                  </h3>
                  {t.objective && (
                    <p className="text-[12px] text-foreground/55 line-clamp-2 leading-relaxed">
                      {t.objective}
                    </p>
                  )}
                </div>

                <div className="mt-auto pt-3 border-t border-foreground/10 flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] text-foreground/50">
                    <Clock className="size-3.5" />
                    {t.durationMinutes} min
                  </span>
                  {t.intensity != null && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-foreground/50">
                      <Zap className="size-3.5" />
                      {INTENSITY_LABEL[t.intensity] ?? t.intensity}
                    </span>
                  )}
                  {t.authorName && (
                    <span className="ml-auto text-[11px] text-foreground/35 truncate max-w-[120px]">
                      {t.authorName}
                    </span>
                  )}
                </div>

                {Array.isArray(t.tags) && t.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(t.tags as string[]).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-brand/8 border border-brand/20 px-2 py-0.5 text-[10px] font-sans text-brand"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
