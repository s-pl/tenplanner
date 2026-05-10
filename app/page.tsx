import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  Sparkles,
  Repeat,
  Library,
  Heart,
  Calendar,
  ClipboardCheck,
  LayoutGrid,
  BookOpen,
} from "lucide-react";
import { db } from "@/db";
import { exercises, classes } from "@/db/schema";

/* ─── Decorative SVG ──────────────────────────────────────────── */

function CourtLines({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 200"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      className={className}
    >
      <g stroke="currentColor" strokeWidth="0.6">
        <rect x="2" y="2" width="396" height="196" />
        <line x1="200" y1="2" x2="200" y2="198" strokeDasharray="2 4" />
        <line x1="80" y1="2" x2="80" y2="198" />
        <line x1="320" y1="2" x2="320" y2="198" />
        <line x1="80" y1="100" x2="320" y2="100" />
      </g>
    </svg>
  );
}

/* ─── Page data ───────────────────────────────────────────────── */

const PAIN_POINTS = [
  {
    quote: "Llego a la pista sin tener claro qué voy a dar hoy.",
    body: "Improvisar no está mal. Repetir siempre lo mismo, sí. Tus alumnos lo notan.",
  },
  {
    quote: "Siempre acabo usando los mismos diez ejercicios.",
    body: "No es falta de ideas, es falta de tiempo para buscarlas.",
  },
  {
    quote: "Pierdo más tiempo planificando que dando clase.",
    body: "Una sesión bien planificada no debería llevarte más de dos minutos.",
  },
];

const STEPS = [
  {
    title: "Piensa la clase",
    body: "Decide si quieres explorar la biblioteca, construir desde cero o recuperar lo que ya funcionó.",
    detail: "Biblioteca · Mis clases · Favoritos",
  },
  {
    title: "Construye o ajusta",
    body: "Elige ejercicios, ordénalos, mezcla con tus favoritos. Siempre tienes el control.",
    detail: "Bloques · Duración · Material",
  },
  {
    title: "Da la clase y evalúa",
    body: "Pasa lista, ejecuta la sesión y registra cómo fue. Todo queda guardado en tu historial.",
    detail: "Asistencia · Valoración · Histórico",
  },
];

const THREE_WAYS = [
  {
    icon: Compass,
    title: "Explorar y elegir",
    body: "Navega ejercicios sueltos o clases completas, todo etiquetado por nivel, duración y categoría.",
    tags: ["Biblioteca", "Filtros", "Etiquetas"],
  },
  {
    icon: Sparkles,
    title: "Crear desde cero",
    body: "Diseña la clase ejercicio a ejercicio usando la biblioteca, tus ejercicios o una mezcla.",
    tags: ["Bloques", "Tus ejercicios", "Texto libre"],
  },
  {
    icon: Repeat,
    title: "Reutilizar una clase",
    body: "Recupera una clase del historial o de tus favoritos, ajusta lo que necesites y vuelve a impartirla.",
    tags: ["Histórico", "Favoritos", "Editable"],
  },
];

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "Explorador de contenido",
    body: "Ejercicios sueltos y clases completas etiquetados por nivel, objetivo, duración y categoría.",
  },
  {
    icon: Library,
    title: "Biblioteca validada",
    body: "Ejercicios específicos de tenis creados por entrenadores expertos, listos para usar o personalizar.",
  },
  {
    icon: Heart,
    title: "Favoritos organizados",
    body: "Guarda ejercicios y clases en listas con nombre. Encuentra rápido lo que mejor te funciona.",
  },
  {
    icon: Calendar,
    title: "Calendario de clases",
    body: "Visualiza todas tus sesiones impartidas, programadas y canceladas en un solo sitio.",
  },
  {
    icon: ClipboardCheck,
    title: "Pase de lista",
    body: "Registra la asistencia en segundos. Historial completo de cada alumno por clase.",
  },
  {
    icon: BookOpen,
    title: "Mi espacio",
    body: "Tus grupos, tus lugares, tus ejercicios y tus clases. Todo en un solo lugar.",
  },
];

const PRICING = [
  {
    name: "Prueba",
    price: "Gratis",
    sub: "14 días sin tarjeta",
    cta: "Empieza gratis",
    href: "/register",
    features: [
      "Acceso completo a la biblioteca",
      "Crea ejercicios, clases y sesiones",
      "Pase de lista y valoraciones",
    ],
  },
  {
    name: "Monitor",
    price: "9,90 €",
    sub: "al mes · IVA incluido",
    cta: "Empezar ahora",
    href: "/register",
    featured: true,
    features: [
      "Todo lo del plan Prueba",
      "Alumnos, grupos y lugares ilimitados",
      "Calendario y agenda completos",
      "Historial y estadísticas",
      "Soporte por email",
    ],
  },
  {
    name: "Escuela",
    price: "A medida",
    sub: "Equipos y clubes",
    cta: "Hablamos",
    href: "/contact",
    features: [
      "Cuentas para varios monitores",
      "Biblioteca compartida del club",
      "Facturación centralizada",
      "Soporte prioritario",
    ],
  },
];

const NIVEL_LABELS: Record<string, string> = {
  descubrimiento: "Descubrimiento (4-6)",
  desarrollo: "Desarrollo (6-8)",
  consolidacion: "Consolidación (8-10)",
  especializacion: "Especialización (10-12)",
  precompeticion: "Precompetición (12-14)",
  competicion: "Competición (14-18)",
  adultos_iniciacion: "Adultos iniciación",
  adultos_medio_alto: "Adultos medio-alto",
};

const CATEGORY_LABELS: Record<string, string> = {
  technique: "Técnica",
  tactics: "Táctica",
  fitness: "Físico",
  "warm-up": "Trabajo mental",
};

export default async function LandingPage() {
  const [featuredExercises, featuredClasses] = await Promise.all([
    db
      .select({
        id: exercises.id,
        name: exercises.name,
        category: exercises.category,
        durationMinutes: exercises.durationMinutes,
        nivel: exercises.nivel,
      })
      .from(exercises)
      .where(eq(exercises.isGlobal, true))
      .orderBy(desc(exercises.createdAt))
      .limit(3),
    db
      .select({
        id: classes.id,
        name: classes.name,
        duracionMinutes: classes.duracionMinutes,
        alumnosTipo: classes.alumnosTipo,
        nivel: classes.nivel,
      })
      .from(classes)
      .where(eq(classes.isLibrary, true))
      .orderBy(desc(classes.createdAt))
      .limit(3),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6 h-16">
            <Link
              href="/"
              className="font-heading text-2xl font-semibold tracking-tight"
              aria-label="Ten Planner"
            >
              ten<span className="text-brand">planner</span>
            </Link>
            <nav className="hidden md:flex items-center gap-7 text-[14px]">
              <a
                href="#funcionamiento"
                className="text-foreground/70 hover:text-foreground transition-colors"
              >
                Cómo funciona
              </a>
              <Link
                href="/exercises"
                className="text-foreground/70 hover:text-foreground transition-colors"
              >
                Ejercicios
              </Link>
              <Link
                href="/classes"
                className="text-foreground/70 hover:text-foreground transition-colors"
              >
                Clases
              </Link>
              <a
                href="#precios"
                className="text-foreground/70 hover:text-foreground transition-colors"
              >
                Precios
              </a>
            </nav>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline text-[13px] text-foreground/65 hover:text-foreground transition-colors px-3"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-md bg-foreground text-background text-[13px] font-semibold px-3.5 h-9 hover:bg-brand hover:text-brand-foreground transition-colors"
              >
                Empieza gratis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <CourtLines className="absolute -right-32 -bottom-20 w-[720px] text-brand/[0.06] hidden lg:block pointer-events-none" />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none [background-image:radial-gradient(ellipse_60%_40%_at_50%_-10%,color-mix(in_oklab,var(--brand)_8%,transparent),transparent_70%)]"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 lg:pt-20 pb-20 lg:pb-28">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/[0.07] px-3 h-7 text-[12px] font-medium text-brand">
                <span className="size-1.5 rounded-full bg-brand animate-pulse" />
                Hecho para monitores de tenis
              </span>

              <h1 className="mt-5 font-heading text-5xl sm:text-6xl lg:text-[5.5rem] font-semibold leading-[0.98] tracking-[-0.02em]">
                La clase la
                <br />
                piensas <em className="not-italic text-brand">tú</em>.
                <br />
                Ten Planner
                <br />
                te ayuda.
              </h1>

              <p className="mt-7 text-[17px] text-foreground/70 max-w-lg leading-relaxed">
                Explora ejercicios y clases etiquetados, construye desde cero
                con la biblioteca o recupera lo que ya funcionó.{" "}
                <span className="text-foreground font-medium">
                  Tres caminos, siempre tu criterio.
                </span>
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-md bg-brand text-brand-foreground text-[14px] font-semibold px-5 h-12 hover:bg-foreground hover:text-background transition-colors"
                >
                  Empieza gratis 14 días
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <a
                  href="#funcionamiento"
                  className="inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground/70 hover:text-foreground transition-colors px-2 h-12"
                >
                  Ver cómo funciona
                </a>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-6 max-w-md border-t border-border pt-6">
                {[
                  { v: "200+", k: "Monitores" },
                  { v: "90″", k: "Por clase" },
                  { v: "14", k: "Días gratis" },
                ].map((s) => (
                  <div key={s.k}>
                    <p className="font-heading text-3xl font-semibold tabular-nums leading-none">
                      {s.v}
                    </p>
                    <p className="mt-2 text-[12px] text-foreground/55">
                      {s.k}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup */}
            <div className="lg:col-span-5 relative">
              <div
                aria-hidden
                className="absolute -inset-8 bg-brand/[0.05] blur-3xl"
              />
              <div className="relative rounded-xl border border-border bg-card overflow-hidden shadow-[0_30px_60px_-30px_rgba(0,0,0,0.3)]">
                {/* Card header */}
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 bg-foreground/[0.015]">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-foreground truncate">
                      Iniciación · Martes
                    </p>
                    <p className="text-[12px] text-foreground/55 mt-0.5 tabular-nums">
                      18:00 — 19:00 · Pista 2
                    </p>
                  </div>
                  <span className="inline-flex items-center text-[10.5px] font-medium px-1.5 py-0.5 rounded border bg-brand/10 text-brand border-brand/20 shrink-0">
                    Programada
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {[
                    {
                      label: "Calentamiento",
                      total: "10 min",
                      featured: false,
                      items: [
                        ["Movilidad articular", "5′"],
                        ["Peloteo en mini-pista", "5′"],
                      ],
                    },
                    {
                      label: "Principal",
                      total: "40 min",
                      featured: true,
                      items: [
                        ["Drive cruzado a línea", "15′"],
                        ["Volea desde media pista", "15′"],
                        ["Saque al cuadro abierto", "10′"],
                      ],
                    },
                    {
                      label: "Vuelta a la calma",
                      total: "10 min",
                      featured: false,
                      items: [["Punto desde fondo controlado", "10′"]],
                    },
                  ].map((block) => (
                    <div
                      key={block.label}
                      className={
                        block.featured
                          ? "rounded-md border border-brand/30 bg-brand/[0.04] p-3"
                          : ""
                      }
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p
                          className={
                            block.featured
                              ? "text-[11px] font-semibold uppercase tracking-wide text-brand"
                              : "text-[11px] font-semibold uppercase tracking-wide text-foreground/55"
                          }
                        >
                          {block.label}
                        </p>
                        <p
                          className={
                            block.featured
                              ? "text-[11px] text-brand/80 tabular-nums"
                              : "text-[11px] text-foreground/45 tabular-nums"
                          }
                        >
                          {block.total}
                        </p>
                      </div>
                      <ul className="space-y-1.5">
                        {block.items.map(([name, dur]) => (
                          <li
                            key={name}
                            className="flex items-center gap-2 text-[13px]"
                          >
                            <span
                              className={
                                block.featured
                                  ? "size-1.5 rounded-full bg-brand"
                                  : "size-1.5 rounded-full bg-foreground/30"
                              }
                            />
                            <span className="flex-1 truncate">{name}</span>
                            <span
                              className={
                                block.featured
                                  ? "text-foreground/55 text-[11px] tabular-nums"
                                  : "text-foreground/45 text-[11px] tabular-nums"
                              }
                            >
                              {dur}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-3 border-t border-border flex items-center justify-between text-[12px] text-foreground/55 bg-foreground/[0.015]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-brand" />6
                    ejercicios · 60 min
                  </span>
                  <span className="tabular-nums">8 alumnos</span>
                </div>
              </div>

              {/* Floating stamp */}
              <div className="hidden sm:block absolute -top-3 -right-3 lg:-right-4 rotate-[4deg]">
                <div className="rounded border-2 border-brand bg-background px-3 py-1.5 shadow-lg">
                  <p className="text-[11px] font-semibold text-brand whitespace-nowrap">
                    Lista en 90 segundos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────────────────────── */}
      <section className="relative bg-foreground text-background border-b border-foreground/10 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.04] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:60px_60px]"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-brand mb-4">
              El problema
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-[-0.02em]">
              ¿Te suena esto?
              <br />
              <em className="not-italic text-brand">
                A todos los monitores les pasa.
              </em>
            </h2>
          </div>

          <ol className="mt-14 grid sm:grid-cols-3 gap-6 lg:gap-8">
            {PAIN_POINTS.map(({ quote, body }, i) => (
              <li
                key={quote}
                className="relative rounded-lg border border-background/15 bg-background/[0.02] p-6 lg:p-7"
              >
                <span
                  aria-hidden
                  className="absolute top-4 right-5 font-heading text-7xl leading-none text-brand/40 select-none"
                >
                  &ldquo;
                </span>
                <p className="font-heading text-[11px] font-semibold tabular-nums text-brand mb-5">
                  {String(i + 1).padStart(2, "0")} / 03
                </p>
                <p className="font-heading text-[19px] sm:text-[20px] font-semibold leading-snug text-background">
                  {quote}
                </p>
                <p className="mt-4 pt-4 border-t border-background/12 text-[14px] text-background/70 leading-relaxed">
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────────── */}
      <section
        id="funcionamiento"
        className="relative border-b border-border scroll-mt-20 overflow-hidden"
      >
        <CourtLines className="absolute -left-32 top-1/3 w-[600px] text-brand/[0.05] hidden lg:block pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-brand mb-4">
              Cómo funciona
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-[-0.02em]">
              Tú decides.
              <br />
              <em className="not-italic text-brand">En minutos.</em>
            </h2>
          </div>

          <ol className="mt-16 grid sm:grid-cols-3 gap-10 lg:gap-12 relative">
            {/* Court baseline */}
            <div
              aria-hidden
              className="hidden sm:block absolute top-7 left-[16%] right-[16%] h-px"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, currentColor 0 6px, transparent 6px 14px)",
                color: "var(--brand, #6db84a)",
                opacity: 0.4,
              }}
            />
            {STEPS.map(({ title, body, detail }, idx) => (
              <li key={title} className="relative">
                <div className="relative flex items-center justify-center size-14 rounded-full bg-background border-2 border-brand text-brand font-heading text-xl font-semibold mb-6 z-10">
                  {idx + 1}
                </div>
                <h3 className="font-heading text-2xl font-semibold leading-tight mb-2.5">
                  {title}
                </h3>
                <p className="text-[14.5px] text-foreground/65 leading-relaxed mb-4">
                  {body}
                </p>
                <p className="text-[12px] font-medium text-foreground/45 pt-3 border-t border-border">
                  {detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── TRES FORMAS ──────────────────────────────────────── */}
      <section className="border-b border-border bg-foreground/[0.025]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-[1fr_auto] items-end gap-6 mb-12 lg:mb-14">
            <div className="max-w-2xl">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-brand mb-4">
                El monitor decide
              </p>
              <h2 className="font-heading text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.02em]">
                Tú piensas la clase.
                <br />
                <em className="not-italic text-brand">
                  Tres formas de prepararla.
                </em>
              </h2>
            </div>
            <p className="text-[15px] text-foreground/65 max-w-md leading-relaxed border-l-2 border-brand/40 pl-5">
              No hay una única forma de planificar. Cada monitor trabaja
              diferente. Ten Planner se adapta.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {THREE_WAYS.map(({ icon: Icon, title, body, tags }, idx) => (
              <article
                key={title}
                className="group relative rounded-lg border border-border bg-card p-7 hover:border-brand/40 hover:shadow-sm transition-all"
              >
                <span
                  aria-hidden
                  className="absolute top-4 right-5 text-[11px] font-medium tabular-nums text-foreground/30"
                >
                  {String(idx + 1).padStart(2, "0")} / 03
                </span>
                <div className="inline-flex size-12 items-center justify-center rounded-lg bg-brand/10 text-brand mb-5 group-hover:bg-brand group-hover:text-brand-foreground transition-colors">
                  <Icon className="size-5" strokeWidth={1.8} />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-3 leading-tight">
                  {title}
                </h3>
                <p className="text-[14px] text-foreground/65 leading-relaxed mb-5">
                  {body}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-border">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10.5px] font-medium px-2 py-0.5 rounded border border-border text-foreground/65"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ──────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid md:grid-cols-[1fr_auto] items-end gap-6 mb-14">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-brand mb-4">
                Funcionalidades
              </p>
              <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-[-0.02em] max-w-3xl">
                Todo lo que necesita
                <br />
                <em className="not-italic text-brand">un monitor de tenis.</em>
              </h2>
            </div>
            <p className="text-[14px] text-foreground/55 max-w-xs md:text-right leading-relaxed">
              Seis bloques pensados para no perder ni un minuto entre la idea
              de la clase y la pista.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map(({ icon: Icon, title, body }, idx) => (
              <article
                key={title}
                className="group relative rounded-lg border border-border bg-card p-7 hover:border-brand/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="inline-flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Icon className="size-5" strokeWidth={1.8} />
                  </div>
                  <span className="text-[10.5px] font-medium tabular-nums text-foreground/35">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2 leading-tight">
                  {title}
                </h3>
                <p className="text-[14px] text-foreground/65 leading-relaxed">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── BIBLIOTECA ───────────────────────────────────────── */}
      <section className="relative bg-foreground text-background border-b border-foreground/10 overflow-hidden">
        <CourtLines className="absolute right-0 top-12 w-[500px] text-brand/[0.06] hidden lg:block pointer-events-none" />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.03] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:60px_60px]"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28 space-y-20">
          {/* Ejercicios */}
          <div>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-brand mb-4">
                  Cargado por expertos
                </p>
                <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.05] tracking-[-0.02em] max-w-2xl">
                  Ejercicios de tenis{" "}
                  <em className="not-italic text-brand">listos para usar.</em>
                </h2>
                <p className="mt-4 text-[15px] text-background/65 max-w-xl">
                  Cada ejercicio etiquetado por categoría, nivel y duración.
                  Encuéntralos en segundos y añádelos a tu sesión.
                </p>
              </div>
              <Link
                href="/exercises"
                className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-background/70 hover:text-brand transition-colors pb-1 border-b border-background/30 hover:border-brand"
              >
                Ver todos
                <ArrowUpRight className="size-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {featuredExercises.length === 0 ? (
                <div className="sm:col-span-3 rounded-lg border border-dashed border-background/20 px-6 py-12 text-center text-background/55">
                  Aún no hay ejercicios destacados.
                </div>
              ) : (
                featuredExercises.map((ex, i) => (
                  <Link
                    key={ex.id}
                    href={`/exercises/${ex.id}`}
                    className="group relative rounded-lg border border-background/15 p-6 hover:border-brand/50 hover:bg-background/[0.03] transition-colors flex flex-col justify-between min-h-[220px] overflow-hidden"
                  >
                    <span
                      aria-hidden
                      className="absolute -top-2 right-4 font-heading text-[8rem] leading-none tabular-nums text-background/[0.04] select-none group-hover:text-brand/[0.1] transition-colors"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="relative text-[12px] font-medium text-brand">
                      {ex.durationMinutes} min
                    </p>
                    <div className="relative">
                      <h3 className="font-heading text-xl font-semibold leading-snug line-clamp-3 mb-4">
                        {ex.name}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10.5px] font-medium px-1.5 py-0.5 rounded border border-brand/30 bg-brand/10 text-brand">
                          {CATEGORY_LABELS[ex.category] ?? ex.category}
                        </span>
                        {ex.nivel && (
                          <span className="text-[10.5px] px-1.5 py-0.5 rounded border border-background/20 text-background/65">
                            {NIVEL_LABELS[ex.nivel] ?? ex.nivel}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Clases */}
          <div>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-brand mb-4">
                  Plantillas validadas
                </p>
                <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.05] tracking-[-0.02em] max-w-2xl">
                  Clases preparadas{" "}
                  <em className="not-italic text-brand">listas para impartir.</em>
                </h2>
                <p className="mt-4 text-[15px] text-background/65 max-w-xl">
                  Sesiones completas con objetivos, ejercicios y duración.
                  Úsalas tal cual o adáptalas a tu grupo.
                </p>
              </div>
              <Link
                href="/classes"
                className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-background/70 hover:text-brand transition-colors pb-1 border-b border-background/30 hover:border-brand"
              >
                Ver todas
                <ArrowUpRight className="size-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {featuredClasses.length === 0 ? (
                <div className="sm:col-span-3 rounded-lg border border-dashed border-background/20 px-6 py-12 text-center text-background/55">
                  Aún no hay clases destacadas en biblioteca.
                </div>
              ) : (
                featuredClasses.map((cls, i) => (
                  <Link
                    key={cls.id}
                    href={`/classes/${cls.id}`}
                    className="group relative rounded-lg border border-background/15 p-6 hover:border-brand/50 hover:bg-background/[0.03] transition-colors flex flex-col justify-between min-h-[220px] overflow-hidden"
                  >
                    <span
                      aria-hidden
                      className="absolute -top-2 right-4 font-heading text-[8rem] leading-none tabular-nums text-background/[0.04] select-none group-hover:text-brand/[0.1] transition-colors"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="relative text-[12px] font-medium text-brand">
                      {cls.duracionMinutes} min
                      {cls.alumnosTipo && ` · ${cls.alumnosTipo}`}
                    </p>
                    <div className="relative">
                      <h3 className="font-heading text-xl font-semibold leading-snug line-clamp-3 mb-4">
                        {cls.name}
                      </h3>
                      {cls.nivel && (
                        <span className="inline-block text-[10.5px] font-medium px-1.5 py-0.5 rounded border border-brand/30 bg-brand/10 text-brand">
                          {NIVEL_LABELS[cls.nivel] ?? cls.nivel}
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRECIOS ──────────────────────────────────────────── */}
      <section
        id="precios"
        className="border-b border-border scroll-mt-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl mb-12 lg:mb-16">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-brand mb-4">
              Precios
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-[-0.02em]">
              Un único plan,
              <br />
              <em className="not-italic text-brand">todo incluido.</em>
            </h2>
            <p className="mt-5 text-[15px] text-foreground/65 max-w-xl leading-relaxed">
              Empieza gratis durante 14 días. Sin tarjeta. Sin compromiso.
              Cuando estés listo, una sola tarifa para todo lo que necesitas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 lg:gap-5 items-stretch">
            {PRICING.map((p) => (
              <article
                key={p.name}
                className={`relative rounded-xl p-7 lg:p-8 flex flex-col ${
                  p.featured
                    ? "border-2 border-brand bg-card shadow-[0_20px_50px_-20px_color-mix(in_oklab,var(--brand)_40%,transparent)] md:scale-[1.03] md:-my-2 z-10"
                    : "border border-border bg-card"
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-7 inline-flex items-center gap-1 bg-brand text-brand-foreground text-[11px] font-semibold px-2.5 py-1 rounded">
                    <Sparkles className="size-3" strokeWidth={2} />
                    Recomendado
                  </span>
                )}
                <p className="text-[12px] font-semibold uppercase tracking-wider text-foreground/55 mb-3">
                  {p.name}
                </p>
                <p className="font-heading text-[3rem] font-semibold tabular-nums leading-none">
                  {p.price}
                  {p.price === "9,90 €" && (
                    <span className="text-foreground/45 text-base font-normal ml-1">
                      /mes
                    </span>
                  )}
                </p>
                <p className="mt-2 text-[12.5px] text-foreground/55">
                  {p.sub}
                </p>
                <ul className="mt-7 space-y-2.5 text-[14px] text-foreground/75 border-t border-border pt-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        className="size-4 text-brand shrink-0 mt-0.5"
                        strokeWidth={2.5}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className={`mt-7 inline-flex w-full items-center justify-center gap-1.5 rounded-md text-[14px] font-semibold h-11 px-4 transition-colors ${
                    p.featured
                      ? "bg-brand text-brand-foreground hover:bg-foreground hover:text-background"
                      : "border border-border text-foreground hover:border-brand hover:text-brand"
                  }`}
                >
                  {p.cta}
                  {p.featured && <ArrowRight className="size-4" />}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="relative rounded-xl bg-foreground text-background p-8 sm:p-12 lg:p-16 overflow-hidden">
            <CourtLines className="absolute -right-24 -bottom-16 w-[600px] text-brand/[0.12] pointer-events-none" />
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none opacity-[0.04] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:60px_60px]"
            />
            <div className="relative grid md:grid-cols-[1.4fr_auto] items-end gap-8">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-brand mb-4">
                  Empieza hoy
                </p>
                <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-[-0.02em]">
                  La próxima clase,
                  <br />
                  <em className="not-italic text-brand">lista en minutos.</em>
                </h2>
                <p className="mt-5 text-[15px] text-background/70 max-w-md leading-relaxed">
                  Únete a más de 200 monitores que planifican mejor con Ten
                  Planner.
                </p>
              </div>
              <div className="md:text-right">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-md bg-brand text-brand-foreground text-[14.5px] font-semibold px-6 h-12 hover:bg-background hover:text-foreground transition-colors"
                >
                  Empieza gratis 14 días
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <p className="mt-3 text-[12px] text-background/55">
                  Sin tarjeta · Sin compromiso
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-8 pb-10 border-b border-border">
            <div>
              <span className="font-heading text-2xl font-semibold tracking-tight">
                ten<span className="text-brand">planner</span>
              </span>
              <p className="mt-4 text-[13.5px] text-foreground/60 max-w-xs leading-relaxed">
                Planificación de clases para monitores de tenis.
              </p>
            </div>
            {[
              {
                t: "Producto",
                l: [
                  ["Cómo funciona", "#funcionamiento"],
                  ["Biblioteca de ejercicios", "/exercises"],
                  ["Biblioteca de clases", "/classes"],
                  ["Precios", "#precios"],
                ],
              },
              {
                t: "Cuenta",
                l: [
                  ["Entrar", "/login"],
                  ["Crear cuenta", "/register"],
                ],
              },
              {
                t: "Soporte",
                l: [
                  ["Contacto", "/contact"],
                  ["Preguntas frecuentes", "/faq"],
                ],
              },
            ].map((col) => (
              <div key={col.t}>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-foreground/55 mb-4">
                  {col.t}
                </p>
                <ul className="space-y-2.5">
                  {col.l.map(([label, href]) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-[13.5px] text-foreground/75 hover:text-brand transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-6 text-[12px] text-foreground/50">
            © {new Date().getFullYear()} TenPlanner · Todos los derechos
            reservados
          </div>
        </div>
      </footer>
    </div>
  );
}
