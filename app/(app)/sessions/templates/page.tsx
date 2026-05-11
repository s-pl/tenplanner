import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { sessionTemplates, users } from "@/db/schema";
import { and, desc, eq, ilike } from "drizzle-orm";
import { Clock, Zap, Download, Plus, Search, BookOpen } from "lucide-react";
import { FeatureLocked } from "@/components/app/feature-locked";
import { getBooleanSetting } from "@/lib/app-settings";

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

export default async function SessionTemplatesPage({
  searchParams,
}: PageProps) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  const templatesEnabled = await getBooleanSetting(
    "feature.session_templates_enabled"
  );
  if (!templatesEnabled) {
    return (
      <FeatureLocked
        title="Plantillas desactivadas"
        description="El administrador ha pausado temporalmente la biblioteca de plantillas de sesión."
        href="/sessions"
        cta="Volver a sesiones"
      />
    );
  }

  const { q, filter, tag } = await searchParams;
  const isMine = filter === "mine";
  const searchTerm = q?.trim() ?? "";

  const conditions = [];
  if (isMine) conditions.push(eq(sessionTemplates.authorId, user.id));
  if (searchTerm)
    conditions.push(ilike(sessionTemplates.title, `%${searchTerm}%`));

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
    .orderBy(
      desc(sessionTemplates.adoptionsCount),
      desc(sessionTemplates.createdAt)
    )
    .limit(60);

  const templates = tag
    ? rows.filter((r) => Array.isArray(r.tags) && r.tags.includes(tag))
    : rows;

  return (
    <div className="tp-page">
      <div className="tp-page-pad space-y-8">
        {/* Masthead */}
        <header className="tp-hero-panel flex flex-col gap-6 p-6 text-white sm:p-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#D6FF38] px-3 py-1 text-[11px] font-black uppercase text-[#050505]">
                <BookOpen className="size-3.5" />
                Biblioteca
              </div>
              <h1 className="text-4xl font-black leading-tight md:text-5xl">
                Plantillas de sesión
              </h1>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/62">
                Sesiones publicadas por entrenadores. Adóptalas, adáptalas a tu
                grupo y asígnalas a tus alumnos.
              </p>
            </div>
            <Link
              href="/sessions/new"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#D6FF38] px-4 text-[13px] font-black text-[#050505] transition-transform hover:-translate-y-0.5"
            >
              <Plus className="size-4" /> Nueva sesión
            </Link>
        </header>

        {/* Filter tabs */}
        <nav className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[#050505]/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#10100e]">
          <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Todas"],
              ["mine", "Mis plantillas"],
            ] as const
          ).map(([key, label]) => {
            const isActive = key === "mine" ? isMine : !isMine;
            const href =
              key === "mine"
                ? `/sessions/templates?filter=mine${searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : ""}`
                : `/sessions/templates${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ""}`;
            return (
              <Link
                key={key}
                href={href}
                className={`flex h-10 items-center rounded-full px-4 text-sm font-black transition-colors ${
                  isActive
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            );
          })}
          </div>
          <p className="rounded-full bg-[#F4F4F1] px-3 py-2 text-[11px] font-black uppercase tabular-nums text-foreground/55 dark:bg-white/[0.04]">
            {templates.length.toString().padStart(3, "0")} plantillas
          </p>
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
            className="tp-field h-11 w-full pl-9 pr-4 text-[13px] font-medium placeholder:text-foreground/35"
          />
        </form>

        {/* Grid */}
        {templates.length === 0 ? (
          <section className="tp-panel border-dashed px-6 py-16">
            <p className="tp-kicker mb-4">
              Sin resultados
            </p>
            <h2 className="text-2xl font-black text-foreground/65">
              {isMine
                ? "Aún no has publicado ninguna plantilla"
                : "No se encontraron plantillas"}
            </h2>
            <p className="mt-2 text-[14px] text-foreground/50">
              {isMine
                ? "Publica una de tus sesiones existentes para compartirla con la comunidad."
                : "Prueba con otro término de búsqueda."}
            </p>
            {isMine && (
              <Link
                href="/sessions"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-[#050505]/10 px-4 text-[13px] font-black text-foreground/70 transition-colors hover:border-brand/40 hover:text-brand dark:border-white/10"
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
                className="group relative flex min-h-[245px] flex-col gap-3 rounded-[28px] border border-[#050505]/10 bg-white p-5 shadow-[0_24px_80px_-64px_rgba(5,5,5,0.7)] transition-all hover:-translate-y-0.5 hover:border-brand/40 dark:border-white/10 dark:bg-[#10100e]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/35 tabular-nums">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  {t.adoptionsCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/15 px-2 py-0.5 text-[10px] font-black text-foreground">
                      <Download className="size-3" />
                      {t.adoptionsCount}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="line-clamp-2 text-[18px] font-black leading-snug text-foreground transition-colors group-hover:text-brand">
                    {t.title}
                  </h3>
                  {t.objective && (
                    <p className="text-[12px] text-foreground/55 line-clamp-2 leading-relaxed">
                      {t.objective}
                    </p>
                  )}
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-[#050505]/10 pt-3 dark:border-white/10">
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
                        className="rounded-full border border-brand/20 bg-brand/15 px-2 py-0.5 text-[10px] font-black text-foreground"
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
