import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  BarChart3,
  Dumbbell,
  CalendarDays,
  Target,
} from "lucide-react";
import { ThemeToggle } from "@/components/app/theme-toggle";

/* ─────────────────────────────────────────────────────────────
   DASHBOARD MOCK
───────────────────────────────────────────────────────────── */
function MockDashboard() {
  return (
    <div className="relative">
      {/* Badge — top right */}
      <div className="absolute -top-6 -right-2 z-20 bg-card border border-border rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 animate-fade-up stagger-3 whitespace-nowrap">
        <div className="size-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
          <CalendarDays className="size-5 text-violet-500" />
        </div>
        <div>
          <p className="text-xs font-bold text-foreground leading-tight">Próxima sesión</p>
          <p className="text-xs text-muted-foreground">Hoy, 18:00</p>
        </div>
      </div>

      {/* Main window */}
      <div
        className="relative w-[520px] rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/35 overflow-hidden animate-fade-up stagger-2"
        style={{ transform: "perspective(900px) rotateY(-22deg) rotateX(6deg)" }}
      >
        {/* Browser chrome */}
        <div className="bg-sidebar border-b border-border px-4 py-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-red-400/70" />
            <div className="size-3 rounded-full bg-amber-400/70" />
            <div className="size-3 rounded-full bg-brand/70" />
          </div>
          <div className="flex-1 mx-3 rounded-md bg-background/50 h-5 flex items-center px-2.5">
            <span className="text-[10px] text-muted-foreground/40 font-mono">
              tenplanner.com/dashboard
            </span>
          </div>
        </div>

        <div className="flex" style={{ height: 340 }}>
          {/* Sidebar */}
          <div className="w-14 bg-sidebar/90 border-r border-border flex flex-col items-center py-5 gap-3 shrink-0">
            <div className="size-7 rounded-lg bg-brand/20 flex items-center justify-center">
              <Zap className="size-3.5 text-brand" strokeWidth={2.5} />
            </div>
            <div className="mt-3 space-y-2.5">
              {([BarChart3, Dumbbell, Target, CalendarDays] as const).map((Icon, i) => (
                <div
                  key={i}
                  className={`size-8 rounded-xl flex items-center justify-center ${i === 0 ? "bg-brand/15" : ""}`}
                >
                  <Icon className={`size-4 ${i === 0 ? "text-brand" : "text-muted-foreground/40"}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 bg-background/70 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-muted-foreground">Buenos días,</p>
                <p className="text-base font-bold text-foreground leading-tight">Coach Samu</p>
              </div>
              <div className="size-8 rounded-full bg-brand/20 flex items-center justify-center">
                <span className="text-xs font-bold text-brand">S</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: "Sesiones", value: "4" },
                { label: "Horas", value: "12h" },
                { label: "Ejercicios", value: "24" },
                { label: "Racha", value: "7d 🔥" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-card rounded-xl p-3 border border-border/60">
                  <p className="text-[9px] text-muted-foreground mb-1">{label}</p>
                  <p className="text-base font-bold text-foreground leading-none">{value}</p>
                </div>
              ))}
            </div>

            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Próximas
            </p>
            <div className="space-y-2">
              {[
                { name: "Técnica de bandeja", day: "Hoy", color: "bg-blue-500" },
                { name: "Circuito de fitness", day: "Mañana", color: "bg-amber-500" },
                { name: "Táctica en parejas", day: "Jue", color: "bg-violet-500" },
              ].map(({ name, day, color }) => (
                <div
                  key={name}
                  className="flex items-center gap-2.5 bg-card rounded-xl px-3 py-2 border border-border/50"
                >
                  <div className={`size-2 rounded-full ${color} shrink-0`} />
                  <span className="text-xs font-medium text-foreground flex-1 truncate">{name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Badge — bottom left */}
      <div className="absolute -bottom-6 -left-2 z-20 bg-card border border-border rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 animate-fade-up stagger-4 whitespace-nowrap">
        <div className="size-10 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
          <BarChart3 className="size-5 text-brand" />
        </div>
        <div>
          <p className="text-xs font-bold text-foreground leading-tight">Sesiones esta semana</p>
          <p className="text-xs text-muted-foreground">4 de 5 completadas</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-brand flex items-center justify-center shadow-sm shadow-brand/25">
              <Zap className="size-4 text-brand-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight">
              ten<span className="text-brand">planner</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {[
              ["Funciones", "#funciones"],
              ["Cómo funciona", "#proceso"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <Link
              href="/login"
              className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-brand text-brand-foreground px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors shadow-sm shadow-brand/25"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden court-grid flex items-center"
        style={{ minHeight: "100svh" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/97 to-background/90 pointer-events-none" />
        {/* Glow very subtle — single, small */}
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-brand/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24 w-full">
          <div className="grid lg:grid-cols-[1fr_auto] gap-16 xl:gap-28 items-center">

            {/* Left */}
            <div className="max-w-xl animate-fade-up">
              <h1
                className="font-heading font-bold text-foreground mb-7 leading-[1.0]"
                style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)" }}
              >
                Entrena con<br />
                método.<br />
                <span className="text-brand italic">Gana con<br />propósito.</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                La herramienta que entrenadores y jugadores de pádel usan para
                planificar sesiones, organizar ejercicios y seguir su progreso.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 bg-brand text-brand-foreground font-semibold px-7 py-4 rounded-xl hover:bg-brand/90 transition-all text-base shadow-lg shadow-brand/20"
                >
                  Empezar gratis
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 border border-border bg-card/50 text-foreground font-medium px-7 py-4 rounded-xl hover:bg-muted transition-colors text-base"
                >
                  Iniciar sesión
                </Link>
              </div>

              <div className="flex items-center flex-wrap gap-5 text-sm text-muted-foreground">
                {["Gratis para empezar", "Sin tarjeta", "Acceso completo"].map((t) => (
                  <span key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-brand shrink-0" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right */}
            <div className="hidden lg:flex items-center justify-end">
              <div className="relative py-12 pl-8 pr-20">
                <div className="absolute inset-0 bg-brand/7 blur-3xl rounded-full scale-75 pointer-events-none" />
                <MockDashboard />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/40 animate-fade-in stagger-4">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-muted-foreground/30" />
          <span className="text-[10px] uppercase tracking-widest font-semibold">Scroll</span>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="border-y border-border/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border/40">
            {[
              { value: "120+", label: "Ejercicios de pádel" },
              { value: "4", label: "Categorías de entrenamiento" },
              { value: "∞", label: "Sesiones planificadas" },
              { value: "0€", label: "Para empezar" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center text-center py-10 px-4">
                <span className="font-heading text-5xl lg:text-6xl font-bold text-foreground leading-none mb-2">
                  {value}
                </span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <section id="funciones" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="mb-16 reveal-on-scroll">
            <p className="text-xs font-bold uppercase tracking-widest text-brand mb-4">Funciones</p>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Todo lo que necesitas.
            </h2>
          </div>

          <div>
            {(
              [
                {
                  num: "01",
                  title: "Biblioteca de ejercicios",
                  desc: "Más de 120 ejercicios de pádel organizados en un solo lugar. Desde drills de técnica hasta circuitos físicos.",
                  points: [
                    "Técnica, táctica, físico y calentamiento",
                    "Búsqueda por dificultad y duración",
                    "Añade tus propios ejercicios",
                    "Descripción detallada de cada drill",
                  ],
                },
                {
                  num: "02",
                  title: "Planificador de sesiones",
                  desc: "Construye sesiones seleccionando y ordenando ejercicios. Define intensidad, objetivos y duración total calculada automáticamente.",
                  points: [
                    "Selección y ordenación de ejercicios",
                    "Duración total calculada al instante",
                    "Intensidad: baja, media, alta",
                    "Objetivos específicos por sesión",
                  ],
                },
                {
                  num: "03",
                  title: "Calendario y seguimiento",
                  desc: "Visualiza tu planificación mensual. Navega entre semanas, marca sesiones completadas y sigue tu racha.",
                  points: [
                    "Vista mensual y semanal completa",
                    "Sesiones con detalles al instante",
                    "Marcado de sesiones completadas",
                    "Racha semanal y estadísticas",
                  ],
                },
              ] as const
            ).map(({ num, title, desc, points }) => (
              <div
                key={num}
                className="border-t border-border/40 py-12 lg:py-16 grid lg:grid-cols-[80px_1fr_1fr] gap-6 lg:gap-16 items-start reveal-on-scroll group"
              >
                <div className="shrink-0">
                  <span className="font-heading text-5xl lg:text-7xl font-bold text-border group-hover:text-brand/30 transition-colors duration-300 leading-none">
                    {num}
                  </span>
                </div>
                <div>
                  <h3 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    {title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-base max-w-md">{desc}</p>
                </div>
                <ul className="space-y-3 pt-1">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-brand shrink-0 mt-[7px]" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="border-t border-border/40" />
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section id="proceso" className="border-t border-border/40 bg-card/30 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-xl mb-12 reveal-on-scroll">
            <p className="text-xs font-bold uppercase tracking-widest text-brand mb-4">Proceso</p>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Listo en minutos.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border border-border/40 rounded-2xl overflow-hidden reveal-on-scroll">
            {(
              [
                {
                  n: "01",
                  title: "Elige tus ejercicios",
                  desc: "Explora la biblioteca de más de 120 drills y selecciona los que mejor encajen con los objetivos de tu jugador.",
                },
                {
                  n: "02",
                  title: "Construye la sesión",
                  desc: "Ordena los ejercicios, define la duración y la intensidad. La duración total se calcula automáticamente.",
                },
                {
                  n: "03",
                  title: "Planifica la semana",
                  desc: "Asigna sesiones al calendario y sigue el progreso con estadísticas claras y racha semanal.",
                },
              ] as const
            ).map(({ n, title, desc }) => (
              <div
                key={n}
                className="relative p-8 lg:p-10 border-b md:border-b-0 md:border-r border-border/40 last:border-0 bg-background hover:bg-card/60 transition-colors"
              >
                {/* Decorative large number */}
                <span className="font-heading text-8xl font-bold text-brand/8 leading-none select-none absolute top-4 right-6 pointer-events-none">
                  {n}
                </span>
                {/* Small badge number */}
                <div className="size-9 rounded-xl border border-brand/30 bg-brand/10 flex items-center justify-center mb-6">
                  <span className="font-heading text-sm font-bold text-brand">{n}</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground mb-3">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden border-t border-border/40 court-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-background/98 via-background/94 to-background pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[280px] bg-brand/8 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-12 py-28 lg:py-40 text-center reveal-on-scroll">
          <h2
            className="font-heading font-bold tracking-tight text-foreground mb-6 leading-[1.05]"
            style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.5rem)" }}
          >
            Tus mejores sesiones
            <br />
            <span className="text-brand italic">empiezan con un plan.</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-sm mx-auto leading-relaxed">
            Únete a entrenadores y jugadores que entrenan con método.
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center gap-2.5 bg-brand text-brand-foreground font-bold px-9 py-4 rounded-xl hover:bg-brand/90 transition-all shadow-2xl shadow-brand/25 text-base"
          >
            Crear cuenta gratuita
            <ArrowRight className="size-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="text-xs text-muted-foreground mt-5">Sin tarjeta · Cancela cuando quieras</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-md bg-brand flex items-center justify-center">
              <Zap className="size-3.5 text-brand-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-bold text-sm">
              ten<span className="text-brand">planner</span>
            </span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#funciones" className="hover:text-foreground transition-colors">Funciones</a>
            <a href="#proceso" className="hover:text-foreground transition-colors">Cómo funciona</a>
            <Link href="/login" className="hover:text-foreground transition-colors">Iniciar sesión</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Registrarse</Link>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TenPlanner · Hecho para la pista.
          </p>
        </div>
      </footer>
    </div>
  );
}
