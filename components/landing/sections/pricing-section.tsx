"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ClipboardList,
  LifeBuoy,
  ShieldCheck,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const premiumEase = [0.16, 1, 0.3, 1] as [number, number, number, number];

type Plan = {
  name: string;
  audience: string;
  priceLabel: string;
  priceNote: string;
  description: string;
  icon: LucideIcon;
  cta: string;
  href: string;
  featured?: boolean;
  highlights: string[];
  bestFor: string;
};

const plans: Plan[] = [
  {
    name: "Acceso anticipado",
    audience: "Coach independiente",
    priceLabel: "Primera cohorte",
    priceNote: "Entrada por registro, sin tarifa pública todavía.",
    description:
      "Para entrenadores que quieren ordenar sesiones, alumnos y biblioteca sin montar un sistema propio.",
    icon: ClipboardList,
    cta: "Crear cuenta",
    href: "/register",
    highlights: [
      "Planificación de sesiones por objetivo",
      "Biblioteca propia y bloques reutilizables",
      "Alumnos, grupos y seguimiento básico",
      "Flujo guiado para preparar cada sesion",
    ],
    bestFor: "Validar el método con tu propia agenda antes de crecer.",
  },
  {
    name: "Equipo técnico",
    audience: "Academias en crecimiento",
    priceLabel: "Equipo privado",
    priceNote: "Dimensionamos plazas, técnicos y operativa contigo.",
    description:
      "Para escuelas que necesitan una forma común de planificar, repartir trabajo y mantener criterio entre entrenadores.",
    icon: UsersRound,
    cta: "Solicitar acceso",
    href: "mailto:hola@tenplanner.app?subject=Acceso%20equipo%20TenPlanner",
    featured: true,
    highlights: [
      "Biblioteca compartida por metodología",
      "Coordinación de grupos, pistas y entrenadores",
      "Visibilidad de carga, asistencia y progreso",
      "Acompañamiento para fijar el flujo semanal",
    ],
    bestFor: "Unificar criterio sin convertir la semana en reuniones.",
  },
  {
    name: "Implantación",
    audience: "Clubes y operaciones multi-equipo",
    priceLabel: "Despliegue guiado",
    priceNote: "Propuesta cerrada tras revisar volumen y migración.",
    description:
      "Para academias que ya tienen volumen, datos históricos o varios responsables y quieren aterrizar TenPlanner con control.",
    icon: Building2,
    cta: "Solicitar diagnóstico",
    href: "mailto:hola@tenplanner.app?subject=Implantacion%20TenPlanner",
    highlights: [
      "Mapa de roles, grupos y permisos",
      "Migración guiada desde hojas o herramientas actuales",
      "Sesiones de arranque con responsables técnicos",
      "Soporte prioritario durante el despliegue",
    ],
    bestFor: "Cambiar la operativa sin parar la escuela.",
  },
];

const trustItems = [
  {
    icon: BadgeCheck,
    title: "Condiciones claras",
    text: "La tarifa pública se comunicará cuando el modelo esté cerrado.",
  },
  {
    icon: ShieldCheck,
    title: "Datos bajo control",
    text: "Pensado para trabajar con alumnos, grupos y notas con criterio profesional.",
  },
  {
    icon: LifeBuoy,
    title: "Aterrizaje acompañado",
    text: "El acceso de equipo incluye una conversación para encajar el flujo real.",
  },
];

const comparison = [
  ["Entrada", "Registro", "Solicitud", "Diagnóstico"],
  ["Escala", "1 entrenador", "Varios técnicos", "Club o multi-sede"],
  ["Decisión", "Probar método", "Unificar equipo", "Migrar operativa"],
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
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
      transition={{
        duration: reducedMotion ? 0 : 0.72,
        delay: reducedMotion ? 0 : delay,
        ease: premiumEase,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function PricingCta({
  href,
  children,
  featured = false,
}: {
  href: string;
  children: ReactNode;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/30",
        featured
          ? "bg-brand text-brand-foreground shadow-[0_12px_30px_color-mix(in_oklab,var(--brand)_22%,transparent)] hover:bg-brand/90"
          : "border border-border bg-background text-foreground hover:border-brand/45 hover:bg-brand/5"
      )}
    >
      {children}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const Icon = plan.icon;

  return (
    <Reveal delay={0.08 * index} className="h-full">
      <article
        className={cn(
          "relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-[var(--radius-xl)] border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_42px_rgba(15,23,42,0.06)]",
          plan.featured
            ? "border-brand/45 ring-1 ring-brand/20"
            : "border-border"
        )}
      >
        <div
          aria-hidden
          className={cn(
            "absolute inset-x-0 top-0 h-1",
            plan.featured ? "bg-brand" : "bg-border"
          )}
        />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {plan.audience}
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              {plan.name}
            </h3>
          </div>
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-[var(--radius-lg)] border",
              plan.featured
                ? "border-brand/25 bg-brand text-brand-foreground"
                : "border-border bg-muted text-brand"
            )}
          >
            <Icon className="size-5" />
          </span>
        </div>

        {plan.featured ? (
          <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-[var(--radius-md)] bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
            <Sparkles className="size-3.5" />
            Ruta recomendada para academias
          </span>
        ) : (
          <div className="mt-5 h-7" />
        )}

        <div className="mt-5 border-y border-border py-5">
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {plan.priceLabel}
          </p>
          <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">
            {plan.priceNote}
          </p>
        </div>

        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          {plan.description}
        </p>

        <ul className="mt-6 space-y-3">
          {plan.highlights.map((highlight) => (
            <li
              key={highlight}
              className="flex gap-3 text-sm leading-5 text-foreground"
            >
              <Check className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-[var(--radius-lg)] bg-muted/70 p-3 text-sm leading-5 text-muted-foreground">
          {plan.bestFor}
        </div>

        <div className="mt-auto pt-6">
          <PricingCta href={plan.href} featured={plan.featured}>
            {plan.cta}
          </PricingCta>
        </div>
      </article>
    </Reveal>
  );
}

export function PricingSection() {
  return (
    <section
      id="planes"
      className="relative isolate overflow-hidden bg-background px-4 py-20 text-foreground sm:px-6 lg:px-8 lg:py-28"
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-border" />

      <div className="relative mx-auto max-w-7xl">
        <Reveal className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            Planes
          </p>
          <h2 className="mt-4 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Elige la ruta de TenPlanner según como trabaja tu equipo.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            En acceso anticipado no publicamos precios cerrados. Separamos las
            opciones por complejidad real: entrenador, academia o implantación
            con acompañamiento.
          </p>
        </Reveal>

        <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <PlanCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>

        <Reveal delay={0.12}>
          <div className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-border bg-card">
            <div className="grid border-b border-border bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:grid-cols-4">
              <span>Comparativa</span>
              <span className="hidden sm:block">Acceso anticipado</span>
              <span className="hidden sm:block">Equipo técnico</span>
              <span className="hidden sm:block">Implantación</span>
            </div>
            {comparison.map(([label, first, second, third]) => (
              <div
                key={label}
                className="grid gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:grid-cols-4 sm:gap-4"
              >
                <p className="text-sm font-semibold text-foreground">{label}</p>
                {[first, second, third].map((value) => (
                  <p
                    key={`${label}-${value}`}
                    className="text-sm text-muted-foreground"
                  >
                    {value}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </Reveal>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {trustItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <Reveal key={item.title} delay={0.08 * index}>
                <div className="h-full rounded-[var(--radius-xl)] border border-border bg-card/80 p-4">
                  <Icon className="size-5 text-brand" />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
