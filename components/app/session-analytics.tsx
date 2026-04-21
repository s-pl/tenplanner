"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Clock,
  Dumbbell,
  Flame,
  Gauge,
  Layers,
  Scale,
  Tag,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type {
  SessionAnalytics,
  TrainingPhase,
  ExerciseCategory,
  ExerciseDifficulty,
} from "@/lib/sessions/analytics";
import { cn } from "@/lib/utils";

const PHASE_LABELS: Record<TrainingPhase, string> = {
  activation: "Activación",
  main: "Principal",
  cooldown: "Vuelta a la calma",
};

const PHASE_COLORS: Record<TrainingPhase, string> = {
  activation: "#f59e0b",
  main: "oklch(0.73 0.19 148)",
  cooldown: "#38bdf8",
};

const PHASE_BG: Record<TrainingPhase, string> = {
  activation: "bg-amber-500",
  main: "bg-brand",
  cooldown: "bg-sky-400",
};

const PHASE_TEXT: Record<TrainingPhase, string> = {
  activation: "text-amber-400",
  main: "text-brand",
  cooldown: "text-sky-400",
};

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  technique: "Técnica",
  tactics: "Táctica",
  fitness: "Físico",
  "warm-up": "Calentamiento",
};

const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
  technique: "#60a5fa",
  tactics: "#c084fc",
  fitness: "#fbbf24",
  "warm-up": "oklch(0.73 0.19 148)",
};

const DIFFICULTY_LABELS: Record<ExerciseDifficulty, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

const DIFFICULTY_COLORS: Record<ExerciseDifficulty, string> = {
  beginner: "oklch(0.73 0.19 148)",
  intermediate: "#fbbf24",
  advanced: "#f87171",
};

const DIFFICULTY_BG: Record<ExerciseDifficulty, string> = {
  beginner: "bg-brand",
  intermediate: "bg-amber-400",
  advanced: "bg-red-400",
};

function getLoadCategory(load: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (load === 0)
    return {
      label: "Sin datos",
      color: "text-muted-foreground",
      bg: "bg-muted",
    };
  if (load < 80)
    return { label: "Ligera", color: "text-sky-400", bg: "bg-sky-400/15" };
  if (load < 200)
    return { label: "Moderada", color: "text-brand", bg: "bg-brand/15" };
  if (load < 400)
    return { label: "Exigente", color: "text-amber-400", bg: "bg-amber-400/15" };
  return { label: "Muy alta", color: "text-red-400", bg: "bg-red-400/15" };
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}

function StatCard({ icon: Icon, label, value, hint, accent }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-1.5 hover:border-border/80 transition-colors">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className={cn("size-3.5", accent)} />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p
        className={cn(
          "font-heading text-2xl font-bold leading-none",
          accent ?? "text-foreground"
        )}
      >
        {value}
      </p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
      {text}
    </div>
  );
}

function HeroCard({ analytics }: { analytics: SessionAnalytics }) {
  const load = analytics.trainingLoad;
  const loadMeta = getLoadCategory(load);
  const density = analytics.densityScore;
  const peak = analytics.peakIntensity;
  const peakPos = analytics.peakPositionPct;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-brand/5 border border-border rounded-2xl p-6">
      <div
        aria-hidden
        className="absolute -top-12 -right-12 size-48 rounded-full bg-brand/10 blur-3xl"
      />
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-1">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
            <Activity className="size-3.5 text-brand" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Training Load
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-5xl font-bold tracking-tight text-foreground">
              {load}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              min · int
            </span>
          </div>
          <div className="mt-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-border/60",
                loadMeta.color,
                loadMeta.bg
              )}
            >
              <span className={cn("size-1.5 rounded-full", loadMeta.bg)} />
              Carga {loadMeta.label}
            </span>
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-3 gap-3">
          <div className="bg-background/40 border border-border/60 rounded-xl p-3">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Gauge className="size-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Densidad
              </span>
            </div>
            <p className="font-heading text-2xl font-bold text-foreground mt-1 leading-none">
              {density !== null ? `${Math.round(density)}%` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              carga / máximo
            </p>
          </div>
          <div className="bg-background/40 border border-border/60 rounded-xl p-3">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Zap className="size-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Pico
              </span>
            </div>
            <p className="font-heading text-2xl font-bold text-foreground mt-1 leading-none">
              {peak !== null ? `${peak}/5` : "—"}
            </p>
            <p
              className="text-[10px] text-muted-foreground mt-1 truncate"
              title={analytics.peakExerciseName ?? undefined}
            >
              {peakPos !== null ? `a ${Math.round(peakPos)}%` : "sin datos"}
            </p>
          </div>
          <div className="bg-background/40 border border-border/60 rounded-xl p-3">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Scale className="size-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Balance
              </span>
            </div>
            <p className="font-heading text-2xl font-bold text-foreground mt-1 leading-none">
              {analytics.balanceScore}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              cat. cubiertas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhaseTargetsCard({ analytics }: { analytics: SessionAnalytics }) {
  if (analytics.totalMinutes === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50">
          <h3 className="font-semibold text-sm text-foreground">
            Distribución por fases
          </h3>
        </div>
        <div className="p-5">
          <EmptyState text="Sin duración asignada a los ejercicios." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">
          Distribución por fases
        </h3>
        <span className="text-[11px] text-muted-foreground">
          real vs. objetivo
        </span>
      </div>
      <div className="p-5 space-y-4">
        {/* Real stacked bar */}
        <div className="flex h-8 rounded-xl overflow-hidden gap-px">
          {analytics.phaseBreakdown
            .filter((p) => p.minutes > 0)
            .map((p) => (
              <div
                key={p.phase}
                className={cn("h-full", PHASE_BG[p.phase])}
                style={{ width: `${p.percentage}%` }}
                title={`${PHASE_LABELS[p.phase]}: ${p.minutes} min`}
              />
            ))}
        </div>

        {/* Targets */}
        <div className="space-y-2.5">
          {analytics.phaseTargets.map((t) => {
            const within = Math.abs(t.deltaPct) <= 8;
            const isLow = t.deltaPct < -8;
            return (
              <div key={t.phase}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn("size-2.5 rounded-sm", PHASE_BG[t.phase])}
                    />
                    <span className="font-medium text-foreground">
                      {PHASE_LABELS[t.phase]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-muted-foreground">
                    <span>{Math.round(t.actualPct)}%</span>
                    <span className="text-muted-foreground/50">
                      objetivo {t.targetPct}%
                    </span>
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        within
                          ? "text-muted-foreground"
                          : isLow
                            ? "text-amber-400"
                            : "text-sky-400"
                      )}
                    >
                      {t.deltaPct >= 0 ? "+" : ""}
                      {Math.round(t.deltaPct)}
                    </span>
                  </div>
                </div>
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full",
                      PHASE_BG[t.phase]
                    )}
                    style={{ width: `${Math.min(100, t.actualPct)}%` }}
                  />
                  <div
                    className="absolute inset-y-0 w-0.5 bg-foreground/60"
                    style={{ left: `${t.targetPct}%` }}
                    title={`Objetivo: ${t.targetPct}%`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PhaseDonutCard({ analytics }: { analytics: SessionAnalytics }) {
  const data = analytics.phaseBreakdown
    .filter((p) => p.minutes > 0)
    .map((p) => ({
      name: PHASE_LABELS[p.phase],
      value: p.minutes,
      phase: p.phase,
    }));

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border/50">
        <h3 className="font-semibold text-sm text-foreground">
          Proporción de fases
        </h3>
      </div>
      <div className="p-5">
        {data.length > 0 ? (
          <div className="flex items-center gap-4">
            <div className="size-44 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={78}
                    strokeWidth={2}
                    stroke="var(--card)"
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.phase}
                        fill={PHASE_COLORS[entry.phase]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v) => [`${v} min`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-heading text-2xl font-bold text-foreground leading-none">
                  {analytics.totalMinutes}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1">
                  min totales
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              {data.map((p) => (
                <div
                  key={p.phase}
                  className="flex items-center gap-2 text-xs"
                >
                  <div
                    className="size-2.5 rounded-sm shrink-0"
                    style={{ background: PHASE_COLORS[p.phase] }}
                  />
                  <span className="text-foreground truncate">{p.name}</span>
                  <span className="text-muted-foreground font-mono ml-auto">
                    {p.value}′
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState text="Sin fases registradas." />
        )}
      </div>
    </div>
  );
}

function CategoryCard({ analytics }: { analytics: SessionAnalytics }) {
  const data = analytics.categoryBreakdown.map((c) => ({
    name: CATEGORY_LABELS[c.category],
    minutes: c.minutes,
    category: c.category,
  }));
  const hasData = data.some((d) => d.minutes > 0);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border/50">
        <h3 className="font-semibold text-sm text-foreground">
          Minutos por categoría
        </h3>
      </div>
      <div className="p-5">
        {hasData ? (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v) => [`${v} min`, ""]}
                />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                  {data.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_COLORS[entry.category]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState text="Sin datos de categorías." />
        )}
      </div>
    </div>
  );
}

function DifficultyCard({ analytics }: { analytics: SessionAnalytics }) {
  const hasData = analytics.difficultyBreakdown.some((d) => d.minutes > 0);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border/50">
        <h3 className="font-semibold text-sm text-foreground">
          Balance por dificultad
        </h3>
      </div>
      <div className="p-5 space-y-4">
        {hasData ? (
          <>
            <div className="flex h-7 rounded-lg overflow-hidden gap-px">
              {analytics.difficultyBreakdown
                .filter((d) => d.minutes > 0)
                .map((d) => (
                  <div
                    key={d.difficulty}
                    className={cn("h-full", DIFFICULTY_BG[d.difficulty])}
                    style={{ width: `${d.percentage}%` }}
                    title={`${DIFFICULTY_LABELS[d.difficulty]}: ${d.minutes} min`}
                  />
                ))}
            </div>
            <div className="space-y-2">
              {analytics.difficultyBreakdown.map((d) => (
                <div
                  key={d.difficulty}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "size-2.5 rounded-sm",
                        DIFFICULTY_BG[d.difficulty]
                      )}
                    />
                    <span className="text-foreground font-medium">
                      {DIFFICULTY_LABELS[d.difficulty]}
                    </span>
                  </div>
                  <span className="text-muted-foreground font-mono">
                    {d.minutes} min · {Math.round(d.percentage)}%
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState text="Sin dificultades asignadas." />
        )}
      </div>
    </div>
  );
}

function IntensityCurveCard({ analytics }: { analytics: SessionAnalytics }) {
  const hasIntensity = analytics.intensityCurve.some(
    (p) => p.intensity !== null
  );

  const data = analytics.intensityCurve.map((p) => ({
    x: p.midpointMinutes,
    intensity: p.intensity,
    name: p.name,
    phase: p.phase,
    duration: p.durationMinutes,
  }));

  // Phase bands for ReferenceArea
  const bands: Array<{ phase: TrainingPhase; x1: number; x2: number }> = [];
  let cursor = 0;
  for (const pt of analytics.intensityCurve) {
    const start = cursor;
    const end = cursor + pt.durationMinutes;
    const last = bands[bands.length - 1];
    if (last && last.phase === pt.phase) {
      last.x2 = end;
    } else {
      bands.push({ phase: pt.phase, x1: start, x2: end });
    }
    cursor = end;
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden lg:col-span-2">
      <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-sm text-foreground">
          Curva de intensidad
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {analytics.weightedAverageIntensity !== null && (
            <span className="inline-flex items-center gap-1 font-mono">
              <TrendingUp className="size-3" />
              Media pond. {analytics.weightedAverageIntensity.toFixed(1)}
            </span>
          )}
          {analytics.peakIntensity !== null && (
            <span className="inline-flex items-center gap-1 font-mono">
              <Zap className="size-3" />
              Pico {analytics.peakIntensity}/5
            </span>
          )}
        </div>
      </div>
      <div className="p-5">
        {hasIntensity ? (
          <>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 10, right: 16, bottom: 8, left: -20 }}
                >
                  <defs>
                    <linearGradient
                      id="intensityFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="oklch(0.73 0.19 148)"
                        stopOpacity={0.45}
                      />
                      <stop
                        offset="100%"
                        stopColor="oklch(0.73 0.19 148)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  {bands.map((b, i) => (
                    <ReferenceArea
                      key={i}
                      x1={b.x1}
                      x2={b.x2}
                      y1={0}
                      y2={5}
                      fill={PHASE_COLORS[b.phase]}
                      fillOpacity={0.05}
                      strokeOpacity={0}
                    />
                  ))}
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={[0, analytics.totalMinutes]}
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}′`}
                  />
                  <YAxis
                    domain={[0, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelFormatter={(l) => `${Math.round(Number(l))} min`}
                    formatter={(v, _n, p) => {
                      const pl = p?.payload as
                        | { name?: string; phase?: TrainingPhase }
                        | undefined;
                      const intensity =
                        v === null || v === undefined ? "—" : `${v}/5`;
                      return [
                        `${intensity} · ${pl?.name ?? ""}`,
                        pl?.phase ? PHASE_LABELS[pl.phase] : "",
                      ];
                    }}
                  />
                  {analytics.weightedAverageIntensity !== null && (
                    <ReferenceLine
                      y={analytics.weightedAverageIntensity}
                      stroke="var(--muted-foreground)"
                      strokeDasharray="4 4"
                      label={{
                        value: `Media ${analytics.weightedAverageIntensity.toFixed(1)}`,
                        position: "right",
                        fill: "var(--muted-foreground)",
                        fontSize: 10,
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="intensity"
                    stroke="oklch(0.73 0.19 148)"
                    strokeWidth={2.5}
                    fill="url(#intensityFill)"
                    connectNulls={false}
                    dot={{
                      fill: "oklch(0.73 0.19 148)",
                      r: 3.5,
                      strokeWidth: 0,
                    }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-[10px] text-muted-foreground">
              {(["activation", "main", "cooldown"] as TrainingPhase[]).map(
                (p) => (
                  <div key={p} className="flex items-center gap-1.5">
                    <div
                      className="size-2 rounded-sm opacity-60"
                      style={{ background: PHASE_COLORS[p] }}
                    />
                    <span className={PHASE_TEXT[p]}>{PHASE_LABELS[p]}</span>
                  </div>
                )
              )}
            </div>
          </>
        ) : (
          <EmptyState text="Sin intensidades registradas en los ejercicios." />
        )}
      </div>
    </div>
  );
}

export function SessionAnalyticsView({
  analytics,
}: {
  analytics: SessionAnalytics;
}) {
  const hasExercises = analytics.exerciseCount > 0;

  return (
    <div className="space-y-4">
      <HeroCard analytics={analytics} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={Clock}
          label="Duración"
          value={`${analytics.totalMinutes}′`}
          hint="minutos"
        />
        <StatCard
          icon={Dumbbell}
          label="Ejercicios"
          value={String(analytics.exerciseCount)}
        />
        <StatCard
          icon={Flame}
          label="Intensidad"
          value={
            analytics.weightedAverageIntensity !== null
              ? analytics.weightedAverageIntensity.toFixed(1)
              : "—"
          }
          hint="media ponderada"
        />
        <StatCard
          icon={Target}
          label="Fases"
          value={`${analytics.phasesCovered}/3`}
          hint="cubiertas"
        />
        <StatCard
          icon={Users}
          label="Alumnos"
          value={String(analytics.studentCount)}
        />
        <StatCard
          icon={Tag}
          label="Etiquetas"
          value={String(analytics.tagCount)}
        />
      </div>

      {!hasExercises ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="mx-auto size-10 rounded-xl bg-muted/60 flex items-center justify-center mb-3">
            <Layers className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Añade ejercicios para ver el análisis de la sesión.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PhaseTargetsCard analytics={analytics} />
          <PhaseDonutCard analytics={analytics} />
          <CategoryCard analytics={analytics} />
          <DifficultyCard analytics={analytics} />
          <IntensityCurveCard analytics={analytics} />
        </div>
      )}
    </div>
  );
}
