"use client";

import {
  Activity,
  ClipboardCheck,
  Crosshair,
  Gauge,
  ListChecks,
  Repeat2,
  Route,
  TimerReset,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const premiumEase = [0.16, 1, 0.3, 1] as [number, number, number, number];

interface MethodStep {
  number: string;
  title: string;
  signal: string;
  copy: string;
  icon: LucideIcon;
  className: string;
}

const methodSteps: MethodStep[] = [
  {
    number: "01",
    title: "Foco",
    signal: "1 conducta",
    copy: "Definir qué cambio se debe ver en pista: decisión, golpe, rol o fase del punto.",
    icon: Crosshair,
    className: "text-brand bg-brand/10 border-brand/25",
  },
  {
    number: "02",
    title: "Tarea",
    signal: "contexto real",
    copy: "Convertir el objetivo en ejercicios con zona, restricción, pareja y criterio de éxito.",
    icon: Route,
    className: "text-chart-3 bg-chart-3/10 border-chart-3/25",
  },
  {
    number: "03",
    title: "Carga",
    signal: "min x RPE",
    copy: "Ajustar volumen, intensidad y densidad para que la sesión tenga progresión y recuperación.",
    icon: Gauge,
    className: "text-chart-2 bg-chart-2/12 border-chart-2/30",
  },
  {
    number: "04",
    title: "Lectura",
    signal: "siguiente bloque",
    copy: "Cerrar con evidencia: qué se sostuvo, qué falló y qué objetivo nace para la semana.",
    icon: Repeat2,
    className: "text-chart-5 bg-chart-5/10 border-chart-5/25",
  },
];

const sessionBlocks = [
  {
    label: "Activación",
    minutes: "10'",
    load: "RPE 3-4",
    focus: "movilidad, pies, tacto",
    width: "16%",
  },
  {
    label: "Técnica",
    minutes: "20'",
    load: "RPE 5",
    focus: "repetición con criterio",
    width: "28%",
  },
  {
    label: "Decisión",
    minutes: "25'",
    load: "RPE 6-7",
    focus: "restricción táctica",
    width: "34%",
  },
  {
    label: "Competición",
    minutes: "20'",
    load: "RPE 7-8",
    focus: "punto condicionado",
    width: "22%",
  },
];

const checkpoints = [
  "Objetivo observable antes de elegir ejercicios",
  "Bloques por fase del punto, no por lista de golpes",
  "Carga prevista y carga real registradas después",
  "Feedback que alimenta la siguiente sesión",
];

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
      transition={{ duration: 0.75, delay, ease: premiumEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function MethodStepRow({ step, index }: { step: MethodStep; index: number }) {
  const Icon = step.icon;

  return (
    <motion.li
      initial={{ opacity: 0, x: -18 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: 0.62,
        delay: 0.08 + index * 0.06,
        ease: premiumEase,
      }}
      className="grid gap-4 border-t border-border/80 py-5 sm:grid-cols-[7.5rem_1fr]"
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-md border",
            step.className
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="font-mono text-sm text-muted-foreground">
          {step.number}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-[0.75fr_1.25fr] sm:items-start">
        <div>
          <h3 className="font-heading text-2xl font-semibold leading-tight">
            {step.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-brand">{step.signal}</p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{step.copy}</p>
      </div>
    </motion.li>
  );
}

function SessionLoad() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand">Sesión modelo</p>
          <h3 className="mt-2 font-heading text-3xl font-semibold leading-none">
            75 min
          </h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md border border-brand/20 bg-brand/10 px-3 py-2 text-sm font-semibold text-brand">
          <TimerReset className="size-4" aria-hidden />
          450 UA
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {sessionBlocks.map((block, index) => (
          <div key={block.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-foreground">{block.label}</span>
              <span className="font-mono text-muted-foreground">
                {block.minutes} · {block.load}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-sm bg-muted">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.7,
                  delay: 0.16 + index * 0.08,
                  ease: premiumEase,
                }}
                style={{ width: block.width, transformOrigin: "left" }}
                className="h-full rounded-sm bg-brand"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{block.focus}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CourtNotebook() {
  return (
    <div className="court-plate relative min-h-[390px] overflow-hidden rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="absolute inset-0 court-grid opacity-30" aria-hidden />
      <div
        className="absolute inset-x-5 top-1/2 h-px bg-foreground/15"
        aria-hidden
      />
      <div
        className="absolute left-1/2 top-5 h-[calc(100%-2.5rem)] w-px bg-brand/35"
        aria-hidden
      />

      <div className="relative flex h-full min-h-[350px] flex-col justify-between">
        <div className="max-w-[18rem]">
          <p className="text-sm font-semibold text-brand">Objetivo semanal</p>
          <h3 className="mt-2 font-heading text-3xl font-semibold leading-tight">
            Recuperar red desde defensa sin regalar la pared.
          </h3>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.2, ease: premiumEase }}
          className="absolute inset-8 hidden md:block"
          aria-hidden
        >
          <svg className="h-full w-full" viewBox="0 0 460 260" fill="none">
            <motion.path
              d="M72 198 C146 126 196 210 252 136 S354 54 400 92"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.2, ease: premiumEase }}
              className="text-brand"
            />
          </svg>
        </motion.div>

        <div className="relative grid gap-3 sm:grid-cols-2">
          {[
            ["Regla", "globo profundo antes de subir"],
            ["Medida", "3 recuperaciones limpias por serie"],
            ["Riesgo", "fatiga de piernas en cierre"],
            ["Ajuste", "bajar densidad si RPE supera 7"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="border-l-2 border-brand/40 bg-background/70 py-2 pl-3 backdrop-blur-sm"
            >
              <p className="text-xs font-semibold text-brand">{label}</p>
              <p className="mt-1 text-sm leading-5 text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MethodSection() {
  return (
    <section
      id="metodo"
      aria-labelledby="method-title"
      className="relative overflow-hidden bg-background px-4 py-20 text-foreground sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-border" aria-hidden />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <Reveal className="lg:sticky lg:top-24">
            <p className="text-sm font-semibold uppercase text-brand">
              Método TenPlanner
            </p>
            <h2
              id="method-title"
              className="mt-5 max-w-2xl font-heading text-4xl font-semibold leading-[1.02] sm:text-5xl lg:text-6xl"
            >
              De objetivo a carga, sin perder el punto.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground">
              Una sesión no empieza en la biblioteca de ejercicios. Empieza en
              una conducta observable, se convierte en tarea específica y se
              ajusta con la carga que el grupo puede asumir hoy.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Plan", "microciclo"],
                ["Pista", "tarea real"],
                ["Carga", "RPE + minutos"],
              ].map(([label, value]) => (
                <div key={label} className="border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground">
                    {label}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{value}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <div className="space-y-5">
            <Reveal delay={0.08}>
              <div className="ledger-surface rounded-lg border border-border p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-brand">
                      Sistema de sesión
                    </p>
                    <h3 className="mt-2 font-heading text-3xl font-semibold">
                      Cuatro decisiones antes de pisar pista
                    </h3>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                    <ListChecks className="size-4 text-brand" aria-hidden />
                    objetivo, tarea, carga, lectura
                  </span>
                </div>

                <ol>
                  {methodSteps.map((step, index) => (
                    <MethodStepRow
                      key={step.number}
                      step={step}
                      index={index}
                    />
                  ))}
                </ol>
              </div>
            </Reveal>

            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <Reveal delay={0.14}>
                <CourtNotebook />
              </Reveal>

              <Reveal delay={0.2} className="space-y-5">
                <SessionLoad />

                <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-md border border-brand/20 bg-brand/10 text-brand">
                      <ClipboardCheck className="size-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Criterios que evitan improvisar
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Lo que se revisa antes de guardar la sesión.
                      </p>
                    </div>
                  </div>

                  <ul className="mt-5 space-y-3">
                    {checkpoints.map((checkpoint, index) => (
                      <motion.li
                        key={checkpoint}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.48,
                          delay: 0.12 + index * 0.05,
                          ease: premiumEase,
                        }}
                        className="flex gap-3 text-sm leading-6 text-muted-foreground"
                      >
                        <Activity
                          className="mt-1 size-4 shrink-0 text-brand"
                          aria-hidden
                        />
                        <span>{checkpoint}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
