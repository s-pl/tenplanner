"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  MessageSquareText,
  PenLine,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
} from "lucide-react";

const premiumEase = [0.16, 1, 0.3, 1] as [number, number, number, number];

const contextItems: Array<{
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
}> = [
  {
    icon: UsersRound,
    label: "Grupo",
    value: "Adultos avanzado",
    note: "4 alumnos, historial activo",
  },
  {
    icon: CalendarClock,
    label: "Agenda",
    value: "75 min, pista 2",
    note: "martes 19:15",
  },
  {
    icon: ClipboardList,
    label: "Objetivo",
    value: "Salida de pared",
    note: "cerrar en red sin precipitar",
  },
];

const sessionBlocks = [
  {
    time: "12 min",
    title: "Activacion con direccion",
    detail: "pies activos, lectura de bandeja y globo profundo",
    tone: "bg-brand/8",
  },
  {
    time: "18 min",
    title: "Pared + primera decision",
    detail: "dos opciones: jugar cruzado o ganar red con margen",
    tone: "bg-brand/12",
  },
  {
    time: "20 min",
    title: "Cierre en red",
    detail: "voleas de control antes de buscar definicion",
    tone: "bg-brand/16",
  },
  {
    time: "25 min",
    title: "Punto condicionado",
    detail: "solo puntua si la subida llega despues de pared",
    tone: "bg-chart-2/12",
  },
];

const guardrails = [
  "Revisar carga si el grupo llega fatigado.",
  "Ajustar variantes por alumno antes de guardar.",
  "Usar la propuesta como borrador, no como orden automatica.",
];

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-14% 0px -14% 0px" }}
      transition={{ duration: 0.8, delay, ease: premiumEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CourtSketch() {
  return (
    <div className="relative min-h-[160px] overflow-hidden rounded-lg border border-border bg-accent/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]">
      <div aria-hidden className="absolute inset-4 border border-foreground/15" />
      <div aria-hidden className="absolute left-1/2 top-4 bottom-4 w-px bg-foreground/15" />
      <div aria-hidden className="absolute left-4 right-4 top-1/2 h-px bg-foreground/15" />
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, delay: 0.28, ease: premiumEase }}
        className="absolute inset-0"
      >
        <svg viewBox="0 0 420 180" className="h-full w-full" fill="none" preserveAspectRatio="none">
          <motion.path
            d="M82 128 C138 82, 177 70, 220 94 S300 135, 344 60"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="8 11"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.34, ease: premiumEase }}
            className="text-brand"
          />
        </svg>
      </motion.div>
      {[
        ["left-[18%] top-[66%]", "A"],
        ["left-[36%] top-[38%]", "B"],
        ["right-[22%] top-[62%]", "C"],
        ["right-[15%] top-[24%]", "D"],
      ].map(([position, label]) => (
        <span
          key={label}
          className={`${position} absolute grid size-7 place-items-center rounded-full border border-border bg-card text-[11px] font-semibold text-foreground shadow-sm`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function SessionProposalVisual() {
  const reducedMotion = useReducedMotion();

  return (
    <Reveal delay={0.1} className="relative">
      <div
        aria-hidden
        className="absolute -left-5 top-10 h-[calc(100%-2.5rem)] w-full rotate-[-1.5deg] rounded-xl border border-border bg-muted/50"
      />
      <motion.div
        initial={{ rotate: 1.4, y: 18 }}
        whileInView={{ rotate: 0, y: 0 }}
        viewport={{ once: true, margin: "-12% 0px" }}
        transition={{ duration: 0.9, ease: premiumEase }}
        className="relative overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-[0_28px_90px_color-mix(in_oklab,var(--foreground)_12%,transparent)]"
      >
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0,transparent_31px,color-mix(in_oklab,var(--foreground)_5%,transparent)_32px),linear-gradient(90deg,color-mix(in_oklab,var(--brand)_6%,transparent)_0_1px,transparent_1px)] [background-size:100%_32px,42px_100%]" />
        <div className="relative border-b border-border bg-card/62 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-foreground text-background">
                <Bot className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Dr. Planner</p>
                <p className="text-xs text-muted-foreground">borrador con contexto de TenPlanner</p>
              </div>
            </div>
            <motion.span
              animate={reducedMotion ? { opacity: 1 } : { opacity: [0.55, 1, 0.55] }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
              }
              className="inline-flex items-center gap-2 rounded-lg border border-brand/18 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand"
            >
              <Sparkles className="size-3.5" />
              propuesta editable
            </motion.span>
          </div>
        </div>

        <div className="relative grid gap-0 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="border-b border-border p-4 sm:p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-card/72 p-4 shadow-sm">
              <MessageSquareText className="mt-0.5 size-5 shrink-0 text-brand" />
              <p className="text-sm leading-6 text-foreground">
                Prepara una sesion de 75 minutos para salida de pared. Quiero
                trabajo tactico, carga controlada y cierre competitivo.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {contextItems.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.18 + index * 0.08, ease: premiumEase }}
                    className="grid grid-cols-[2.25rem_1fr] gap-3 border-t border-border pt-3"
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-brand/10 text-brand">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-foreground">{item.value}</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.note}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-5">
              <CourtSketch />
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Propuesta de sesion
                </p>
                <h3 className="mt-2 text-2xl font-semibold leading-tight text-foreground">
                  Pared, decision y subida con margen
                </h3>
              </div>
              <span className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background">
                <CheckCircle2 className="size-4" />
                75 min
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {sessionBlocks.map((block, index) => (
                <motion.div
                  key={block.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.62, delay: 0.26 + index * 0.07, ease: premiumEase }}
                  className={`${block.tone} grid grid-cols-[4.2rem_1fr] gap-3 rounded-lg border border-border p-3 shadow-sm`}
                >
                  <span className="text-sm font-semibold text-brand">{block.time}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{block.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{block.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="size-4 text-brand" />
                Antes de llevarlo a pista
              </p>
              <ul className="mt-3 space-y-2">
                {guardrails.map((item) => (
                  <li key={item} className="flex gap-2 text-xs leading-5 text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-chart-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </Reveal>
  );
}

export function DrPlannerSection() {
  return (
    <section
      id="dr-planner"
      className="relative isolate overflow-hidden bg-background px-4 py-24 text-foreground sm:px-6 lg:px-8 lg:py-32"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,color-mix(in_oklab,var(--brand)_5%,transparent)_1px,transparent_1px),linear-gradient(0deg,color-mix(in_oklab,var(--foreground)_3%,transparent)_1px,transparent_1px)] [background-size:56px_56px]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
      />
      <div
        aria-hidden
        className="absolute -right-24 top-16 h-[440px] w-[620px] rotate-[-8deg] border-y border-brand/10 bg-[linear-gradient(90deg,transparent_49.6%,color-mix(in_oklab,var(--brand)_18%,transparent)_49.8%,color-mix(in_oklab,var(--brand)_18%,transparent)_50.2%,transparent_50.4%),linear-gradient(0deg,transparent_49.6%,color-mix(in_oklab,var(--foreground)_10%,transparent)_49.8%,color-mix(in_oklab,var(--foreground)_10%,transparent)_50.2%,transparent_50.4%)] opacity-60"
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-lg border border-brand/18 bg-card/62 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand shadow-sm">
            <Sparkles className="size-3.5" />
            Dr. Planner
          </p>
          <h2 className="landing-display mt-6 max-w-3xl text-balance text-[clamp(2.8rem,6.4vw,6.4rem)] font-semibold leading-[0.92] tracking-normal text-foreground">
            La IA prepara el borrador. El criterio sigue siendo tuyo.
          </h2>
          <p className="mt-7 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
            Dr. Planner lee objetivo, nivel, notas recientes y biblioteca antes
            de proponer una sesion. Te devuelve fases, carga y razones para que
            revises, ajustes o descartes antes de llevarla a pista.
          </p>

          <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
            {[
              {
                icon: ClipboardList,
                title: "Contexto primero",
                text: "Usa historial y objetivos, no una plantilla generica.",
              },
              {
                icon: SlidersHorizontal,
                title: "Editable por defecto",
                text: "Cada bloque se puede acortar, cambiar o reemplazar.",
              },
              {
                icon: ShieldCheck,
                title: "Promesa responsable",
                text: "La IA asiste. La decision final es del entrenador.",
              },
              {
                icon: PenLine,
                title: "Metodo visible",
                text: "Explica el por que de la carga y del orden de trabajo.",
              },
            ].map((item, index) => {
              const Icon = item.icon;

              return (
                <Reveal key={item.title} delay={0.08 + index * 0.04}>
                  <div className="border-t border-border pt-4">
                    <Icon className="size-5 text-brand" />
                    <h3 className="mt-3 text-base font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Reveal>

        <SessionProposalVisual />
      </div>
    </section>
  );
}
