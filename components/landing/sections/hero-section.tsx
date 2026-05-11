"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock3,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

const premiumEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

const revealContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const revealItem = {
  hidden: { opacity: 0, y: 24, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.72, ease: premiumEase },
  },
};

const proofPoints = [
  { value: "137+", label: "Ejercicios", detail: "listos para adaptar por nivel" },
  { value: "75 min", label: "Sesión", detail: "estructurada en bloques y fases" },
  { value: "3 bloques", label: "Metodo", detail: "inicio, principal y cierre" },
];

const sessionBlocks = [
  { time: "18:00", title: "Activación", detail: "patrones de pies", minutes: 8 },
  { time: "18:10", title: "Técnica", detail: "salida de pared", minutes: 22 },
  { time: "18:35", title: "Decisión", detail: "subida o globo", minutes: 25 },
  { time: "19:00", title: "Cierre", detail: "punto condicionado", minutes: 15 },
];

const fieldChecks = ["Grupo confirmado", "Variantes por nivel", "Asistencia preparada"];

function HeroCta({
  children,
  href,
  variant = "primary",
}: {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.985 }}>
      <Link
        href={href}
        className={cn(
          "group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          variant === "primary"
            ? "bg-brand text-brand-foreground shadow-[0_16px_36px_color-mix(in_oklab,var(--brand)_22%,transparent)] hover:bg-foreground hover:text-background"
            : "border border-border bg-background/80 text-foreground backdrop-blur hover:border-brand/50 hover:text-brand"
        )}
      >
        {children}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}

function CourtMarker({
  className,
  label,
  delay,
  reducedMotion,
}: {
  className: string;
  label: string;
  delay: number;
  reducedMotion: boolean | null;
}) {
  return (
    <motion.span
      aria-label={label}
      animate={reducedMotion ? { y: 0 } : { y: [0, -5, 0] }}
      transition={{ duration: 3.8, delay, repeat: Infinity, ease: "easeInOut" }}
      className={cn(
        "absolute grid size-7 place-items-center rounded-md border border-background bg-brand text-[11px] font-bold text-brand-foreground shadow-[0_10px_22px_color-mix(in_oklab,var(--brand)_18%,transparent)]",
        className
      )}
    >
      {label}
    </motion.span>
  );
}

function SessionRow({
  time,
  title,
  detail,
  minutes,
}: {
  time: string;
  title: string;
  detail: string;
  minutes: number;
}) {
  return (
    <motion.li
      whileHover={{ x: 4 }}
      className="grid grid-cols-[48px_1fr_42px] items-center gap-3 border-b border-border py-3 last:border-b-0"
    >
      <span className="text-xs font-semibold text-brand">{time}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      <span className="justify-self-end text-xs tabular-nums text-foreground/55">{minutes}m</span>
    </motion.li>
  );
}

function HeroWorkbench() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={revealItem}
      className="relative mt-10 lg:mt-0"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: premiumEase }}
    >
      <motion.div
        animate={reducedMotion ? { y: 0 } : { y: [0, -7, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-xl border border-border bg-card shadow-[0_28px_90px_color-mix(in_oklab,var(--foreground)_8%,transparent),0_1px_2px_color-mix(in_oklab,var(--foreground)_4%,transparent)]"
      >
        <div className="grid min-h-[560px] lg:grid-cols-[minmax(0,1.08fr)_minmax(240px,0.92fr)]">
          <div className="relative border-b border-border lg:border-b-0 lg:border-r">
            <div className="relative h-40 overflow-hidden border-b border-border bg-muted sm:h-48">
              <Image
                src="/landing/racket-player.jpg"
                alt="Entrenador preparando una sesion en pista o cancha"
                fill
                priority
                sizes="(min-width: 1024px) 38vw, 92vw"
                className="object-cover object-[54%_38%] saturate-[0.9]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--card)_0%,rgba(255,255,255,0.24)_42%,transparent_100%)]" />
              <div className="absolute left-4 top-4 max-w-[240px] border-l-2 border-brand bg-card/86 px-3 py-2 backdrop-blur">
                <p className="text-xs font-semibold uppercase text-brand">Jueves · pista 2</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-foreground">
                  Sub-16 competición · salida de pared
                </p>
              </div>
            </div>

            <div className="ledger-surface p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-brand">Pizarra viva</p>
                  <h2 className="mt-1 font-heading text-xl text-foreground">Objetivo y ocupación</h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-brand/25 bg-brand/8 px-2.5 py-1 text-xs font-semibold text-brand">
                  <Clock3 className="size-3.5" />
                  75 min
                </span>
              </div>

              <div className="court-plate relative h-[238px] overflow-hidden rounded-md border border-border">
                <div className="absolute inset-4 border border-foreground/18" />
                <div className="absolute inset-x-4 top-1/2 h-px bg-foreground/20" />
                <div className="absolute inset-y-4 left-1/2 w-px bg-brand/55" />
                <div className="absolute left-[18%] top-4 bottom-4 w-px bg-foreground/14" />
                <div className="absolute right-[18%] top-4 bottom-4 w-px bg-foreground/14" />
                <CourtMarker className="left-[20%] top-[18%]" label="L" delay={0} reducedMotion={reducedMotion} />
                <CourtMarker
                  className="right-[23%] top-[30%] bg-chart-2 text-foreground"
                  label="N"
                  delay={0.35}
                  reducedMotion={reducedMotion}
                />
                <CourtMarker
                  className="bottom-[22%] left-[38%] bg-foreground text-background"
                  label="A"
                  delay={0.7}
                  reducedMotion={reducedMotion}
                />
                <motion.span
                  aria-hidden
                  animate={reducedMotion ? { x: 0, y: 0 } : { x: [0, 70, 22, 112], y: [0, 30, 92, 120] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-[28%] top-[24%] size-2 rounded-sm bg-chart-5"
                />
              </div>
            </div>
          </div>

          <aside className="flex flex-col bg-background/76">
            <div className="border-b border-border px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-brand">Plan de sesión</p>
                  <h3 className="mt-1 font-heading text-2xl leading-none text-foreground">Método en pista</h3>
                </div>
                <Brain className="size-5 text-brand" strokeWidth={1.7} />
              </div>
            </div>

            <ol className="px-4 sm:px-5">
              {sessionBlocks.map((block) => (
                <SessionRow key={`${block.time}-${block.title}`} {...block} />
              ))}
            </ol>

            <div className="mt-auto border-t border-border p-4 sm:p-5">
              <div className="border-l-2 border-brand bg-brand/8 px-3 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck className="size-4 text-brand" />
                  TenPlanner avisa
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Baja la carga fisica: el grupo viene de dos sesiones intensas.
                  Cierra con punto condicionado y feedback individual.
                </p>
              </div>

              <ul className="mt-4 grid gap-2">
                {fieldChecks.map((check) => (
                  <li key={check} className="flex items-center gap-2 text-xs font-medium text-foreground/75">
                    <CheckCircle2 className="size-3.5 text-brand" strokeWidth={2} />
                    {check}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section id="hero" className="relative isolate overflow-hidden bg-background text-foreground">
      {/* Subtle radial gradient replaces the noisy court-grid + polygon */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_65%_-10%,color-mix(in_oklab,var(--brand)_9%,transparent),transparent)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,var(--background))]"
      />

      <motion.div
        variants={revealContainer}
        initial="hidden"
        animate="visible"
        className="relative mx-auto grid min-h-[88svh] max-w-7xl items-center gap-10 px-4 pb-14 pt-24 sm:px-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(460px,1.14fr)] lg:gap-12 lg:px-8 lg:pb-16 lg:pt-28"
      >
        <div className="max-w-3xl">
          <motion.p
            variants={revealItem}
            className="text-sm font-semibold uppercase tracking-[0.2em] text-brand"
          >
            Para deportes de raqueta
          </motion.p>

          <motion.h1
            variants={revealItem}
            className="mt-5 font-heading text-[clamp(3.2rem,7.5vw,6.8rem)] font-semibold leading-[0.88] tracking-tight text-foreground"
          >
            Tu proxima sesion, lista antes de pisar pista o cancha.
          </motion.h1>

          <motion.p
            variants={revealItem}
            className="mt-7 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg"
          >
            TenPlanner convierte alumnos, objetivos, ejercicios y carga semanal
            en un sistema de trabajo para entrenadores de deportes de raqueta,
            sin depender de chats, hojas y notas sueltas.
          </motion.p>

          <motion.div
            variants={revealItem}
            className="mt-8 flex flex-col gap-3 min-[430px]:flex-row"
          >
            <HeroCta href="/register">Crear cuenta</HeroCta>
            <HeroCta href="#sistema" variant="secondary">
              Ver el sistema
            </HeroCta>
          </motion.div>

          <motion.dl
            variants={revealContainer}
            className="mt-12 grid border-t border-border pt-8 sm:grid-cols-3"
          >
            {proofPoints.map((point, index) => (
              <motion.div
                key={point.label}
                variants={revealItem}
                className={cn(
                  "py-5 sm:py-0 sm:pr-6",
                  index < proofPoints.length - 1 &&
                    "border-b border-border sm:border-b-0 sm:border-r"
                )}
              >
                <dt className="font-heading text-4xl leading-none text-foreground">{point.value}</dt>
                <dd className="mt-2 text-sm font-semibold text-foreground">{point.label}</dd>
                <dd className="mt-1 text-xs leading-5 text-muted-foreground">{point.detail}</dd>
              </motion.div>
            ))}
          </motion.dl>
        </div>

        <HeroWorkbench />
      </motion.div>
    </section>
  );
}
