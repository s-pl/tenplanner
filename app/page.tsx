import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Clock,
  Flame,
  ChevronRight,
  Brain,
  Circle,
  ArrowRight,
  ArrowLeft,
  Bot,
  User,
  RotateCcw,
  Trash2,
  Send,
  ChevronDown,
  Sparkles,
} from "lucide-react";

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
      <g stroke="currentColor" strokeWidth="0.6">
        {/* outer court */}
        <rect x="2" y="2" width="396" height="196" rx="1" />
        {/* net */}
        <line x1="200" y1="2" x2="200" y2="198" strokeDasharray="1 3" />
        {/* service lines */}
        <line x1="80" y1="2" x2="80" y2="198" />
        <line x1="320" y1="2" x2="320" y2="198" />
        {/* center service */}
        <line x1="80" y1="100" x2="320" y2="100" />
        {/* back glass */}
        <rect x="2" y="2" width="78" height="196" strokeOpacity="0.5" />
        <rect x="320" y="2" width="78" height="196" strokeOpacity="0.5" />
      </g>
    </svg>
  );
}

function HairlineGrid({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(to right, color-mix(in oklab, var(--foreground) 6%, transparent) 1px, transparent 1px)",
        backgroundSize: "calc(100%/12) 100%",
      }}
    />
  );
}

/* ─── Small primitives ────────────────────────────────────────── */

function RuleHeavy() {
  return (
    <div className="relative h-4">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-foreground/25" />
      <div className="absolute inset-x-0 top-1/2 translate-y-[3px] border-t border-foreground/25" />
    </div>
  );
}

/* Marginalia: editorial note anchored to the right edge of a relative parent,
   offset by `y` pixels from the top of that parent. Connects to content via
   a thin horizontal rule. Hidden below 2xl to avoid overflow. */
function Marginalia({
  y,
  children,
  tone = "muted",
}: {
  y: number;
  children: React.ReactNode;
  tone?: "muted" | "brand";
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none hidden 2xl:flex absolute left-full items-center gap-3 whitespace-nowrap"
      style={{ top: y }}
    >
      <span
        className={`h-px w-10 ${tone === "brand" ? "bg-brand/60" : "bg-foreground/25"}`}
      />
      <span
        className={`font-heading italic text-[13px] leading-none ${tone === "brand" ? "text-brand/80" : "text-foreground/60"}`}
      >
        {children}
      </span>
    </div>
  );
}

/* ─── Mockup: Dr. Planner chat ────────────────────────────────── */

function ChatMockup({ withMarginalia = false }: { withMarginalia?: boolean }) {
  return (
    <div className="relative">
      <div className="rounded-[16px] border border-foreground/15 bg-card overflow-hidden shadow-[0_26px_70px_-34px_color-mix(in_oklab,var(--foreground)_42%,transparent)]">
        {/* Browser frame */}
        <div className="border-b border-foreground/10 bg-foreground/[0.02] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-foreground/15" />
              <span className="size-2.5 rounded-full bg-foreground/15" />
              <span className="size-2.5 rounded-full bg-foreground/15" />
            </div>
            <div className="ml-2 min-w-0 flex-1 max-w-[420px] rounded-md border border-foreground/15 bg-background/70 px-3 py-1 font-sans text-[10px] tracking-[0.05em] text-foreground/55 truncate">
              tenplanner.com
            </div>
          </div>
        </div>

        {/* Chat app header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-foreground/10 bg-card/80 backdrop-blur">
          <span className="size-7 rounded-lg border border-foreground/15 bg-foreground/[0.02] flex items-center justify-center text-foreground/60">
            <ArrowLeft className="size-3.5" />
          </span>
          <div className="size-7 rounded-full bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0">
            <Bot className="size-3.5 text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-foreground truncate">
              Dr. Planner
            </p>
            <p className="text-[10px] text-foreground/50 truncate">
              Sesion de volea · Carlos Lopez · 60 min
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className="size-7 rounded-lg border border-foreground/15 bg-foreground/[0.02] flex items-center justify-center text-foreground/45">
              <RotateCcw className="size-3.5" />
            </span>
            <span className="size-7 rounded-lg border border-foreground/15 bg-foreground/[0.02] flex items-center justify-center text-foreground/45">
              <Trash2 className="size-3.5" />
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-gradient-to-b from-background via-background to-foreground/[0.02] px-4 md:px-5 py-4 md:py-5 space-y-3.5 text-[13px] leading-relaxed">
          {/* Reasoning bubble */}
          <div className="flex gap-2.5">
            <div className="size-7 rounded-full bg-brand/10 border border-brand/25 flex items-center justify-center shrink-0 mt-0.5">
              <Brain className="size-3.5 text-brand" />
            </div>
            <div className="max-w-[88%] w-full">
              <div className="inline-flex items-center gap-1.5 text-[11px] text-foreground/60">
                <span className="font-medium text-brand">Pensando</span>
                <ChevronDown className="size-3" />
              </div>
              <p className="mt-1.5 rounded-xl border border-dashed border-brand/30 bg-brand/[0.04] px-3.5 py-2.5 text-[12px] leading-relaxed text-foreground/72 italic">
                Reviso historial reciente: 3 semanas sin trabajo de volea, nivel
                intermedio-alto y tolerancia alta a cargas de reaccion.
              </p>
            </div>
          </div>

          {/* User message */}
          <div className="flex items-start justify-end gap-2.5">
            <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-brand text-brand-foreground px-4 py-2.5 text-[12px] leading-relaxed">
              Quiero una sesion de 60 min para @Carlos Lopez. Objetivo: volea en
              situacion de presion.
            </div>
            <div className="size-7 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
              <User className="size-3.5 text-muted-foreground" />
            </div>
          </div>

          {/* Assistant message */}
          <div className="flex gap-2.5">
            <div className="size-7 rounded-full bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="size-3.5 text-brand" />
            </div>
            <div className="max-w-[82%] rounded-2xl rounded-tl-sm border border-foreground/10 bg-card px-4 py-2.5 text-[12px] text-foreground/85">
              Perfecto. Te propongo un bloque tecnico progresivo, con subida de
              intensidad en el tramo central y cierre competitivo.
            </div>
          </div>

          {/* Tool cards */}
          <div className="ml-9 space-y-2.5">
            <div className="font-sans text-[10px] uppercase tracking-[0.17em] text-foreground/50 flex items-center gap-2">
              <span className="text-brand">▸</span> mostrar_ejercicios{" "}
              <span className="text-foreground/30">· 3 resultados</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { n: "Volea + pared", d: "12 min", i: 3, c: "Tecnica" },
                { n: "Bajada cruzada", d: "10 min", i: 4, c: "Tecnica" },
                { n: "Red 2v2 bajo presion", d: "13 min", i: 4, c: "Tactica" },
              ].map((e) => (
                <div
                  key={e.n}
                  className="rounded-xl border border-foreground/10 bg-card p-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-sans text-[9px] uppercase tracking-[0.15em] text-foreground/45">
                      {e.c}
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/10 px-1.5 py-0.5 text-[9px] font-semibold text-brand">
                      <Sparkles className="size-2.5" /> IA
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold leading-tight text-foreground">
                    {e.n}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-sans text-[9px] text-foreground/50 tabular-nums">
                      {e.d}
                    </span>
                    <div className="flex gap-[2px]">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className={`size-[4px] rounded-full ${n <= e.i ? "bg-brand" : "bg-foreground/15"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ml-9 rounded-xl border border-foreground/10 bg-card px-3.5 py-3">
            <div className="grid sm:grid-cols-2 gap-x-5 gap-y-1.5 text-[11px]">
              <span className="font-sans text-[9px] uppercase tracking-[0.14em] text-foreground/45">
                Objetivo
              </span>
              <span className="text-foreground/85">Volea bajo presion</span>
              <span className="font-sans text-[9px] uppercase tracking-[0.14em] text-foreground/45">
                Intensidad
              </span>
              <span className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`h-1 w-4 rounded-full ${n <= 4 ? "bg-brand" : "bg-foreground/15"}`}
                  />
                ))}
              </span>
              <span className="font-sans text-[9px] uppercase tracking-[0.14em] text-foreground/45">
                Fecha
              </span>
              <span className="text-foreground/85 tabular-nums">
                Mie 23 abr · 18:00
              </span>
            </div>
            <button className="mt-3 w-full rounded-lg bg-brand text-brand-foreground text-[11px] font-semibold py-2">
              Confirmar y crear sesion
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-foreground/10 bg-card/80 px-4 py-3.5">
          <div className="flex items-center gap-2 rounded-2xl border border-foreground/12 bg-background px-3 py-2">
            <span className="flex-1 truncate text-[12px] leading-none text-foreground/42">
              Describe la sesion que necesitas...
            </span>
            <span className="size-8 rounded-xl bg-brand text-brand-foreground flex items-center justify-center shrink-0">
              <Send className="size-3.5" />
            </span>
          </div>
          <p className="text-[10px] text-foreground/40 text-center mt-1.5">
            Intro para enviar · Shift+Intro para nueva linea
          </p>
        </div>
      </div>

      {/* Marginalia — editorial side notes aligned with features */}
      {withMarginalia && (
        <>
          <Marginalia y={150} tone="brand">
            razonamiento expuesto
          </Marginalia>
          <Marginalia y={315}>busca en tu biblioteca</Marginalia>
          <Marginalia y={475}>propone, tú confirmas</Marginalia>
        </>
      )}
    </div>
  );
}

/* ─── Mockup: Dr. Planner capabilities panel ──────────────────── */

const DR_TOOLS = [
  { id: "01", name: "buscar_alumno", desc: "Lee perfil, nivel y objetivos" },
  {
    id: "02",
    name: "analizar_historial",
    desc: "Detecta bloqueos y progresión",
  },
  { id: "03", name: "sesiones_similares", desc: "Encuentra patrones pasados" },
  { id: "04", name: "mostrar_ejercicios", desc: "Busca en tu biblioteca" },
  { id: "05", name: "crear_ejercicio", desc: "Genera lo que falta" },
  { id: "06", name: "configurar_sesion", desc: "Objetivo, intensidad, fecha" },
  { id: "07", name: "crear_sesion", desc: "Escribe el plan final" },
];

function ToolsPanel() {
  return (
    <div className="rounded-[14px] border border-foreground/15 bg-card overflow-hidden shadow-[0_24px_60px_-30px_color-mix(in_oklab,var(--foreground)_40%,transparent)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-foreground/10 bg-foreground/[0.02]">
        <div className="size-7 rounded-full bg-brand/10 border border-brand/25 flex items-center justify-center">
          <Brain className="size-3.5 text-brand" />
        </div>
        <div className="flex-1">
          <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/45">
            Dr. Planner
          </p>
          <p className="font-heading italic text-[15px] leading-none text-foreground">
            Caja de herramientas
          </p>
        </div>
        <span className="font-sans text-[10px] tracking-[0.18em] text-brand">
          07 · TOOLS
        </span>
      </div>

      {/* Tool list */}
      <ul className="divide-y divide-foreground/8">
        {DR_TOOLS.map((t) => (
          <li
            key={t.id}
            className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-4 px-5 py-3 hover:bg-foreground/[0.015] transition-colors group"
          >
            <span className="font-sans text-[10px] tabular-nums text-foreground/35">
              {t.id}
            </span>
            <span className="text-brand font-sans text-[11px]">▸</span>
            <div>
              <p className="font-sans text-[12px] text-foreground/90">
                {t.name}
              </p>
              <p className="text-[11px] text-foreground/55 mt-0.5">{t.desc}</p>
            </div>
            <span className="font-sans text-[9px] tracking-[0.18em] text-foreground/30 group-hover:text-brand transition-colors">
              AUTO
            </span>
          </li>
        ))}
      </ul>

      {/* Footer: flow diagram */}
      <div className="border-t border-foreground/10 bg-foreground/[0.015] px-5 py-4">
        <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-foreground/45 mb-3">
          Ciclo de razonamiento
        </p>
        <div className="flex items-center gap-1.5 text-[11px]">
          {["Lee", "Piensa", "Propone", "Confirma"].map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className={`rounded-md border px-2 py-1 font-heading italic ${
                  i === 1
                    ? "bg-brand/10 border-brand/30 text-brand"
                    : "border-foreground/15 text-foreground/75"
                }`}
              >
                {s}
              </span>
              {i < 3 && (
                <ArrowRight
                  className="size-3 text-foreground/30"
                  strokeWidth={1.5}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Mockup: exercise library ────────────────────────────────── */

const LIBRARY_EXERCISES = [
  {
    name: "Volea de derecha — pared",
    cat: "TÉC",
    diff: "INT",
    dur: "12",
    tag: "01",
  },
  {
    name: "Cruzado y bajada de pared",
    cat: "TÉC",
    diff: "AVZ",
    dur: "10",
    tag: "02",
  },
  { name: "Remate desde pared", cat: "TÉC", diff: "AVZ", dur: "12", tag: "03" },
  {
    name: "2v2 red con presión",
    cat: "TÁC",
    diff: "AVZ",
    dur: "15",
    tag: "04",
  },
  {
    name: "Construcción al fondo",
    cat: "TÁC",
    diff: "INT",
    dur: "10",
    tag: "05",
  },
  {
    name: "Circuito de agilidad",
    cat: "FÍS",
    diff: "INT",
    dur: "10",
    tag: "06",
  },
  { name: "Core y estabilidad", cat: "FÍS", diff: "PRN", dur: "12", tag: "07" },
  {
    name: "Calentamiento dinámico",
    cat: "CAL",
    diff: "·",
    dur: "08",
    tag: "08",
  },
  { name: "Movilidad articular", cat: "CAL", diff: "·", dur: "06", tag: "09" },
];

function LibraryCard() {
  return (
    <div className="rounded-xl border border-foreground/15 bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-foreground/10">
        <span className="font-sans text-[10px] tracking-[0.2em] text-foreground/55">
          BIBLIOTECA
        </span>
        <span className="font-sans text-[10px] text-foreground/35 tabular-nums">
          / 137 EJERCICIOS
        </span>
        <span className="ml-auto font-sans text-[10px] tracking-[0.15em] text-brand">
          + AI
        </span>
      </div>
      <ul className="divide-y divide-foreground/8">
        {LIBRARY_EXERCISES.map((e) => (
          <li
            key={e.tag}
            className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-2.5 hover:bg-foreground/[0.02] transition-colors group"
          >
            <span className="font-sans text-[10px] tabular-nums text-foreground/35 w-6">
              {e.tag}
            </span>
            <span
              className={
                "font-sans text-[9px] font-bold tracking-[0.15em] px-1.5 py-0.5 rounded-sm border " +
                (e.cat === "TÉC"
                  ? "border-brand/40 text-brand bg-brand/[0.05]"
                  : e.cat === "TÁC"
                    ? "border-foreground/25 text-foreground/70"
                    : e.cat === "FÍS"
                      ? "border-foreground/15 text-foreground/55 border-dashed"
                      : "border-foreground/10 text-foreground/40 italic")
              }
            >
              {e.cat}
            </span>
            <span className="text-[13px] text-foreground/85 truncate">
              {e.name}
            </span>
            <span className="font-sans text-[10px] tracking-[0.1em] text-foreground/40">
              {e.diff}
            </span>
            <span className="font-sans text-[11px] tabular-nums text-foreground/70 w-8 text-right">
              {e.dur}
              <span className="text-foreground/30">&apos;</span>
            </span>
            <ChevronRight className="size-3 text-foreground/25 group-hover:text-brand transition-colors" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Mockup: intensity curve ─────────────────────────────────── */

function IntensityCurve() {
  const points = [
    { name: "Calentamiento", x: 0, y: 1, phase: "a" },
    { name: "Movilidad", x: 10, y: 2, phase: "a" },
    { name: "Volea derecha", x: 18, y: 3, phase: "m" },
    { name: "Cruzado y bajada", x: 30, y: 4, phase: "m" },
    { name: "Táctica 2v2", x: 40, y: 5, phase: "m" },
    { name: "Agilidad", x: 50, y: 3, phase: "m" },
    { name: "Vuelta calma", x: 57, y: 1, phase: "c" },
  ];
  const W = 600;
  const H = 220;
  const mapX = (min: number) => 40 + (min / 60) * (W - 60);
  const mapY = (y: number) => H - 30 - ((y - 0) / 5) * (H - 60);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${mapX(p.x)} ${mapY(p.y)}`)
    .join(" ");

  return (
    <div className="rounded-xl border border-foreground/15 bg-card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="font-sans text-[10px] tracking-[0.2em] text-foreground/55">
            CURVA DE INTENSIDAD
          </p>
          <p className="font-heading italic text-xl leading-tight mt-0.5">
            Técnica de volea · 60&apos;
          </p>
        </div>
        <div className="text-right font-sans text-[10px] tracking-[0.15em] text-foreground/50 tabular-nums">
          <p>PICO · 5/5</p>
          <p className="text-foreground/35">MEDIA · 2.7/5</p>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto overflow-visible"
        >
          {/* y axis labels */}
          {[1, 2, 3, 4, 5].map((n) => (
            <g key={n}>
              <line
                x1={40}
                y1={mapY(n)}
                x2={W - 20}
                y2={mapY(n)}
                stroke="color-mix(in oklab, currentColor 10%, transparent)"
                strokeWidth={0.6}
                strokeDasharray="2 4"
              />
              <text
                x={30}
                y={mapY(n) + 3}
                fontSize="9"
                textAnchor="end"
                fill="currentColor"
                opacity="0.4"
                fontFamily="var(--font-sans)"
              >
                {n}
              </text>
            </g>
          ))}
          {/* phase bands */}
          <rect
            x={mapX(0)}
            y={20}
            width={mapX(10) - mapX(0)}
            height={H - 50}
            fill="currentColor"
            opacity="0.025"
          />
          <rect
            x={mapX(50)}
            y={20}
            width={mapX(60) - mapX(50)}
            height={H - 50}
            fill="currentColor"
            opacity="0.025"
          />
          {/* area */}
          <path
            d={`${d} L ${mapX(57)} ${H - 30} L ${mapX(0)} ${H - 30} Z`}
            fill="var(--brand)"
            opacity="0.09"
          />
          {/* line */}
          <path d={d} fill="none" stroke="var(--brand)" strokeWidth="2" />
          {/* points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={mapX(p.x)}
                cy={mapY(p.y)}
                r={4}
                fill="var(--background)"
                stroke="var(--brand)"
                strokeWidth="2"
              />
            </g>
          ))}
          {/* phase labels */}
          <g
            fontFamily="var(--font-sans)"
            fontSize="9"
            fill="currentColor"
            opacity="0.45"
            letterSpacing="0.5"
          >
            <text x={mapX(4)} y={H - 8} textAnchor="middle">
              CALENT.
            </text>
            <text x={mapX(30)} y={H - 8} textAnchor="middle">
              PRINCIPAL
            </text>
            <text x={mapX(55)} y={H - 8} textAnchor="middle">
              V. CALMA
            </text>
          </g>
          {/* minute marks */}
          <g
            fontFamily="var(--font-sans)"
            fontSize="8"
            fill="currentColor"
            opacity="0.35"
          >
            {[0, 15, 30, 45, 60].map((min) => (
              <g key={min}>
                <line
                  x1={mapX(min)}
                  y1={H - 34}
                  x2={mapX(min)}
                  y2={H - 30}
                  stroke="currentColor"
                  strokeWidth="0.8"
                  opacity="0.7"
                />
                <text x={mapX(min)} y={H - 22} textAnchor="middle">
                  {String(min).padStart(2, "0")}&apos;
                </text>
              </g>
            ))}
          </g>
          <line
            x1={mapX(10)}
            y1={20}
            x2={mapX(10)}
            y2={H - 30}
            stroke="currentColor"
            strokeWidth="0.6"
            opacity="0.15"
            strokeDasharray="2 3"
          />
          <line
            x1={mapX(50)}
            y1={20}
            x2={mapX(50)}
            y2={H - 30}
            stroke="currentColor"
            strokeWidth="0.6"
            opacity="0.15"
            strokeDasharray="2 3"
          />
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-foreground/10">
        <div>
          <p className="font-sans text-[9px] tracking-[0.18em] text-foreground/40">
            DURACIÓN
          </p>
          <p className="font-heading text-xl mt-0.5 tabular-nums">
            60<span className="text-foreground/40">&apos;</span>
          </p>
        </div>
        <div>
          <p className="font-sans text-[9px] tracking-[0.18em] text-foreground/40">
            EJERCICIOS
          </p>
          <p className="font-heading text-xl mt-0.5 tabular-nums">07</p>
        </div>
        <div>
          <p className="font-sans text-[9px] tracking-[0.18em] text-foreground/40">
            CARGA
          </p>
          <p className="font-heading text-xl mt-0.5">Alta</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Mockup: students roster ─────────────────────────────────── */

const STUDENTS = [
  {
    n: "Carlos López",
    age: 34,
    lvl: "INTERMEDIO",
    hand: "D",
    grip: "Cont.",
    exp: 4,
    sess: 18,
    trend: "+",
  },
  {
    n: "María Torres",
    age: 28,
    lvl: "AVANZADO",
    hand: "D",
    grip: "SemiO.",
    exp: 7,
    sess: 42,
    trend: "+",
  },
  {
    n: "Pedro García",
    age: 41,
    lvl: "AMATEUR",
    hand: "Z",
    grip: "Cont.",
    exp: 2,
    sess: 9,
    trend: "·",
  },
  {
    n: "Ana Ruiz",
    age: 22,
    lvl: "COMPETICIÓN",
    hand: "D",
    grip: "Occ.",
    exp: 9,
    sess: 68,
    trend: "+",
  },
];

function StudentsRoster() {
  return (
    <div className="rounded-xl border border-foreground/15 bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-foreground/10 flex items-baseline justify-between">
        <p className="font-sans text-[10px] tracking-[0.2em] text-foreground/55">
          PLANTILLA · 04
        </p>
        <p className="font-sans text-[10px] tracking-[0.15em] text-foreground/35">
          137 SESIONES TOTALES
        </p>
      </div>
      <div className="grid grid-cols-[2rem_1fr_auto_auto_auto] gap-x-5 px-5 py-2 font-sans text-[9px] uppercase tracking-[0.18em] text-foreground/35 border-b border-foreground/5">
        <span>#</span>
        <span>NOMBRE</span>
        <span>NIVEL</span>
        <span className="text-right">MANO · EMPUÑ.</span>
        <span className="text-right">SESIONES</span>
      </div>
      <ul>
        {STUDENTS.map((s, i) => (
          <li
            key={s.n}
            className="grid grid-cols-[2rem_1fr_auto_auto_auto] gap-x-5 items-center px-5 py-3 border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.015] transition-colors"
          >
            <span className="font-sans text-[11px] tabular-nums text-foreground/40">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="font-heading text-[16px] leading-tight">{s.n}</p>
              <p className="font-sans text-[9px] uppercase tracking-[0.18em] text-foreground/40 mt-0.5">
                {s.age} AÑOS · {s.exp} EN PISTA
              </p>
            </div>
            <span
              className={`font-sans text-[9px] font-bold tracking-[0.18em] px-1.5 py-1 rounded-sm ${
                s.lvl === "COMPETICIÓN"
                  ? "bg-brand text-brand-foreground"
                  : s.lvl === "AVANZADO"
                    ? "bg-brand/15 text-brand border border-brand/30"
                    : "bg-foreground/[0.05] text-foreground/65 border border-foreground/15"
              }`}
            >
              {s.lvl}
            </span>
            <span className="font-sans text-[11px] text-foreground/70 tabular-nums text-right">
              {s.hand} · {s.grip}
            </span>
            <span className="font-sans text-[12px] font-bold tabular-nums text-foreground text-right">
              {String(s.sess).padStart(3, "0")}{" "}
              <span
                className={
                  s.trend === "+" ? "text-brand" : "text-foreground/30"
                }
              >
                {s.trend}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Mockup: calendar month ──────────────────────────────────── */

function CalendarMonth() {
  const cells: (number | null)[] = [];
  for (let i = 0; i < 2; i++) cells.push(null);
  for (let d = 1; d <= 30; d++) cells.push(d);
  const sessions: Record<
    number,
    { t: string; phase: "tec" | "fis" | "tac" | "cal" }[]
  > = {
    1: [{ t: "Carlos", phase: "tec" }],
    2: [{ t: "María", phase: "tac" }],
    6: [
      { t: "Ana", phase: "fis" },
      { t: "Pedro", phase: "cal" },
    ],
    8: [{ t: "Carlos", phase: "tec" }],
    9: [{ t: "Grupo A", phase: "tac" }],
    13: [{ t: "Ana", phase: "fis" }],
    15: [{ t: "Carlos", phase: "tec" }],
    16: [
      { t: "María", phase: "tac" },
      { t: "Ana", phase: "tec" },
    ],
    20: [{ t: "Pedro", phase: "cal" }],
    22: [{ t: "Carlos", phase: "tec" }],
    23: [{ t: "Grupo B", phase: "fis" }],
    27: [{ t: "Ana", phase: "tac" }],
    29: [{ t: "María", phase: "tec" }],
  };
  const phaseStyle = (p: "tec" | "fis" | "tac" | "cal") => {
    if (p === "tec") return "bg-brand text-brand-foreground";
    if (p === "tac") return "border border-brand/40 text-brand bg-brand/[0.05]";
    if (p === "fis") return "border border-foreground/25 text-foreground/70";
    return "italic border border-dashed border-foreground/20 text-foreground/55";
  };
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  const today = 18;

  return (
    <div className="rounded-xl border border-foreground/15 bg-card overflow-hidden">
      <div className="flex items-baseline justify-between px-5 py-3 border-b border-foreground/10">
        <div>
          <p className="font-sans text-[10px] tracking-[0.2em] text-foreground/55">
            CALENDARIO
          </p>
          <p className="font-heading text-[22px] leading-none mt-1">
            abril <span className="italic text-foreground/55">26</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-sans text-[10px] tracking-[0.15em] text-foreground/40">
            SESIONES
          </p>
          <p className="font-heading text-xl tabular-nums">14</p>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-foreground/10">
        {days.map((d) => (
          <div
            key={d}
            className="text-center font-sans text-[9px] tracking-[0.18em] text-foreground/35 py-2 border-r border-foreground/5 last:border-0"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const evts = d != null ? sessions[d] : undefined;
          const isToday = d === today;
          return (
            <div
              key={i}
              className={`min-h-[70px] border-r border-b border-foreground/5 last:border-r-0 p-1.5 ${d == null ? "bg-foreground/[0.015]" : ""}`}
            >
              {d != null && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-sans text-[10px] tabular-nums ${
                        isToday
                          ? "inline-flex items-center justify-center rounded-sm bg-foreground text-background px-1.5 py-0.5"
                          : "text-foreground/45"
                      }`}
                    >
                      {String(d).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {evts?.map((e, j) => (
                      <div
                        key={j}
                        className={`truncate rounded-sm px-1.5 py-0.5 font-sans text-[9px] tracking-[0.05em] ${phaseStyle(e.phase)}`}
                      >
                        {e.t}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */

import { getLandingContent } from "@/lib/landing-content";

function CopyLines({ text }: { text: string }) {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  return (
    <>
      {lines.map((line, index) => (
        <span key={`${line}-${index}`}>
          {line}
          {index < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

export default async function LandingPage() {
  const copy = await getLandingContent();
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-brand/25">
      {/* ── Masthead ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-foreground/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-end justify-between py-4">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="font-heading text-[34px] leading-none tracking-tight">
                Ten<span className="italic text-brand">planner</span>
              </span>
              <span className="font-sans text-[10px] tracking-[0.18em] text-foreground/40 pb-1">
                ™
              </span>
            </Link>
            <nav className="hidden md:flex items-end gap-8 text-sm">
              {[
                ["Planner", "#planner"],
                ["Biblioteca", "#biblioteca"],
                ["Sesión", "#anatomia"],
                ["Alumnos", "#alumnos"],
                ["Calendario", "#calendario"],
              ].map(([l, h]) => (
                <a
                  key={l}
                  href={h}
                  className="text-foreground/60 hover:text-foreground transition-colors"
                >
                  {l}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden sm:inline text-sm text-foreground/55 hover:text-foreground transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="group inline-flex items-center gap-1.5 rounded-full bg-foreground text-background text-sm font-medium pl-4 pr-1.5 py-1.5 hover:bg-brand hover:text-brand-foreground transition-colors"
              >
                Probar gratis
                <span className="inline-flex items-center justify-center size-6 rounded-full bg-background/15">
                  <ArrowUpRight
                    className="size-3.5 group-hover:rotate-45 transition-transform"
                    strokeWidth={2}
                  />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-foreground/10">
        <HairlineGrid />
        {/* faint court */}
        <CourtLines className="absolute -right-32 -bottom-24 w-[900px] text-brand/10 hidden lg:block" />

        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10 pt-10 lg:pt-14 pb-16 lg:pb-20">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20 items-start">
            {/* Headline */}
            <div>
              <h1
                className="mt-1 font-heading font-normal text-foreground leading-[0.88] tracking-[-0.02em]"
                style={{ fontSize: "clamp(3.2rem, 9vw, 8.25rem)" }}
              >
                <CopyLines text={copy.hero_title} />
              </h1>

              <div className="mt-10 grid sm:grid-cols-[1fr_auto] gap-6 sm:gap-10 items-end max-w-2xl">
                <p className="text-[15px] leading-relaxed text-foreground/70 max-w-md">
                  {copy.hero_subtitle}
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    href="/register"
                    className="group inline-flex items-center gap-2 rounded-full bg-brand text-brand-foreground font-medium text-sm pl-5 pr-1.5 py-1.5"
                  >
                    {copy.hero_cta_primary}
                    <span className="inline-flex items-center justify-center size-7 rounded-full bg-background/20">
                      <ArrowRight className="size-3.5" strokeWidth={2} />
                    </span>
                  </Link>
                  <a
                    href="#planner"
                    className="text-sm text-foreground/60 hover:text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors"
                  >
                    {copy.hero_cta_secondary}
                  </a>
                </div>
              </div>
            </div>

            {/* Chat mockup */}
            <div className="relative lg:mt-6">
              <ChatMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Specs strip ──────────────────────────────────────── */}
      <section className="border-b border-foreground/10 bg-foreground/[0.015]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
          {[...copy.specs_strip].map((s) => (
            <div key={s.k} className="flex flex-col">
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-foreground/45">
                {s.k}
              </span>
              <span className="font-heading text-2xl lg:text-[30px] leading-tight mt-1">
                {s.v}
              </span>
              <span className="text-[11px] text-foreground/55 mt-0.5">
                {s.sub}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Dr. Planner ───────────────────────────────────────── */}
      <section id="planner" className="relative border-b border-foreground/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="mt-2 grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-start">
            <div className="lg:sticky lg:top-40">
              <h2
                className="font-heading font-normal leading-[0.92] tracking-[-0.015em]"
                style={{ fontSize: "clamp(2.4rem, 5.2vw, 4.5rem)" }}
              >
                <CopyLines text={copy.planner_heading} />
              </h2>

              <p className="mt-6 text-[15px] leading-relaxed text-foreground/70 max-w-md">
                {copy.planner_description}
              </p>

              <dl className="mt-10 space-y-0 border-t border-foreground/15">
                {[
                  [
                    "Lee historial",
                    "Detecta bloqueos y progresión real del alumno.",
                  ],
                  [
                    "Razonamiento visible",
                    "Ves el por qué de cada decisión, no solo el qué.",
                  ],
                  [
                    "Crea si falta",
                    "Si no encuentra el ejercicio adecuado, lo genera.",
                  ],
                  [
                    "Nunca se sobrepasa",
                    "Pide confirmación antes de cualquier cambio.",
                  ],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="grid grid-cols-[130px_1fr] gap-6 border-b border-foreground/15 py-4"
                  >
                    <dt className="font-sans text-[11px] uppercase tracking-[0.15em] text-foreground/55">
                      {k}
                    </dt>
                    <dd className="text-[14px] text-foreground/80 leading-relaxed">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative">
              <ToolsPanel />
            </div>
          </div>
        </div>
      </section>

      {/* ── Biblioteca ───────────────────────────────────────── */}
      <section
        id="biblioteca"
        className="relative border-b border-foreground/10 bg-foreground/[0.015]"
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="mt-2 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-start">
            <div>
              <div className="relative">
                <LibraryCard />
              </div>
            </div>

            <div className="lg:pl-4">
              <h2
                className="font-heading font-normal leading-[0.92] tracking-[-0.015em]"
                style={{ fontSize: "clamp(2.2rem, 4.8vw, 4rem)" }}
              >
                <CopyLines text={copy.biblioteca_heading} />
              </h2>

              <p className="mt-6 text-[15px] leading-relaxed text-foreground/70 max-w-md">
                {copy.biblioteca_description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Anatomía de una sesión ───────────────────────────── */}
      <section id="anatomia" className="relative border-b border-foreground/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="mt-2 grid lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <h2
                className="font-heading font-normal leading-[0.92] tracking-[-0.015em]"
                style={{ fontSize: "clamp(2.2rem, 4.2vw, 3.6rem)" }}
              >
                <CopyLines text={copy.anatomia_heading} />
              </h2>
              <p className="mt-6 text-[15px] leading-relaxed text-foreground/70 max-w-sm">
                {copy.anatomia_description}
              </p>

              <RuleHeavy />

              <div className="mt-8 space-y-0">
                {[
                  {
                    p: "ACTIVACIÓN",
                    t: "10'",
                    ex: ["Movilidad articular", "Calentamiento dinámico"],
                  },
                  {
                    p: "PRINCIPAL",
                    t: "35'",
                    ex: [
                      "Volea de derecha — pared",
                      "Cruzado y bajada",
                      "Táctica 2v2 red",
                    ],
                  },
                  {
                    p: "V. CALMA",
                    t: "15'",
                    ex: ["Circuito de agilidad", "Estiramientos"],
                  },
                ].map((ph) => (
                  <div
                    key={ph.p}
                    className="border-t border-foreground/15 py-4"
                  >
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="font-sans text-[10px] tracking-[0.2em] text-foreground/55">
                        {ph.p}
                      </span>
                      <span className="font-sans text-[11px] tabular-nums text-foreground/40">
                        {ph.t}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {ph.ex.map((e) => (
                        <li
                          key={e}
                          className="flex items-baseline gap-2 text-[13px] text-foreground/80"
                        >
                          <Circle className="size-1.5 mt-2 fill-foreground/20 text-transparent shrink-0" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="border-t border-foreground/15 pt-4 flex items-baseline justify-between">
                  <span className="font-sans text-[10px] tracking-[0.2em] text-foreground">
                    TOTAL
                  </span>
                  <span className="font-heading text-2xl tabular-nums">
                    60&apos;
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="relative">
                <IntensityCurve />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: <Flame className="size-4" />,
                    k: "Carga balanceada",
                    v: "Pico en minuto 40",
                  },
                  {
                    icon: <Clock className="size-4" />,
                    k: "Ritmo",
                    v: '58" por ejercicio en promedio',
                  },
                  {
                    icon: <Check className="size-4" />,
                    k: "Coherencia",
                    v: "Cuadra con duración pedida",
                  },
                ].map((s) => (
                  <div
                    key={s.k}
                    className="rounded-xl border border-foreground/15 bg-card p-4"
                  >
                    <div className="flex items-center gap-2 text-brand">
                      {s.icon}
                      <span className="font-sans text-[10px] tracking-[0.18em] uppercase">
                        Análisis
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] font-medium">{s.k}</p>
                    <p className="text-[12px] text-foreground/60 mt-0.5">
                      {s.v}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Alumnos ──────────────────────────────────────────── */}
      <section
        id="alumnos"
        className="relative border-b border-foreground/10 bg-foreground/[0.015]"
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="mt-2 grid lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-20 items-start">
            <div className="lg:sticky lg:top-40">
              <h2
                className="font-heading font-normal leading-[0.92] tracking-[-0.015em]"
                style={{ fontSize: "clamp(2.2rem, 4.8vw, 4rem)" }}
              >
                <CopyLines text={copy.alumnos_heading} />
              </h2>

              <p className="mt-6 text-[15px] leading-relaxed text-foreground/70 max-w-md">
                {copy.alumnos_description}
              </p>

              <RuleHeavy />

              <blockquote className="mt-8 font-heading italic text-[22px] leading-snug text-foreground/80 pl-4 border-l-2 border-brand">
                &ldquo;Carlos lleva tres sesiones sin volea. Le preparo un
                bloque principal de técnica con presión progresiva.&rdquo;
                <footer className="mt-3 font-sans not-italic text-[10px] tracking-[0.2em] uppercase text-foreground/45">
                  — Dr. Planner, 12:04
                </footer>
              </blockquote>
            </div>

            <div className="relative">
              <StudentsRoster />
            </div>
          </div>
        </div>
      </section>

      {/* ── Calendario ───────────────────────────────────────── */}
      <section
        id="calendario"
        className="relative border-b border-foreground/10"
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="mt-2 grid lg:grid-cols-[1.3fr_1fr] gap-12 lg:gap-20 items-start">
            <div className="relative">
              <CalendarMonth />
            </div>

            <div className="lg:pl-4">
              <h2
                className="font-heading font-normal leading-[0.92] tracking-[-0.015em]"
                style={{ fontSize: "clamp(2.2rem, 4.8vw, 4rem)" }}
              >
                Planificas
                <br />
                <span className="italic">en bloque</span>.<br />
                Entrenas en
                <br />
                presente.
              </h2>

              <p className="mt-6 text-[15px] leading-relaxed text-foreground/70 max-w-md">
                Una semana o un mes completo, sesión a sesión. Etiqueta por
                alumno, fase dominante o tipo de trabajo. Cambia el plan sin
                perder el hilo del ciclo.
              </p>

              <div className="mt-10 space-y-3 font-sans text-[10px] tracking-[0.18em] uppercase text-foreground/55">
                <div className="flex items-center gap-2.5">
                  <span className="inline-block h-2 w-4 rounded-sm bg-brand" />{" "}
                  TÉCNICA
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-block h-2 w-4 rounded-sm border border-brand/40 bg-brand/[0.08]" />{" "}
                  TÁCTICA
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-block h-2 w-4 rounded-sm border border-foreground/25" />{" "}
                  FÍSICO
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-block h-2 w-4 rounded-sm border border-dashed border-foreground/20" />{" "}
                  CALENTAMIENTO
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Manifesto / CTA ──────────────────────────────────── */}
      <section className="relative border-b border-foreground/10">
        <CourtLines className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[700px] text-brand/8 hidden md:block" />
        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10 py-24 lg:py-36 text-center">
          <h2
            className="mt-2 font-heading font-normal leading-[0.9] tracking-[-0.02em] max-w-4xl mx-auto"
            style={{ fontSize: "clamp(2.6rem, 7vw, 6rem)" }}
          >
            <CopyLines text={copy.manifesto_heading} />
          </h2>

          <p className="mt-10 text-[15px] leading-relaxed text-foreground/65 max-w-lg mx-auto">
            {copy.manifesto_sub}
          </p>

          <div className="mt-12 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground text-background text-[15px] font-medium pl-6 pr-2 py-2 hover:bg-brand hover:text-brand-foreground transition-colors"
            >
              Abrir TenPlanner
              <span className="inline-flex items-center justify-center size-8 rounded-full bg-background/15">
                <ArrowUpRight
                  className="size-4 group-hover:rotate-45 transition-transform"
                  strokeWidth={2}
                />
              </span>
            </Link>
            <Link
              href="/login"
              className="text-[14px] text-foreground/60 hover:text-foreground underline underline-offset-4 decoration-foreground/25 transition-colors"
            >
              Ya tengo cuenta
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 font-sans text-[10px] tracking-[0.18em] uppercase text-foreground/40">
            <span>Gratis para empezar</span>
            <span className="size-1 rounded-full bg-foreground/20" />
            <span>Sin tarjeta</span>
            <span className="size-1 rounded-full bg-foreground/20" />
            <span>Hecho en España</span>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-background">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
          <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 pb-10 border-b border-foreground/10">
            <div>
              <span className="font-heading text-[28px] leading-none tracking-tight">
                Ten<span className="italic text-brand">planner</span>
              </span>
              <p className="mt-4 text-[13px] text-foreground/60 leading-relaxed max-w-xs">
                {copy.footer_tagline}
              </p>
            </div>
            {[
              {
                t: "Producto",
                l: [
                  ["Dr. Planner", "#planner"],
                  ["Biblioteca", "#biblioteca"],
                  ["Sesiones", "#anatomia"],
                  ["Alumnos", "#alumnos"],
                  ["Calendario", "#calendario"],
                ],
              },
              {
                t: "Cuenta",
                l: [
                  ["Entrar", "/login"],
                  ["Crear cuenta", "/register"],
                  ["Precios", "#"],
                ],
              },
              {
                t: "Soporte",
                l: [
                  ["Contacto", "#"],
                  ["Guía rápida", "#"],
                  ["Estado", "#"],
                ],
              },
            ].map((col) => (
              <div key={col.t}>
                <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-foreground/45 mb-4">
                  {col.t}
                </p>
                <ul className="space-y-2.5">
                  {col.l.map(([label, href]) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-[13px] text-foreground/80 hover:text-brand transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-6 text-[12px] leading-relaxed text-foreground/55">
            <span>
              © {new Date().getFullYear()} TenPlanner · Todos los derechos
              reservados
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
