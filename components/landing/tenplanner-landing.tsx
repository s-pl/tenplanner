import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  Check,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Layers3,
  MessageCircle,
  NotebookPen,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

type LandingExerciseCard = {
  id: string;
  name: string;
  durationMinutes: number;
  nivel: string | null;
  aspectoJuego: string | null;
};

type LandingClassCard = {
  id: string;
  name: string;
  duracionMinutes: number;
  nivel: string | null;
  objetivos: string | null;
  numAlumnos: number | null;
};

type ProgramCard = {
  eyebrow: string;
  title: string;
  text: string;
  duration: string;
  level: string;
  href: string;
  image: string;
  featured?: boolean;
};

const navItems = [
  { label: "Como funciona", href: "#metodo" },
  { label: "Ejercicios", href: "/exercises" },
  { label: "Clases", href: "/classes" },
  { label: "Para entrenadores", href: "#toolkit" },
  { label: "Acceso", href: "#cta" },
];

const heroBenefits = [
  "Biblioteca de ejercicios",
  "Clases reutilizables",
  "Sesiones por objetivo",
  "Alumnos y grupos",
  "Carga semanal clara",
];

const chips = ["Junior", "Adultos", "Iniciacion", "Avanzado", "Clase privada"];

const fallbackPrograms: ProgramCard[] = [
  {
    eyebrow: "45 min",
    title: "Control y direccion",
    text: "Una clase base para mejorar decision, profundidad y ritmo de bola.",
    duration: "45 min",
    level: "Desarrollo",
    href: "/classes",
    image: "/landing/racket-player.jpg",
  },
  {
    eyebrow: "75 min",
    title: "Competicion con objetivo",
    text: "Bloques de activacion, patron principal y cierre con punto condicionado.",
    duration: "75 min",
    level: "Competicion",
    href: "/classes",
    image: "/landing/racket-motion.jpg",
    featured: true,
  },
  {
    eyebrow: "60 min",
    title: "Tecnica para adultos",
    text: "Trabajo progresivo para sostener peloteo, ajustar distancia y cerrar mejor.",
    duration: "60 min",
    level: "Adultos",
    href: "/classes",
    image: "/landing/racket-player.jpg",
  },
  {
    eyebrow: "30 min",
    title: "Sesion privada express",
    text: "Correccion puntual y tareas concretas para la proxima semana.",
    duration: "30 min",
    level: "Individual",
    href: "/classes",
    image: "/landing/racket-motion.jpg",
  },
];

const methodSteps = [
  {
    icon: Target,
    title: "Define el objetivo",
    text: "Empieza cada sesion con una intencion clara, no con una lista improvisada.",
  },
  {
    icon: Layers3,
    title: "Construye por bloques",
    text: "Organiza inicio, parte principal y cierre con ejercicios propios o de biblioteca.",
  },
  {
    icon: UsersRound,
    title: "Asigna alumnos",
    text: "Trabaja con jugadores, grupos y notas de seguimiento desde un mismo flujo.",
  },
  {
    icon: Radar,
    title: "Reutiliza lo que funciona",
    text: "Convierte tus mejores clases en plantillas para repetir metodo sin copiar a mano.",
  },
];

const toolkitCards = [
  {
    icon: BookOpen,
    title: "Biblioteca de ejercicios",
    text: "Encuentra tareas por nivel, golpe, objetivo y duracion.",
  },
  {
    icon: ClipboardList,
    title: "Clases reutilizables",
    text: "Guarda sesiones tipo y conviertelas en agenda real.",
  },
  {
    icon: CalendarCheck,
    title: "Planificacion semanal",
    text: "Visualiza sesiones, carga y proximos entrenamientos.",
  },
  {
    icon: BarChart3,
    title: "Progreso del jugador",
    text: "Centraliza asistencia, notas y evolucion basica.",
  },
  {
    icon: Dumbbell,
    title: "Preparacion de partido",
    text: "Aterriza patrones tacticos y objetivos de competicion.",
  },
  {
    icon: ShieldCheck,
    title: "Trabajo profesional",
    text: "Datos, biblioteca y rutinas bajo control del entrenador.",
  },
];

const blogPosts = [
  {
    category: "Metodo",
    title: "Como preparar una sesion con objetivo claro",
    text: "Un marco simple para que cada bloque tenga sentido en pista o cancha.",
    image: "/landing/racket-player.jpg",
  },
  {
    category: "Biblioteca",
    title: "De ejercicios sueltos a clases reutilizables",
    text: "Ordena tus mejores tareas para repetir criterio sin perder frescura.",
    image: "/landing/racket-motion.jpg",
  },
  {
    category: "Entrenador",
    title: "Como organizar la carga semanal de tus alumnos",
    text: "Menos reuniones, mas claridad y decisiones tecnicas mejor preparadas.",
    image: "/landing/racket-player.jpg",
  },
];

function levelLabel(value: string | null) {
  if (!value) return "Todos los niveles";
  return value.replace(/_/g, " ");
}

function buildProgramCards(classCards: LandingClassCard[]): ProgramCard[] {
  if (classCards.length === 0) return fallbackPrograms;

  const mapped = classCards.slice(0, 4).map((card, index) => ({
    eyebrow: `${card.duracionMinutes} min`,
    title: card.name,
    text:
      card.objetivos?.slice(0, 118) ||
      "Clase lista para adaptar a tu grupo, objetivo y semana de trabajo.",
    duration: `${card.duracionMinutes} min`,
    level: levelLabel(card.nivel),
    href: `/classes/${card.id}`,
    image:
      index % 2 === 0
        ? "/landing/racket-player.jpg"
        : "/landing/racket-motion.jpg",
    featured: index === 1,
  }));

  return [...mapped, ...fallbackPrograms].slice(0, 4);
}

function Pill({
  children,
  variant = "light",
}: {
  children: React.ReactNode;
  variant?: "light" | "dark" | "lime";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]",
        variant === "dark" && "bg-[#050505] text-white",
        variant === "lime" && "bg-[#D6FF38] text-[#050505]",
        variant === "light" && "bg-white/80 text-[#050505]"
      )}
    >
      {children}
    </span>
  );
}

function PrimaryButton({
  href,
  children,
  dark = false,
}: {
  href: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition duration-300",
        dark
          ? "bg-[#050505] text-white hover:bg-white hover:text-[#050505]"
          : "bg-[#D6FF38] text-[#050505] hover:bg-white"
      )}
    >
      {children}
      <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

function TopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-none items-center justify-between rounded-[28px] bg-[#050505] px-3 py-3 text-white shadow-[0_24px_80px_rgba(5,5,5,0.18)] sm:px-4">
        <Link href="/" className="flex items-center gap-2.5 rounded-full pl-1 pr-2">
          <span className="grid size-9 place-items-center rounded-full bg-[#D6FF38] text-[#050505]">
            <NotebookPen className="size-4" />
          </span>
          <span className="text-sm font-black tracking-tight sm:text-base">
            TenPlanner
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-semibold text-white/68 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-bold text-white/72 transition hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="inline-flex min-h-10 items-center rounded-full bg-white px-4 text-sm font-black text-[#050505] transition hover:bg-[#D6FF38]"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="px-3 pb-10 pt-24 sm:px-5 lg:pt-28">
      <div className="mx-auto grid w-full max-w-none gap-3 lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)]">
        <div className="overflow-hidden rounded-[32px] bg-[#D6FF38] p-5 text-[#050505] sm:p-8 lg:min-h-[640px] lg:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <Pill variant="dark">Deportes de raqueta</Pill>
            <Pill>PMV para entrenadores</Pill>
          </div>

          <h1 className="mt-10 max-w-4xl text-[clamp(3.4rem,8vw,7.8rem)] font-black leading-[0.84] tracking-[-0.055em]">
            Planifica mejor. Entrena con metodo.
          </h1>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_300px] lg:items-end">
            <p className="max-w-2xl text-lg font-semibold leading-8 text-[#1b1b1b]/76 sm:text-xl">
              TenPlanner organiza sesiones, alumnos, ejercicios y clases para
              entrenadores de deportes de raqueta.
            </p>

            <div className="rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(5,5,5,0.12)]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6B6B6B]">
                Tu sistema semanal
              </p>
              <div className="mt-4 grid gap-2">
                {heroBenefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2 text-sm font-bold">
                    <span className="grid size-5 place-items-center rounded-full bg-[#D6FF38]">
                      <Check className="size-3" />
                    </span>
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 min-[440px]:flex-row">
            <PrimaryButton href="/register" dark>
              Crear cuenta
            </PrimaryButton>
            <Link
              href="/classes"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#050505]/20 px-5 text-sm font-black text-[#050505] transition hover:border-[#050505] hover:bg-[#050505] hover:text-white"
            >
              Explorar clases
            </Link>
          </div>
        </div>

        <div className="relative min-h-[520px] overflow-hidden rounded-[32px] bg-[#050505] text-white">
          <Image
            src="/landing/racket-motion.jpg"
            alt="Entrenamiento de deportes de raqueta en pista"
            fill
            priority
            sizes="(min-width: 1024px) 48vw, 100vw"
            className="object-cover opacity-78 saturate-110 transition duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.08),rgba(5,5,5,0.72))]" />
          <div className="absolute inset-x-5 bottom-5 rounded-[28px] border border-white/18 bg-[#050505]/76 p-5 backdrop-blur-md sm:inset-x-8 sm:bottom-8 sm:p-6">
            <Pill variant="lime">Train with purpose</Pill>
            <h2 className="mt-4 max-w-xl text-4xl font-black leading-[0.94] tracking-[-0.04em] sm:text-5xl">
              Tu entrenamiento, organizado en un solo lugar.
            </h2>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <PrimaryButton href="#metodo">Ver como funciona</PrimaryButton>
              <span className="text-sm font-semibold text-white/64">
                Sesiones, clases y alumnos conectados.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MethodSection() {
  return (
    <section id="metodo" className="px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto w-full max-w-none">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Pill variant="dark">Flujo de trabajo</Pill>
            <h2 className="mt-5 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.05em] text-[#050505] sm:text-6xl">
              Un metodo pensado para entrenadores.
            </h2>
          </div>
          <p className="max-w-md text-base font-medium leading-7 text-[#6B6B6B]">
            Deja de reconstruir cada sesion desde cero. Prepara, agenda y
            reutiliza con una estructura clara.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {methodSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.title}
                className={cn(
                  "group min-h-[260px] rounded-[30px] p-5 transition duration-300 hover:-translate-y-1",
                  index === 0
                    ? "bg-[#050505] text-white"
                    : "bg-white text-[#050505] shadow-[0_18px_50px_rgba(5,5,5,0.06)]"
                )}
              >
                <div
                  className={cn(
                    "grid size-12 place-items-center rounded-2xl",
                    index === 0 ? "bg-[#D6FF38] text-[#050505]" : "bg-[#F4F4F1]"
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <p className="mt-10 text-xs font-black uppercase tracking-[0.18em] opacity-55">
                  0{index + 1}
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-[-0.03em]">
                  {step.title}
                </h3>
                <p
                  className={cn(
                    "mt-3 text-sm font-medium leading-6",
                    index === 0 ? "text-white/64" : "text-[#6B6B6B]"
                  )}
                >
                  {step.text}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProgramsSection({ classCards }: { classCards: LandingClassCard[] }) {
  const programs = buildProgramCards(classCards);

  return (
    <section id="programas" className="px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto w-full max-w-none">
        <div className="rounded-[36px] bg-white p-4 shadow-[0_24px_80px_rgba(5,5,5,0.06)] sm:p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <Pill variant="lime">Clases</Pill>
              <h2 className="mt-5 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.05em] text-[#050505] sm:text-6xl">
                Programas para todos los niveles.
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {chips.map((chip, index) => (
                <span
                  key={chip}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-black",
                    index === 0
                      ? "border-[#050505] bg-[#050505] text-white"
                      : "border-[#050505]/10 bg-[#F4F4F1] text-[#050505]"
                  )}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {programs.map((program) => (
              <article
                key={program.title}
                className={cn(
                  "group overflow-hidden rounded-[30px] transition duration-300 hover:-translate-y-1",
                  program.featured ? "bg-[#D6FF38] text-[#050505]" : "bg-[#F4F4F1] text-[#050505]"
                )}
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={program.image}
                    alt={program.title}
                    fill
                    sizes="(min-width: 1280px) 24vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <Pill>{program.duration}</Pill>
                    <Pill>{program.level}</Pill>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6B6B6B]">
                    {program.eyebrow}
                  </p>
                  <h3 className="mt-3 text-2xl font-black leading-none tracking-[-0.04em]">
                    {program.title}
                  </h3>
                  <p className="mt-3 min-h-16 text-sm font-medium leading-6 text-[#404040]">
                    {program.text}
                  </p>
                  <Link
                    href={program.href}
                    className="mt-5 inline-flex items-center gap-1 rounded-full bg-[#050505] px-4 py-2 text-sm font-black text-white transition hover:bg-white hover:text-[#050505]"
                  >
                    Ver clase
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolkitSection({
  exerciseCards,
}: {
  exerciseCards: LandingExerciseCard[];
}) {
  return (
    <section id="toolkit" className="px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto grid w-full max-w-none gap-4 lg:grid-cols-4">
        <article className="rounded-[36px] bg-[#D6FF38] p-6 text-[#050505] lg:col-span-2 lg:row-span-2 lg:min-h-[520px] lg:p-8">
          <Pill variant="dark">Toolkit</Pill>
          <h2 className="mt-7 max-w-xl text-5xl font-black leading-[0.9] tracking-[-0.055em] sm:text-7xl">
            Todo lo que necesitas para preparar tu semana.
          </h2>
          <p className="mt-6 max-w-md text-lg font-semibold leading-8 text-[#050505]/70">
            Biblioteca, clases, alumnos y sesiones conectadas en una misma
            herramienta de trabajo.
          </p>
          <div className="mt-10 rounded-[28px] bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6B6B6B]">
              Ejercicios recientes
            </p>
            <div className="mt-4 grid gap-2">
              {(exerciseCards.length ? exerciseCards : []).slice(0, 3).map((exercise) => (
                <Link
                  key={exercise.id}
                  href={`/exercises/${exercise.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-[#F4F4F1] px-3 py-3 text-sm font-black transition hover:bg-[#050505] hover:text-white"
                >
                  <span className="truncate">{exercise.name}</span>
                  <span className="shrink-0 text-xs opacity-60">
                    {exercise.durationMinutes} min
                  </span>
                </Link>
              ))}
              {exerciseCards.length === 0 && (
                <p className="rounded-2xl bg-[#F4F4F1] px-3 py-3 text-sm font-bold text-[#6B6B6B]">
                  Publica ejercicios para mostrarlos aqui.
                </p>
              )}
            </div>
          </div>
        </article>

        {toolkitCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className={cn(
                "group rounded-[30px] p-5 transition duration-300 hover:-translate-y-1",
                index === 1 || index === 4
                  ? "bg-[#050505] text-white"
                  : "bg-white text-[#050505] shadow-[0_18px_50px_rgba(5,5,5,0.06)]"
              )}
            >
              <div
                className={cn(
                  "grid size-12 place-items-center rounded-2xl",
                  index === 1 || index === 4
                    ? "bg-[#D6FF38] text-[#050505]"
                    : "bg-[#F4F4F1]"
                )}
              >
                <Icon className="size-5" />
              </div>
              <h3 className="mt-9 text-2xl font-black leading-none tracking-[-0.04em]">
                {card.title}
              </h3>
              <p
                className={cn(
                  "mt-3 text-sm font-medium leading-6",
                  index === 1 || index === 4 ? "text-white/64" : "text-[#6B6B6B]"
                )}
              >
                {card.text}
              </p>
              <span className="mt-6 inline-flex size-9 items-center justify-center rounded-full bg-[#D6FF38] text-[#050505] transition group-hover:translate-x-1">
                <ArrowUpRight className="size-4" />
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BlogSection() {
  return (
    <section className="bg-[#050505] px-4 py-20 text-white sm:px-6 lg:py-28">
      <div className="mx-auto w-full max-w-none">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Pill variant="lime">Ideas de entrenamiento</Pill>
            <h2 className="mt-5 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.05em] sm:text-7xl">
              Consejos para mejorar tu juego.
            </h2>
          </div>
          <Link
            href="/classes"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/18 px-5 py-3 text-sm font-black text-white transition hover:border-[#D6FF38] hover:text-[#D6FF38]"
          >
            Ver biblioteca
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article
              key={post.title}
              className="group overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] transition duration-300 hover:-translate-y-1 hover:bg-white/[0.07]"
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-[#050505]/38" />
                <div className="absolute left-5 top-5">
                  <Pill variant="lime">{post.category}</Pill>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-3xl font-black leading-[0.95] tracking-[-0.04em]">
                  {post.title}
                </h3>
                <p className="mt-4 text-sm font-medium leading-6 text-white/58">
                  {post.text}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#D6FF38]">
                  Leer articulo
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section id="cta" className="px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto grid w-full max-w-none gap-4 rounded-[40px] bg-[#D6FF38] p-5 text-[#050505] sm:p-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.75fr)] lg:p-10">
        <div className="flex flex-col justify-between">
          <div>
            <Pill variant="dark">Acceso anticipado</Pill>
            <h2 className="mt-7 max-w-4xl text-5xl font-black leading-[0.86] tracking-[-0.055em] sm:text-7xl">
              Listo para entrenar con mas metodo?
            </h2>
            <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-[#050505]/68">
              Crea tu cuenta y convierte sesiones, alumnos, ejercicios y clases
              en un sistema de trabajo claro.
            </p>
          </div>

          <div className="mt-9 flex flex-col gap-3 min-[440px]:flex-row">
            <PrimaryButton href="/register" dark>
              Crear cuenta
            </PrimaryButton>
            <Link
              href="/exercises"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#050505]/20 px-5 text-sm font-black transition hover:border-[#050505] hover:bg-white"
            >
              Ver biblioteca
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] bg-[#050505] p-4 text-white shadow-[0_22px_70px_rgba(5,5,5,0.22)]">
          <div className="rounded-[26px] bg-white p-4 text-[#050505]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6B6B6B]">
                  Proxima sesion
                </p>
                <h3 className="mt-2 text-3xl font-black tracking-[-0.05em]">
                  Control + salida
                </h3>
              </div>
              <span className="rounded-full bg-[#D6FF38] px-3 py-1 text-xs font-black">
                75 min
              </span>
            </div>
            <div className="mt-5 grid gap-2">
              {[
                ["Inicial", "Activacion y pies", "10m"],
                ["Principal", "Direccion y decision", "45m"],
                ["Final", "Punto condicionado", "20m"],
              ].map(([label, title, time]) => (
                <div
                  key={label}
                  className="grid grid-cols-[72px_1fr_42px] items-center gap-3 rounded-2xl bg-[#F4F4F1] px-3 py-3"
                >
                  <span className="text-xs font-black uppercase text-[#6B6B6B]">
                    {label}
                  </span>
                  <span className="text-sm font-black">{title}</span>
                  <span className="text-right text-xs font-black text-[#6B6B6B]">
                    {time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[24px] border border-white/12 p-4">
              <Sparkles className="size-5 text-[#D6FF38]" />
              <p className="mt-5 text-3xl font-black">12</p>
              <p className="text-xs font-bold text-white/55">alumnos activos</p>
            </div>
            <div className="rounded-[24px] border border-white/12 p-4">
              <MessageCircle className="size-5 text-[#D6FF38]" />
              <p className="mt-5 text-3xl font-black">3</p>
              <p className="text-xs font-bold text-white/55">notas clave</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#050505] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto flex w-full max-w-none flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-full bg-[#D6FF38] text-[#050505]">
              <NotebookPen className="size-4" />
            </span>
            <span className="text-lg font-black">TenPlanner</span>
          </div>
          <p className="mt-4 max-w-sm text-sm font-medium leading-6 text-white/52">
            Planificacion profesional para entrenadores de deportes de raqueta.
          </p>
        </div>

        <div className="grid gap-8 text-sm sm:grid-cols-3">
          <div>
            <p className="font-black text-white">Producto</p>
            <div className="mt-3 grid gap-2 text-white/55">
              <Link href="/exercises">Ejercicios</Link>
              <Link href="/classes">Clases</Link>
              <Link href="/register">Crear cuenta</Link>
            </div>
          </div>
          <div>
            <p className="font-black text-white">Cuenta</p>
            <div className="mt-3 grid gap-2 text-white/55">
              <Link href="/login">Entrar</Link>
              <Link href="/forgot-password">Recuperar acceso</Link>
              <Link href="/profile">Perfil</Link>
            </div>
          </div>
          <div>
            <p className="font-black text-white">Soporte</p>
            <div className="mt-3 grid gap-2 text-white/55">
              <Link href="/privacidad">Privacidad</Link>
              <Link href="/terminos">Terminos</Link>
              <Link href="/cookies">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex w-full max-w-none flex-col gap-3 border-t border-white/10 pt-6 text-xs font-bold text-white/38 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} TenPlanner. Todos los derechos reservados.</p>
        <p>Built for players, coaches and clubs.</p>
      </div>
    </footer>
  );
}

export function TenPlannerLanding({
  className,
  exerciseCards,
  classCards,
}: {
  className?: string;
  exerciseCards: LandingExerciseCard[];
  classCards: LandingClassCard[];
}) {
  return (
    <div
      className={cn(
        "min-h-screen w-full overflow-x-clip bg-[#F4F4F1] text-[#050505] selection:bg-[#D6FF38] selection:text-[#050505]",
        className
      )}
    >
      <TopNav />
      <main id="main">
        <HeroSection />
        <MethodSection />
        <ProgramsSection classCards={classCards} />
        <ToolkitSection exerciseCards={exerciseCards} />
        <BlogSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
}
