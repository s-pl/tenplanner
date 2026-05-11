"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Gauge,
  LibraryBig,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

const premiumEase = [0.16, 1, 0.3, 1] as [number, number, number, number];

const valueCards: Array<{
  icon: LucideIcon;
  label: string;
  title: string;
  text: string;
}> = [
  {
    icon: ClipboardList,
    label: "Plan",
    title: "Sesion cerrada antes de pista",
    text: "Objetivo, bloques, carga y variantes quedan listos en un flujo unico.",
  },
  {
    icon: UsersRound,
    label: "Equipo",
    title: "Metodo compartido",
    text: "Cada coach trabaja con el mismo contexto de alumnos, grupos y biblioteca.",
  },
  {
    icon: Gauge,
    label: "Carga",
    title: "Lectura semanal",
    text: "La intensidad, asistencia y notas vuelven al sistema para ajustar la proxima sesion.",
  },
];

const footerLinks = [
  { href: "#sistema", label: "Sistema" },
  { href: "#biblioteca", label: "Biblioteca" },
  { href: "/exercises", label: "Ejercicios" },
  { href: "/classes", label: "Clases" },
  { href: "#planes", label: "Planes" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/terminos", label: "Terminos" },
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
      initial={
        reducedMotion ? false : { opacity: 0, y: 28, filter: "blur(10px)" }
      }
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-14% 0px -14% 0px" }}
      transition={{
        duration: reducedMotion ? 0 : 0.76,
        delay: reducedMotion ? 0 : delay,
        ease: premiumEase,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function PrimaryCta() {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      className="inline-flex w-full min-[430px]:w-auto"
    >
      <Link
        href="/register"
        className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-[0_18px_42px_color-mix(in_oklab,var(--brand)_20%,transparent)] transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background min-[430px]:w-auto"
      >
        Crear cuenta
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}

function ValueCard({
  item,
  index,
}: {
  item: (typeof valueCards)[number];
  index: number;
}) {
  const Icon = item.icon;

  return (
    <Reveal delay={0.1 + index * 0.06}>
      <motion.article
        whileHover={{ y: -4 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="h-full border border-border bg-card/76 p-4 shadow-[0_18px_50px_color-mix(in_oklab,var(--foreground)_5%,transparent)] backdrop-blur sm:p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-foreground text-background">
            <Icon className="size-4" />
          </span>
          <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {item.label}
          </span>
        </div>
        <h3 className="mt-5 font-heading text-2xl font-semibold leading-tight text-foreground">
          {item.title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {item.text}
        </p>
      </motion.article>
    </Reveal>
  );
}

export function FinalCtaSection() {
  return (
    <section
      id="crear-cuenta"
      aria-labelledby="final-cta-title"
      className="relative isolate overflow-hidden bg-background px-4 py-20 text-foreground sm:px-6 lg:px-8 lg:py-28"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,color-mix(in_oklab,var(--brand)_7%,transparent),transparent)]"
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-border" />
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-32 bg-[linear-gradient(180deg,transparent,var(--foreground))]"
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-5xl text-center">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-lg border border-brand/20 bg-card/72 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand shadow-sm backdrop-blur">
              <CheckCircle2 className="size-3.5" />
              Cierre de pista
            </p>
            <h2
              id="final-cta-title"
              className="mx-auto mt-6 max-w-4xl text-balance font-heading text-[clamp(3rem,7vw,6.5rem)] font-semibold leading-[0.92] text-foreground"
            >
              Que la proxima sesion empiece con metodo, no con improvisacion.
            </h2>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              Crea tu cuenta y convierte agenda, alumnos, ejercicios y carga
              semanal en un sistema de trabajo para entrenar con continuidad.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-8 flex justify-center">
              <PrimaryCta />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-brand" />
                Acceso anticipado
              </span>
              <span className="inline-flex items-center gap-2">
                <LibraryBig className="size-4 text-brand" />
                Biblioteca y sesiones desde el primer dia
              </span>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
            {valueCards.map((item, index) => (
              <ValueCard key={item.title} item={item} index={index} />
            ))}
          </div>
        </div>

        <Reveal delay={0.12}>
          <footer className="relative mt-16 overflow-hidden rounded-xl border border-foreground/10 bg-foreground p-6 text-background shadow-[0_26px_80px_color-mix(in_oklab,var(--foreground)_18%,transparent)] lg:mt-20 lg:p-8">
            <div
              aria-hidden
              className="court-grid absolute inset-0 opacity-10"
            />
            <div className="relative grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-end">
              <div>
                <Link
                  href="/"
                  className="font-heading text-3xl font-semibold leading-none text-background"
                >
                  TenPlanner
                </Link>
                <p className="mt-4 max-w-md text-sm leading-7 text-background/62">
                  Planificacion profesional para entrenadores de deportes de
                  raqueta que quieren sostener un metodo semanal.
                </p>
              </div>
              <nav className="flex flex-wrap gap-x-5 gap-y-3 md:justify-end">
                {footerLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-background/58 transition-colors hover:text-background"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </footer>
        </Reveal>
      </div>
    </section>
  );
}
