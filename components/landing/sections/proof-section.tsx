"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Lock,
  MessageSquare,
  ShieldCheck,
  Timer,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const premiumEase = [0.16, 1, 0.3, 1] as [number, number, number, number];

const proofProfiles: Array<{
  icon: LucideIcon;
  role: string;
  objection: string;
  proof: string;
  metric: string;
  supporting: string;
}> = [
  {
    icon: Timer,
    role: "Coach independiente",
    objection: "No quiero otra app que me quite tiempo antes de pista.",
    proof:
      "Planificación por bloques, biblioteca reutilizable y notas de alumno en el mismo flujo.",
    metric: "10 min",
    supporting: "para pasar de objetivo a sesión lista",
  },
  {
    icon: Users,
    role: "Coordinador de academia",
    objection: "Necesito que todos los técnicos sigan el mismo método.",
    proof:
      "Plantillas compartidas, historial por grupo y seguimiento de asistencia sin hojas sueltas.",
    metric: "1 método",
    supporting: "visible para el equipo técnico",
  },
  {
    icon: BarChart3,
    role: "Dirección de club",
    objection: "Si pago un SaaS, tiene que ordenar la operación.",
    proof:
      "Agenda, carga, alumnos y progreso conectados para revisar volumen y calidad semanal.",
    metric: "4 señales",
    supporting: "agenda, carga, asistencia, evolución",
  },
];

const trustChecklist: Array<{
  icon: LucideIcon;
  label: string;
  detail: string;
}> = [
  {
    icon: ShieldCheck,
    label: "Privacidad desde la evaluación",
    detail:
      "Datos de alumnos, notas técnicas y accesos tratados como criterio de compra, no como letra pequeña.",
  },
  {
    icon: ClipboardCheck,
    label: "Adopción comprobable",
    detail:
      "El producto debe funcionar para quien está en pista, no solo para quien mira el panel.",
  },
  {
    icon: Wallet,
    label: "Coste entendible",
    detail:
      "Valor ligado a horas de preparación, continuidad del método y menos trabajo administrativo.",
  },
  {
    icon: Lock,
    label: "Control de acceso",
    detail:
      "Separar responsabilidades entre dirección, coordinadores y entrenadores evita ruido operativo.",
  },
  {
    icon: CalendarDays,
    label: "Encaje con la semana real",
    detail:
      "Grupos, clases privadas, cambios de pista y objetivos conviven en una agenda accionable.",
  },
  {
    icon: MessageSquare,
    label: "Menos fricción de equipo",
    detail:
      "La información crítica viaja con la sesión para que cada entrenador llegue preparado.",
  },
];

const operatingSignals = [
  { label: "Sesiones preparadas", value: "12", unit: "semana" },
  { label: "Alumnos con foco activo", value: "48", unit: "seguimiento" },
  { label: "Grupos revisados", value: "7", unit: "coordinacion" },
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
      initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
      transition={{ duration: 0.72, delay, ease: premiumEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ProofProfileCard({
  item,
  index,
}: {
  item: (typeof proofProfiles)[number];
  index: number;
}) {
  const Icon = item.icon;

  return (
    <Reveal delay={index * 0.08}>
      <motion.article
        whileHover={{ y: -5 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="group flex min-h-[360px] flex-col border border-border bg-card/78 p-5 shadow-[0_24px_70px_color-mix(in_oklab,var(--foreground)_5%,transparent)] backdrop-blur-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-11 shrink-0 place-items-center border border-brand/18 bg-brand/10 text-brand">
            <Icon className="size-5" />
          </span>
          <span className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Perfil 0{index + 1}
          </span>
        </div>

        <h3 className="landing-display mt-7 text-3xl font-semibold leading-none text-foreground">
          {item.role}
        </h3>
        <q className="mt-5 block text-sm font-medium leading-6 text-muted-foreground">
          {item.objection}
        </q>
        <p className="mt-5 text-base leading-7 text-foreground">{item.proof}</p>

        <div className="mt-auto pt-8">
          <div className="flex items-end justify-between gap-5 border-t border-border pt-5">
            <div>
              <p className="landing-display text-5xl font-semibold leading-none text-brand">
                {item.metric}
              </p>
              <p className="mt-2 max-w-[12rem] text-xs leading-5 text-muted-foreground">
                {item.supporting}
              </p>
            </div>
            <CheckCircle2 className="size-6 text-brand transition-transform group-hover:scale-110" />
          </div>
        </div>
      </motion.article>
    </Reveal>
  );
}

function TrustChecklistItem({
  item,
  index,
}: {
  item: (typeof trustChecklist)[number];
  index: number;
}) {
  const Icon = item.icon;

  return (
    <motion.li
      initial={{ opacity: 0, x: -14 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.52, delay: index * 0.055, ease: premiumEase }}
      className="grid grid-cols-[2.75rem_1fr] gap-4 border-t border-border py-5"
    >
      <span className="grid size-11 place-items-center bg-foreground text-background">
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-foreground">{item.label}</span>
        <span className="mt-2 block text-sm leading-6 text-muted-foreground">{item.detail}</span>
      </span>
    </motion.li>
  );
}

export function ProofSection({ className }: { className?: string }) {
  return (
    <section
      id="prueba"
      className={cn(
        "relative overflow-hidden bg-muted/20 px-4 py-24 text-foreground sm:px-6 lg:px-8 lg:py-32",
        className
      )}
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-border" />
      <div
        aria-hidden
        className="absolute right-[-12rem] top-24 h-28 w-[44rem] -rotate-6 border-y border-brand/10 bg-brand-muted/30 blur-2xl"
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Prueba operativa
            </p>
            <h2 className="landing-display mt-5 max-w-4xl text-[clamp(3rem,6.5vw,6.7rem)] font-semibold leading-[0.9] text-foreground">
              Confianza para comprar antes de prometer milagros.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              Los compradores de SaaS no solo validan funcionalidades: quieren
              seguridad, adopción sin fricción, precio claro y evidencia de que
              el sistema encaja con su operación. TenPlanner lo muestra con
              escenarios de trabajo, no con testimonios inventados.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-4 lg:grid-cols-3">
          {proofProfiles.map((item, index) => (
            <ProofProfileCard key={item.role} item={item} index={index} />
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:mt-10 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <div className="relative h-full overflow-hidden border border-border bg-foreground p-6 text-background shadow-[0_30px_90px_color-mix(in_oklab,var(--foreground)_18%,transparent)] sm:p-8">
              <div aria-hidden className="court-plate absolute inset-4 opacity-[0.16]" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-background/72">
                  Panel de validación
                </p>
                <h3 className="landing-display mt-5 text-4xl font-semibold leading-none sm:text-5xl">
                  Lo que una academia mira antes de cambiar de herramienta.
                </h3>
                <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  {operatingSignals.map((signal, index) => (
                    <motion.div
                      key={signal.label}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.62, delay: 0.12 + index * 0.07, ease: premiumEase }}
                      className="border border-background/10 bg-background/7 p-4"
                    >
                      <p className="landing-display text-4xl font-semibold leading-none text-brand-muted">
                        {signal.value}
                      </p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-background/52">
                        {signal.unit}
                      </p>
                      <p className="mt-3 text-sm leading-5 text-background/78">{signal.label}</p>
                    </motion.div>
                  ))}
                </div>
                <p className="mt-8 text-sm leading-7 text-background/64">
                  Ejemplo de operación, no garantía de resultado. La prueba es
                  que el proceso sea visible: planificar, ejecutar, revisar y
                  repetir con menos pérdida de contexto.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="ledger-surface h-full border border-border p-6 shadow-[0_24px_70px_color-mix(in_oklab,var(--foreground)_5%,transparent)] sm:p-8">
              <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Checklist de confianza
                  </p>
                  <h3 className="landing-display mt-3 text-4xl font-semibold leading-none text-foreground">
                    Objeciones resueltas antes de la demo.
                  </h3>
                </div>
                <span className="inline-flex w-fit items-center gap-2 border border-brand/18 bg-brand/10 px-3 py-2 text-xs font-semibold text-brand">
                  <CheckCircle2 className="size-4" />
                  Sin claims ficticios
                </span>
              </div>

              <ul className="mt-2">
                {trustChecklist.map((item, index) => (
                  <TrustChecklistItem key={item.label} item={item} index={index} />
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
