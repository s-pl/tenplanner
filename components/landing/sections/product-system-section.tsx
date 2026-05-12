"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Goal,
  LibraryBig,
  MessageSquareText,
  NotebookPen,
  TimerReset,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const smoothEase = [0.16, 1, 0.3, 1] as [number, number, number, number];

const systemPillars = [
  {
    icon: CalendarDays,
    label: "Agenda y pistas",
    text: "Horas, grupos y entrenador quedan conectados antes de llegar a club.",
  },
  {
    icon: UserRoundCheck,
    label: "Alumno con memoria",
    text: "Objetivos, asistencia, carga y notas viven en una ficha accionable.",
  },
  {
    icon: LibraryBig,
    label: "Biblioteca viva",
    text: "Cada ejercicio se guarda con nivel, foco, duración y variantes.",
  },
  {
    icon: ClipboardList,
    label: "Sesión cerrada",
    text: "El feedback alimenta la siguiente planificación sin hojas sueltas.",
  },
];

const sessionBlocks = [
  { time: "12'", title: "Activación", detail: "split-step + movilidad" },
  { time: "18'", title: "Pared lateral", detail: "control de profundidad" },
  { time: "20'", title: "Transición", detail: "subida tras globo" },
  { time: "15'", title: "Punto condicionado", detail: "cierre en red" },
];

const schedule = [
  ["17:00", "Sub-14 competición", "Pista 2"],
  ["18:15", "Grupo adultos B", "Pista 4"],
  ["19:30", "Laura + Nico", "Pista 1"],
];

const liveSignals = [
  ["Asistencia", "10/12"],
  ["Carga", "7.1"],
  ["Objetivo", "red"],
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
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
      transition={{ duration: 0.72, delay, ease: smoothEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function MiniToolbar() {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border bg-card/78 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand text-brand-foreground">
          <NotebookPen className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">TenPlanner OS</p>
          <p className="truncate text-xs text-muted-foreground">Semana 18 - Academia Norte</p>
        </div>
      </div>
      <div className="hidden items-center gap-1 md:flex">
        {["Plan", "Pista", "Ficha"].map((item, index) => (
          <span
            key={item}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium",
              index === 1
                ? "bg-brand text-brand-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function CourtDiagram() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-accent/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-muted-foreground">
            Objetivo de pista
          </p>
          <p className="truncate text-sm font-semibold text-foreground">
            Defender pared, ganar red
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-card px-2 py-1 text-xs font-semibold text-brand">
          <TimerReset className="size-3.5" aria-hidden />
          75 min
        </span>
      </div>

      <div className="relative aspect-[1.42] overflow-hidden rounded-md border border-border bg-accent/60">
        <div aria-hidden className="absolute inset-3 rounded-sm border border-background/80" />
        <div
          aria-hidden
          className="absolute left-1/2 top-3 h-[calc(100%-1.5rem)] w-px -translate-x-1/2 bg-background/80"
        />
        <div
          aria-hidden
          className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-foreground/30"
        />
        <div aria-hidden className="absolute bottom-3 left-[25%] top-3 w-px bg-background/70" />
        <div aria-hidden className="absolute bottom-3 right-[25%] top-3 w-px bg-background/70" />
        <motion.span
          aria-hidden
          animate={prefersReducedMotion ? undefined : { x: [0, 18, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[18%] top-[26%] grid size-7 place-items-center rounded-full bg-card text-xs font-bold text-brand shadow-sm ring-2 ring-brand/25"
        >
          L
        </motion.span>
        <motion.span
          aria-hidden
          animate={prefersReducedMotion ? undefined : { x: [0, -16, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className="absolute bottom-[22%] right-[19%] grid size-7 place-items-center rounded-full bg-chart-2 text-xs font-bold text-foreground shadow-sm ring-2 ring-background/65"
        >
          N
        </motion.span>
        <div
          aria-hidden
          className="absolute left-[31%] top-[31%] h-px w-[38%] rotate-[-18deg] bg-chart-2/65"
        />
        <div
          aria-hidden
          className="absolute bottom-[30%] left-[44%] h-px w-[31%] rotate-[21deg] bg-brand/55"
        />
      </div>
    </div>
  );
}

function SchedulePanel() {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Agenda</p>
        <CalendarDays className="size-4 text-brand" aria-hidden />
      </div>
      <div className="space-y-2">
        {schedule.map(([time, group, court]) => (
          <div
            key={`${time}-${group}`}
            className="grid grid-cols-[42px_1fr] gap-2 border-t border-border pt-2 first:border-t-0 first:pt-0"
          >
            <span className="text-xs font-semibold text-brand">{time}</span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">{group}</p>
              <p className="truncate text-xs text-muted-foreground">{court}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionPlanPanel() {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Bloques de sesión</p>
        <Goal className="size-4 text-brand" aria-hidden />
      </div>
      <div className="space-y-2">
        {sessionBlocks.map((block, index) => (
          <motion.div
            key={block.title}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.06, ease: smoothEase }}
            className="grid grid-cols-[38px_1fr] gap-2 rounded-md bg-muted/50 p-2"
          >
            <span className="rounded-md bg-card px-1.5 py-1 text-center text-xs font-bold text-brand shadow-sm">
              {block.time}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">{block.title}</p>
              <p className="truncate text-xs text-muted-foreground">{block.detail}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PlayerPanel() {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Laura M.</p>
          <p className="truncate text-xs text-muted-foreground">Perfil: táctica + pared</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-chart-2 text-xs font-bold text-foreground">
          82
        </span>
      </div>
      <div className="space-y-2">
        {liveSignals.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 border-t border-border pt-2 first:border-t-0 first:pt-0"
          >
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-xs font-semibold text-foreground">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-sm bg-muted">
        <motion.div
          initial={{ width: "28%" }}
          whileInView={{ width: "82%" }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.15, ease: smoothEase }}
          className="h-full bg-brand"
        />
      </div>
    </div>
  );
}

function NotebookPanel() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-[0_18px_50px_color-mix(in_oklab,var(--foreground)_8%,transparent)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Cierre de pista</p>
        <MessageSquareText className="size-4 text-brand" aria-hidden />
      </div>
      <div className="space-y-3 bg-[repeating-linear-gradient(0deg,transparent_0,transparent_27px,color-mix(in_oklab,var(--foreground)_8%,transparent)_28px)] pb-1">
        {[
          "Nico sube tarde tras globo profundo.",
          "Laura gana punto cuando frena antes de pared.",
          "Repetir variante con red más alta el jueves.",
        ].map((note) => (
          <div key={note} className="flex gap-2 text-sm text-foreground/76">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
            <span>{note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductDashboard() {
  return (
    <Reveal delay={0.08} className="relative">
      <div
        aria-hidden
        className="absolute -inset-3 rounded-lg bg-[linear-gradient(135deg,color-mix(in_oklab,var(--brand)_14%,transparent),color-mix(in_oklab,var(--chart-2)_16%,transparent),color-mix(in_oklab,var(--chart-3)_10%,transparent))] blur-2xl"
      />
      <motion.div
        initial={{ rotateX: 5, rotateY: -8, y: 24 }}
        whileInView={{ rotateX: 0, rotateY: 0, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.9, ease: smoothEase }}
        className="relative overflow-hidden rounded-xl border border-border bg-muted/40 shadow-[0_28px_90px_color-mix(in_oklab,var(--foreground)_12%,transparent)]"
      >
        <MiniToolbar />
        <div className="grid gap-3 p-3 lg:grid-cols-[0.78fr_1.22fr_0.82fr]">
          <div className="grid gap-3">
            <SchedulePanel />
            <PlayerPanel />
          </div>
          <div className="grid gap-3">
            <CourtDiagram />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Método", "4 bloques"],
                ["Carga", "media-alta"],
                ["Equipo", "2 coaches"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-border bg-card/82 p-3"
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <SessionPlanPanel />
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.72, delay: 0.24, ease: smoothEase }}
        className="relative mt-3 lg:absolute lg:-bottom-10 lg:left-8 lg:w-[360px]"
      >
        <NotebookPanel />
      </motion.div>
    </Reveal>
  );
}

export function ProductSystemSection({ className }: { className?: string }) {
  return (
    <section
      id="sistema"
      className={cn(
        "relative isolate overflow-hidden bg-muted/20 px-4 py-20 text-foreground sm:px-6 lg:px-8 lg:py-28",
        className
      )}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-border"
      />
      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <Reveal>
          <p className="text-sm font-semibold text-brand">Sistema de producto</p>
          <h2 className="mt-4 max-w-3xl font-heading text-4xl font-semibold leading-[1.02] sm:text-5xl lg:text-6xl">
            Del cuaderno de pista a un sistema operativo para entrenar.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            TenPlanner une lo que una academia suele tener separado: calendario,
            pistas, grupos, biblioteca, historial del alumno y cierre de sesión.
            Cada entrenamiento queda preparado con contexto y vuelve al sistema
            con aprendizaje.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {systemPillars.map((pillar, index) => {
              const Icon = pillar.icon;

              return (
                <motion.div
                  key={pillar.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.58, delay: 0.08 + index * 0.05, ease: smoothEase }}
                  className="rounded-lg border border-border bg-card/72 p-4 backdrop-blur"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand text-brand-foreground">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{pillar.label}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{pillar.text}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-[0_12px_30px_color-mix(in_oklab,var(--brand)_20%,transparent)] transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              Crear cuenta
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card/70 px-3 py-2 text-sm font-medium text-muted-foreground">
              <UsersRound className="size-4 text-brand" aria-hidden />
              Para coaches, academias y clubes
            </div>
          </div>
        </Reveal>

        <ProductDashboard />
      </div>

      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-24 bg-[linear-gradient(180deg,transparent,var(--background)_85%,var(--background))]"
      />
    </section>
  );
}
