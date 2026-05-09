import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowRight, ArrowDown, ArrowUpRight } from "lucide-react";
import { db } from "@/db";
import { exercises, classes } from "@/db/schema";

/* ─── Motifs ──────────────────────────────────────────────────── */

function CourtLines({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 200"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      className={className}
    >
      <g stroke="currentColor" strokeWidth="0.5">
        <rect x="2" y="2" width="396" height="196" rx="0" />
        <line x1="200" y1="2" x2="200" y2="198" strokeDasharray="1 3" />
        <line x1="80" y1="2" x2="80" y2="198" />
        <line x1="320" y1="2" x2="320" y2="198" />
        <line x1="80" y1="100" x2="320" y2="100" />
        <rect x="2" y="2" width="78" height="196" strokeOpacity="0.45" />
        <rect x="320" y="2" width="78" height="196" strokeOpacity="0.45" />
      </g>
    </svg>
  );
}

function HairlineGrid({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      style={{ opacity }}
      className="absolute inset-0 pointer-events-none [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:80px_80px]"
    />
  );
}

function Kicker({
  num,
  label,
  tone = "brand",
}: {
  num: string;
  label: string;
  tone?: "brand" | "muted" | "inverse";
}) {
  const toneClass =
    tone === "brand"
      ? "text-brand"
      : tone === "inverse"
        ? "text-background/70"
        : "text-foreground/55";
  return (
    <p
      className={`flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.32em] ${toneClass} mb-5`}
    >
      <span className="tabular-nums">№ {num}</span>
      <span
        aria-hidden
        className="h-px w-8 bg-current opacity-50"
      />
      <span>{label}</span>
    </p>
  );
}

function BigIndex({
  n,
  className = "",
}: {
  n: string;
  className?: string;
}) {
  return (
    <span
      className={`font-heading italic tabular-nums leading-none ${className}`}
    >
      {n}
    </span>
  );
}

/* ─── Page data ───────────────────────────────────────────────── */

const PAIN_POINTS = [
  {
    n: "01",
    quote: "Llego a la pista sin tener claro qué voy a dar hoy.",
    body: "Improvisar no está mal — repetir siempre lo mismo, sí. Tus alumnos lo notan.",
  },
  {
    n: "02",
    quote: "Siempre acabo usando los mismos diez ejercicios.",
    body: "No es falta de ideas. Es falta de tiempo para buscarlas. Ten Planner lo hace por ti.",
  },
  {
    n: "03",
    quote: "Pierdo más tiempo planificando que dando clase.",
    body: "Una sesión bien planificada no debería llevarte más de dos minutos. En serio.",
  },
];

const STEPS = [
  {
    n: "I",
    title: "Piensa la clase",
    body: "Tú tienes el criterio. Decide si quieres explorar la biblioteca, construir desde cero o recuperar lo que ya funcionó.",
  },
  {
    n: "II",
    title: "Construye o ajusta",
    body: "Elige ejercicios, ordénalos, mezcla con tus favoritos o ajusta la propuesta. Siempre tienes el control de la sesión.",
  },
  {
    n: "III",
    title: "Da la clase y evalúa",
    body: "Pasa lista, ejecuta la sesión en modo pista y registra cómo fue. Todo queda guardado en tu historial.",
  },
];

const THREE_WAYS = [
  {
    letter: "A",
    title: "Explorar y elegir",
    body: "¿Ya tienes en mente el tipo de sesión? Navega el explorador: ejercicios sueltos o clases completas, todo etiquetado por nivel, duración y categoría.",
    tags: ["Ejercicios sueltos", "Clases completas", "Todo etiquetado"],
    accent: "text-foreground border-foreground/30",
  },
  {
    letter: "B",
    title: "Crear desde cero",
    body: "¿Tienes una idea propia? Diseña la clase ejercicio a ejercicio usando la biblioteca de Ten Planner, tus propios ejercicios o una mezcla.",
    tags: ["Biblioteca Ten Planner", "Mis ejercicios"],
    accent: "text-brand border-brand/40",
  },
  {
    letter: "C",
    title: "Reutilizar una clase anterior",
    body: "¿Una clase funcionó? Recupérala del historial o de tus favoritos, ajusta lo que necesites y vuelve a impartirla.",
    tags: ["Mis clases", "Mis favoritos"],
    accent: "text-foreground border-foreground/30",
  },
];

const FEATURES = [
  {
    n: "01",
    title: "Explorador de contenido",
    body: "Ejercicios sueltos y clases completas etiquetados por nivel, objetivo, duración y categoría.",
  },
  {
    n: "02",
    title: "Biblioteca validada",
    body: "Ejercicios específicos de tenis creados por entrenadores expertos, listos para usar o personalizar.",
  },
  {
    n: "03",
    title: "Favoritos organizados",
    body: "Guarda ejercicios y clases en listas con nombre. Encuentra rápido lo que mejor te funciona.",
  },
  {
    n: "04",
    title: "Tu calendario de clases",
    body: "Visualiza todas tus sesiones impartidas, programadas y canceladas. Tu historial siempre disponible.",
  },
  {
    n: "05",
    title: "Pase de lista",
    body: "Registra la asistencia en segundos. Historial completo de cada alumno por clase.",
  },
  {
    n: "06",
    title: "Mi espacio",
    body: "Tu calendario, tus grupos, tus espacios, tus ejercicios y tus clases. Todo en un solo lugar.",
  },
];

const NIVEL_LABELS: Record<string, string> = {
  descubrimiento: "Descubrimiento",
  desarrollo: "Pelota roja",
  consolidacion: "Pelota naranja",
  especializacion: "Pelota verde",
  precompeticion: "Pelota amarilla",
  competicion: "Competición",
  adultos_iniciacion: "Adultos iniciación",
  adultos_medio_alto: "Adultos medio-alto",
};

const CATEGORY_LABELS: Record<string, string> = {
  technique: "Técnica",
  tactics: "Táctica",
  fitness: "Físico",
  "warm-up": "Calentamiento",
};

/* ─── Page ────────────────────────────────────────────────────── */

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
    <div className="min-h-screen bg-background text-foreground selection:bg-brand selection:text-brand-foreground">
      {/* ── Masthead ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65 border-b border-foreground/10">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10">
          <div className="flex items-end justify-between gap-6 py-4">
            <Link
              href="/"
              className="flex items-baseline gap-2 group"
              aria-label="Ten Planner — inicio"
            >
              <span className="font-heading text-[28px] leading-none tracking-tight sm:text-[32px]">
                Ten<span className="italic text-brand">planner</span>
              </span>
              <span className="hidden sm:inline font-mono text-[9px] tracking-[0.32em] uppercase text-foreground/40 pb-1">
                Cuaderno · pista
              </span>
            </Link>
            <nav className="hidden md:flex items-end gap-8 text-[13px]">
              <a
                href="#funcionamiento"
                className="text-foreground/65 hover:text-foreground transition-colors relative group"
              >
                Cómo funciona
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-brand scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </a>
              <Link
                href="/exercises"
                className="text-foreground/65 hover:text-foreground transition-colors relative group"
              >
                Ejercicios
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-brand scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
              <Link
                href="/classes"
                className="text-foreground/65 hover:text-foreground transition-colors relative group"
              >
                Clases
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-brand scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            </nav>
            <div className="flex items-center gap-1 sm:gap-3">
              <Link
                href="/login"
                className="hidden sm:inline text-[13px] text-foreground/55 hover:text-foreground transition-colors px-2"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 border border-foreground/20 bg-foreground text-background text-[12px] font-medium pl-3.5 pr-3.5 py-2 hover:bg-brand hover:text-brand-foreground hover:border-brand transition-colors"
              >
                Empieza gratis
                <ArrowRight
                  className="size-3.5 group-hover:translate-x-0.5 transition-transform"
                  strokeWidth={2}
                />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── 1. Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-foreground/10">
        <HairlineGrid opacity={0.05} />
        <CourtLines className="absolute -right-40 -bottom-32 w-[1000px] text-brand/[0.07] hidden lg:block" />
        {/* Lateral measurement scale */}
        <div
          aria-hidden
          className="absolute left-4 top-24 hidden lg:flex flex-col gap-1 font-mono text-[9px] text-foreground/25 tracking-wider"
        >
          {["00", "10", "20", "30", "40", "50"].map((n) => (
            <span key={n} className="tabular-nums">
              {n}
            </span>
          ))}
        </div>

        <div className="relative mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10 pt-14 lg:pt-20 pb-16 lg:pb-24">
          <Kicker num="00" label="Planificación · Monitores de tenis" />
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-end">
            <div className="lg:col-span-7">
              <h1 className="font-heading text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.94] tracking-tight text-foreground">
                La clase la
                <br />
                piensas tú.
                <br />
                <em className="italic text-brand">
                  Ten Planner
                  <br />
                  te ayuda.
                </em>
              </h1>

              <div className="mt-9 max-w-xl border-l-2 border-brand pl-5 py-1">
                <p className="text-[15px] text-foreground/72 leading-relaxed">
                  Explora ejercicios y clases etiquetados, construye desde cero
                  con la biblioteca o recupera lo que ya funcionó.{" "}
                  <strong className="text-foreground">
                    Tres caminos, siempre tu criterio.
                  </strong>
                </p>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-3">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2.5 bg-brand text-brand-foreground text-[13px] font-semibold px-5 py-3 hover:bg-foreground hover:text-background transition-colors"
                >
                  Empieza gratis
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <a
                  href="#funcionamiento"
                  className="group inline-flex items-center gap-2 text-[13px] font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  <span className="border-b border-dotted border-foreground/30 group-hover:border-brand pb-0.5">
                    Ver cómo funciona
                  </span>
                  <ArrowDown className="size-3.5 group-hover:translate-y-0.5 transition-transform" />
                </a>
              </div>

              {/* Tarja de proof */}
              <div className="mt-12 grid grid-cols-3 gap-4 max-w-md border-t border-foreground/12 pt-5">
                <div>
                  <p className="font-heading text-3xl text-foreground tabular-nums">
                    200+
                  </p>
                  <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-foreground/50">
                    Monitores
                  </p>
                </div>
                <div>
                  <p className="font-heading text-3xl text-foreground tabular-nums">
                    90<span className="text-brand">″</span>
                  </p>
                  <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-foreground/50">
                    Por clase
                  </p>
                </div>
                <div>
                  <p className="font-heading text-3xl text-foreground tabular-nums">
                    14
                  </p>
                  <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-foreground/50">
                    Días gratis
                  </p>
                </div>
              </div>
            </div>

            {/* Mockup editorial */}
            <div className="lg:col-span-5 relative">
              <div
                aria-hidden
                className="absolute -inset-6 bg-brand/[0.04] blur-2xl"
              />
              <div className="relative border border-foreground/15 bg-card overflow-hidden">
                {/* status notch */}
                <div className="px-5 py-3 border-b border-foreground/10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/45">
                  <span className="tabular-nums">09:41</span>
                  <span className="flex items-center gap-1">
                    <span className="size-1 bg-foreground/35" />
                    <span className="size-1 bg-foreground/35" />
                    <span className="size-1 bg-brand" />
                  </span>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/45 mb-1.5">
                      Buenos días
                    </p>
                    <p className="font-heading text-2xl italic text-foreground leading-tight">
                      Carlos Martínez
                    </p>
                  </div>

                  {/* Próxima clase — formato boletín */}
                  <div className="border border-brand/30 bg-brand/[0.05] p-4">
                    <div className="flex items-baseline justify-between gap-3 border-b border-brand/20 pb-2.5 mb-3">
                      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-brand">
                        Próxima clase · 10:00 h
                      </p>
                      <span className="font-mono text-[9.5px] tabular-nums text-brand/70">
                        № 04
                      </span>
                    </div>
                    <p className="font-heading text-lg text-foreground leading-tight">
                      Grupo Iniciación
                    </p>
                    <dl className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-brand/15">
                      {[
                        { v: "6", k: "Ejerc." },
                        { v: "60", k: "Min." },
                        { v: "8", k: "Alumn." },
                      ].map((s) => (
                        <div key={s.k}>
                          <dd className="font-heading text-2xl text-foreground tabular-nums leading-none">
                            {s.v}
                          </dd>
                          <dt className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-foreground/55">
                            {s.k}
                          </dt>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* Lista de acciones — sin iconos, solo tipografía */}
                  <ul className="divide-y divide-foreground/8">
                    {[
                      ["Explorar biblioteca", "→"],
                      ["Crear desde cero", "→"],
                      ["Reutilizar clase", "→"],
                      ["Mis favoritos", "→"],
                    ].map(([label, arr], idx) => (
                      <li
                        key={label}
                        className="flex items-center justify-between py-2.5 group"
                      >
                        <span className="flex items-center gap-3 text-[13px] text-foreground/85">
                          <span className="font-mono text-[10px] tabular-nums text-foreground/35">
                            0{idx + 1}
                          </span>
                          {label}
                        </span>
                        <span className="text-foreground/35 group-hover:text-brand transition-colors">
                          {arr}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-foreground/10 px-5 py-3 flex items-center justify-between">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-foreground/40">
                    Sesión guardada
                  </p>
                  <span className="size-1.5 rounded-full bg-brand animate-pulse" />
                </div>
              </div>

              {/* Sello de "lista en 90 seg" */}
              <div className="absolute -top-4 -right-3 sm:right-4 lg:-right-4 rotate-[6deg]">
                <div className="border-2 border-brand bg-background px-3 py-1.5 shadow-lg">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-brand whitespace-nowrap">
                    Clase lista · 90 seg
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. El dolor ──────────────────────────────────────── */}
      <section className="relative bg-foreground text-background border-b border-foreground/10 overflow-hidden">
        <HairlineGrid opacity={0.04} />
        <div className="relative mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10 py-20 lg:py-28">
          <Kicker num="01" label="El problema en tres actos" tone="brand" />
          <h2 className="font-heading text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.95] tracking-tight max-w-4xl">
            ¿Te suena esto?
            <br />
            <em className="italic text-brand">
              A todos los monitores les pasa.
            </em>
          </h2>

          <ol className="mt-14 grid sm:grid-cols-3 gap-px bg-background/15">
            {PAIN_POINTS.map(({ n, quote, body }) => (
              <li
                key={n}
                className="relative bg-foreground p-7 lg:p-9 group"
              >
                <span
                  aria-hidden
                  className="absolute top-5 right-5 font-heading italic text-brand/45 text-7xl leading-none select-none"
                >
                  &ldquo;
                </span>
                <BigIndex
                  n={n}
                  className="text-brand text-6xl mb-7 inline-block"
                />
                <p className="font-heading text-[19px] sm:text-[21px] leading-snug italic text-background">
                  {quote}
                </p>
                <div className="mt-6 pt-5 border-t border-background/15">
                  <p className="text-[13.5px] text-background/65 leading-relaxed">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 3. Funcionamiento timeline ──────────────────────── */}
      <section
        id="funcionamiento"
        className="relative border-b border-foreground/10 scroll-mt-20 overflow-hidden"
      >
        <CourtLines className="absolute -left-40 top-1/3 w-[800px] text-brand/[0.05] hidden lg:block" />
        <div className="relative mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10 py-20 lg:py-28">
          <div className="max-w-3xl">
            <Kicker num="02" label="Cómo funciona · tres tiempos" />
            <h2 className="font-heading text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.95] tracking-tight">
              Tú decides.{" "}
              <em className="italic text-brand">En minutos.</em>
            </h2>
          </div>

          <div className="mt-16 grid sm:grid-cols-3 gap-10 lg:gap-12 relative">
            {/* Línea base como una pista */}
            <div
              aria-hidden
              className="hidden sm:block absolute top-12 left-0 right-0 h-px"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, currentColor 0 6px, transparent 6px 14px)",
                color: "var(--brand, #6db84a)",
                opacity: 0.4,
              }}
            />
            {STEPS.map(({ n, title, body }, idx) => (
              <div key={n} className="relative pt-0">
                <div className="flex items-baseline gap-4 border-b border-foreground/15 pb-5">
                  <BigIndex n={n} className="text-brand text-7xl" />
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-foreground/45">
                      Paso 0{idx + 1}
                    </span>
                    <span
                      aria-hidden
                      className="size-2 rounded-full bg-brand mt-1"
                    />
                  </div>
                </div>
                <h3 className="font-heading italic text-2xl text-foreground mt-6 mb-3 leading-tight">
                  {title}
                </h3>
                <p className="text-[14.5px] text-foreground/65 leading-relaxed max-w-sm">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Tres formas de prepararla ────────────────────── */}
      <section className="relative border-b border-foreground/10 bg-foreground/[0.025] overflow-hidden">
        <HairlineGrid opacity={0.04} />
        <div className="relative mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10 py-20 lg:py-28">
          <div className="max-w-3xl">
            <Kicker num="03" label="El monitor decide" />
            <h2 className="font-heading text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.95] tracking-tight">
              Tú piensas la clase.
              <br />
              <em className="italic text-brand">
                Tres formas de prepararla.
              </em>
            </h2>
            <p className="mt-6 text-[15px] text-foreground/65 max-w-2xl leading-relaxed border-l border-foreground/15 pl-5">
              No hay una única forma de planificar. Cada monitor trabaja
              diferente. Ten Planner se adapta a cómo quieras preparar cada
              sesión.
            </p>
          </div>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {THREE_WAYS.map(({ letter, title, body, tags, accent }, idx) => (
              <article
                key={letter}
                className="group relative border border-foreground/12 bg-card p-7 hover:border-brand/40 transition-colors"
              >
                <span
                  aria-hidden
                  className="absolute top-0 right-0 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 px-3 py-1.5"
                >
                  {String(idx + 1).padStart(2, "0")} / 03
                </span>
                <div
                  className={`inline-flex size-14 items-center justify-center border-2 ${accent} mb-7 transition-transform group-hover:-rotate-3`}
                >
                  <span className="font-heading italic text-3xl leading-none">
                    {letter}
                  </span>
                </div>
                <h3 className="font-heading italic text-2xl text-foreground mb-4 leading-tight">
                  {title}
                </h3>
                <p className="text-[14px] text-foreground/65 leading-relaxed mb-6">
                  {body}
                </p>
                <div className="border-t border-foreground/12 pt-4 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10.5px] font-mono uppercase tracking-[0.14em] px-2.5 py-1 border border-foreground/15 text-foreground/65"
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

      {/* ── 5. Funcionalidades ───────────────────────────────── */}
      <section className="relative border-b border-foreground/10 overflow-hidden">
        <div className="relative mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10 py-20 lg:py-28">
          <div className="grid md:grid-cols-[auto_1fr] items-end gap-6 mb-14 max-w-5xl">
            <div>
              <Kicker num="04" label="Funcionalidades · catálogo" />
              <h2 className="font-heading text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.95] tracking-tight">
                Todo lo que necesita
                <br />
                <em className="italic text-brand">un monitor de tenis</em>
              </h2>
            </div>
            <p className="text-[14px] text-foreground/55 leading-relaxed pb-3 max-w-md ml-auto md:text-right border-r-2 md:border-r-0 md:border-l-2 border-brand/40 pl-4 md:pl-0 md:pr-4">
              Seis bloques pensados para no perder ni un minuto entre la idea de
              la clase y la pista.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/10">
            {FEATURES.map(({ n, title, body }, idx) => (
              <article
                key={n}
                className="bg-background p-7 lg:p-8 group hover:bg-foreground/[0.025] transition-colors relative"
              >
                <div className="flex items-baseline justify-between border-b border-foreground/12 pb-5 mb-5">
                  <BigIndex
                    n={n}
                    className="text-foreground text-5xl group-hover:text-brand transition-colors"
                  />
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-foreground/35">
                    Funcionalidad
                  </span>
                </div>
                <h3 className="font-heading text-xl text-foreground mb-3 leading-tight">
                  {title}
                </h3>
                <p className="text-[13.5px] text-foreground/60 leading-relaxed">
                  {body}
                </p>
                <div
                  aria-hidden
                  className="absolute bottom-0 left-0 right-0 h-px bg-brand scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
                />
                {idx === 5 && (
                  <span
                    aria-hidden
                    className="absolute bottom-3 right-4 font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/30"
                  >
                    Fin
                  </span>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Acceso biblioteca ─────────────────────────────── */}
      <section className="relative bg-foreground text-background border-b border-foreground/10 overflow-hidden">
        <HairlineGrid opacity={0.04} />
        <CourtLines className="absolute right-0 top-20 w-[600px] text-brand/[0.06] hidden lg:block" />

        <div className="relative mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10 py-20 lg:py-28 space-y-24">
          {/* Ejercicios destacados */}
          <div>
            <div className="grid md:grid-cols-[1fr_auto] items-end gap-6 mb-12">
              <div>
                <Kicker
                  num="05"
                  label="Ejercicios cargados por expertos"
                  tone="brand"
                />
                <h2 className="font-heading text-[clamp(2.25rem,5.5vw,4rem)] leading-[0.95] tracking-tight max-w-3xl">
                  Ejercicios de tenis{" "}
                  <em className="italic text-brand">listos para usar</em>
                </h2>
                <p className="mt-5 text-[14.5px] text-background/65 max-w-xl leading-relaxed">
                  Cada ejercicio etiquetado por categoría, nivel y duración.
                  Encuéntralos en segundos y añádelos a tu sesión.
                </p>
              </div>
              <Link
                href="/exercises"
                className="group inline-flex items-center gap-2 self-end font-mono text-[10.5px] uppercase tracking-[0.22em] text-background/70 hover:text-brand transition-colors pb-2 border-b border-background/30 hover:border-brand"
              >
                Ver todos
                <ArrowUpRight className="size-3 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-px bg-background/10">
              {featuredExercises.length === 0 ? (
                <div className="sm:col-span-3 bg-foreground border border-dashed border-background/15 px-6 py-16 text-center text-background/55">
                  Aún no hay ejercicios destacados.
                </div>
              ) : (
                featuredExercises.map((ex, i) => (
                  <Link
                    key={ex.id}
                    href={`/exercises/${ex.id}`}
                    className="group bg-foreground p-6 lg:p-8 hover:bg-background/[0.04] transition-colors relative flex flex-col justify-between min-h-[280px]"
                  >
                    {/* Número de jersey */}
                    <span
                      aria-hidden
                      className="absolute top-5 right-5 font-heading italic text-background/8 text-[8rem] leading-none select-none tabular-nums group-hover:text-brand/15 transition-colors"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="relative font-mono text-[9.5px] uppercase tracking-[0.22em] text-brand">
                      Ejercicio · {ex.durationMinutes}&prime;
                    </p>
                    <div className="relative">
                      <h3 className="font-heading italic text-2xl lg:text-[26px] leading-tight text-background line-clamp-3 mb-4">
                        {ex.name}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-[0.16em] px-2 py-0.5 border border-brand/30 bg-brand/10 text-brand">
                          {CATEGORY_LABELS[ex.category] ?? ex.category}
                        </span>
                        {ex.nivel && (
                          <span className="text-[10px] font-mono uppercase tracking-[0.16em] px-2 py-0.5 border border-background/20 text-background/65">
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

          {/* Clases destacadas */}
          <div>
            <div className="grid md:grid-cols-[1fr_auto] items-end gap-6 mb-12">
              <div>
                <Kicker
                  num="06"
                  label="Clases creadas por expertos"
                  tone="brand"
                />
                <h2 className="font-heading text-[clamp(2.25rem,5.5vw,4rem)] leading-[0.95] tracking-tight max-w-3xl">
                  Clases preparadas{" "}
                  <em className="italic text-brand">listas para impartir</em>
                </h2>
                <p className="mt-5 text-[14.5px] text-background/65 max-w-xl leading-relaxed">
                  Sesiones completas con objetivos, ejercicios y duración.
                  Úsalas tal cual o adáptalas a tu grupo.
                </p>
              </div>
              <Link
                href="/classes"
                className="group inline-flex items-center gap-2 self-end font-mono text-[10.5px] uppercase tracking-[0.22em] text-background/70 hover:text-brand transition-colors pb-2 border-b border-background/30 hover:border-brand"
              >
                Ver todas
                <ArrowUpRight className="size-3 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-px bg-background/10">
              {featuredClasses.length === 0 ? (
                <div className="sm:col-span-3 bg-foreground border border-dashed border-background/15 px-6 py-16 text-center text-background/55">
                  Aún no hay clases destacadas en biblioteca.
                </div>
              ) : (
                featuredClasses.map((cls, i) => (
                  <Link
                    key={cls.id}
                    href={`/classes/${cls.id}`}
                    className="group bg-foreground p-6 lg:p-8 hover:bg-background/[0.04] transition-colors relative flex flex-col justify-between min-h-[280px]"
                  >
                    <span
                      aria-hidden
                      className="absolute top-5 right-5 font-heading italic text-background/8 text-[8rem] leading-none select-none tabular-nums group-hover:text-brand/15 transition-colors"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="relative font-mono text-[9.5px] uppercase tracking-[0.22em] text-brand">
                      Clase · {cls.duracionMinutes}&prime;
                      {cls.alumnosTipo && ` · ${cls.alumnosTipo}`}
                    </p>
                    <div className="relative">
                      <h3 className="font-heading italic text-2xl lg:text-[26px] leading-tight text-background line-clamp-3 mb-4">
                        {cls.name}
                      </h3>
                      {cls.nivel && (
                        <span className="inline-block text-[10px] font-mono uppercase tracking-[0.16em] px-2 py-0.5 border border-brand/30 bg-brand/10 text-brand">
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

      {/* ── 7. CTA final ─────────────────────────────────────── */}
      <section className="relative border-b border-foreground/10 overflow-hidden">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10 py-20 lg:py-24">
          <div className="relative overflow-hidden bg-foreground text-background p-8 sm:p-12 lg:p-16">
            <CourtLines className="absolute -right-32 -bottom-24 w-[700px] text-brand/[0.12]" />
            <HairlineGrid opacity={0.04} />
            <div className="relative grid md:grid-cols-[1.4fr_auto] gap-10 items-end">
              <div>
                <Kicker num="07" label="Cierre · Final del informe" tone="brand" />
                <h2 className="font-heading text-[clamp(2.25rem,5.5vw,4.5rem)] leading-[0.95] tracking-tight">
                  La próxima clase,
                  <br />
                  <em className="italic text-brand">lista en minutos.</em>
                </h2>
                <p className="mt-6 text-[14.5px] text-background/65 max-w-md leading-relaxed">
                  Únete a más de 200 monitores que ya planifican mejor con Ten
                  Planner. Catorce días gratis. Sin tarjeta. Sin compromiso.
                </p>
              </div>
              <div className="md:text-right">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2.5 bg-brand text-brand-foreground text-[13.5px] font-semibold px-6 py-3.5 hover:bg-background hover:text-foreground transition-colors"
                >
                  Empieza gratis
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-background/50">
                  14 días gratis · Sin tarjeta
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Footer ───────────────────────────────────────── */}
      <footer className="bg-background relative">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10 py-14">
          <div className="grid md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-10 pb-10 border-b border-foreground/10">
            <div>
              <span className="font-heading text-[28px] leading-none tracking-tight">
                Ten<span className="italic text-brand">planner</span>
              </span>
              <p className="mt-5 text-[13.5px] text-foreground/65 leading-relaxed max-w-xs">
                Cuaderno digital del entrenador de tenis.{" "}
                <em className="italic text-foreground">
                  Hecho para la pista, no para la demo.
                </em>
              </p>
              <p className="mt-6 font-mono text-[9.5px] uppercase tracking-[0.22em] text-foreground/40">
                Edición {new Date().getFullYear()} · Cuadernillo № 01
              </p>
            </div>
            {[
              {
                t: "Producto",
                l: [
                  ["Cómo funciona", "#funcionamiento"],
                  ["Biblioteca de ejercicios", "/exercises"],
                  ["Biblioteca de clases", "/classes"],
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
                <p className="font-mono text-[9.5px] tracking-[0.32em] uppercase text-foreground/45 mb-5 pb-2 border-b border-foreground/10">
                  {col.t}
                </p>
                <ul className="space-y-3">
                  {col.l.map(([label, href]) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="group inline-flex items-center gap-2 text-[13.5px] text-foreground/80 hover:text-brand transition-colors"
                      >
                        <span className="border-b border-transparent group-hover:border-brand transition-colors">
                          {label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-6 flex items-baseline justify-between flex-wrap gap-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-foreground/55">
            <span>
              © {new Date().getFullYear()} TenPlanner · Todos los derechos
              reservados
            </span>
            <span className="text-foreground/35">
              Pensado y escrito en pista
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
