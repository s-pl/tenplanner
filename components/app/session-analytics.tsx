"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Clock,
  Dumbbell,
  Flame,
  Layers,
  Users,
  Tag,
} from "lucide-react";
import type {
  SessionAnalytics,
  TrainingPhase,
  ExerciseCategory,
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

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}

function StatCard({ icon: Icon, label, value, hint }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className="font-heading text-2xl font-bold text-foreground leading-none">
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

export function SessionAnalyticsView({
  analytics,
}: {
  analytics: SessionAnalytics;
}) {
  const {
    totalMinutes,
    exerciseCount,
    averageIntensity,
    phasesCovered,
    studentCount,
    tagCount,
    phaseBreakdown,
    categoryBreakdown,
    intensityCurve,
  } = analytics;

  const hasExercises = exerciseCount > 0;
  const hasDuration = totalMinutes > 0;
  const hasIntensity = intensityCurve.some((p) => p.intensity !== null);
  const hasCategoryData = categoryBreakdown.some((c) => c.minutes > 0);

  const phaseChartData = phaseBreakdown
    .filter((p) => p.minutes > 0)
    .map((p) => ({
      name: PHASE_LABELS[p.phase],
      value: p.minutes,
      phase: p.phase,
    }));

  const categoryChartData = categoryBreakdown.map((c) => ({
    name: CATEGORY_LABELS[c.category],
    minutes: c.minutes,
    category: c.category,
  }));

  const intensityChartData = intensityCurve.map((p) => ({
    order: p.order,
    intensity: p.intensity,
    name: p.name,
  }));

  return (
    <div className="space-y-4">
      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={Clock}
          label="Duración"
          value={`${totalMinutes}′`}
          hint="minutos"
        />
        <StatCard
          icon={Dumbbell}
          label="Ejercicios"
          value={String(exerciseCount)}
        />
        <StatCard
          icon={Flame}
          label="Intensidad"
          value={
            averageIntensity !== null
              ? averageIntensity.toFixed(1)
              : "—"
          }
          hint="media (1-5)"
        />
        <StatCard
          icon={Layers}
          label="Fases"
          value={`${phasesCovered}/3`}
        />
        <StatCard icon={Users} label="Alumnos" value={String(studentCount)} />
        <StatCard icon={Tag} label="Etiquetas" value={String(tagCount)} />
      </div>

      {!hasExercises ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Añade ejercicios para ver el análisis de la sesión.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Phase distribution stacked bar */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden lg:col-span-2">
            <div className="px-5 py-3 border-b border-border/50">
              <h3 className="font-semibold text-sm text-foreground">
                Distribución por fases
              </h3>
            </div>
            <div className="p-5">
              {hasDuration ? (
                <div className="space-y-3">
                  <div className="flex h-8 rounded-xl overflow-hidden gap-px">
                    {phaseBreakdown
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
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {phaseBreakdown.map((p) => (
                      <div
                        key={p.phase}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div
                          className={cn(
                            "size-2.5 rounded-sm",
                            PHASE_BG[p.phase],
                          )}
                        />
                        <span className="text-foreground font-medium">
                          {PHASE_LABELS[p.phase]}
                        </span>
                        <span className="text-muted-foreground font-mono">
                          {p.minutes} min · {Math.round(p.percentage)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState text="Sin duración asignada a los ejercicios." />
              )}
            </div>
          </div>

          {/* Donut chart */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border/50">
              <h3 className="font-semibold text-sm text-foreground">
                Proporción de fases
              </h3>
            </div>
            <div className="p-5">
              {phaseChartData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="size-48 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={phaseChartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={80}
                          strokeWidth={2}
                          stroke="hsl(var(--background))"
                        >
                          {phaseChartData.map((entry) => (
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
                  </div>
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {phaseChartData.map((p) => (
                      <div
                        key={p.phase}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div
                          className="size-2.5 rounded-sm shrink-0"
                          style={{ background: PHASE_COLORS[p.phase] }}
                        />
                        <span className="text-foreground truncate">
                          {p.name}
                        </span>
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

          {/* Category breakdown */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border/50">
              <h3 className="font-semibold text-sm text-foreground">
                Minutos por categoría
              </h3>
            </div>
            <div className="p-5">
              {hasCategoryData ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData}>
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
                        {categoryChartData.map((entry) => (
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

          {/* Intensity curve */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden lg:col-span-2">
            <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">
                Curva de intensidad
              </h3>
              {averageIntensity !== null && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  Media: {averageIntensity.toFixed(1)}
                </span>
              )}
            </div>
            <div className="p-5">
              {hasIntensity ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={intensityChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="order"
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        label={{
                          value: "Orden",
                          position: "insideBottom",
                          offset: -2,
                          fill: "var(--muted-foreground)",
                          fontSize: 10,
                        }}
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
                        formatter={(v) => [
                          v === null || v === undefined
                            ? "Sin dato"
                            : `${v}/5`,
                          "Intensidad",
                        ]}
                        labelFormatter={(l) => `Ejercicio ${l}`}
                      />
                      {averageIntensity !== null && (
                        <ReferenceLine
                          y={averageIntensity}
                          stroke="var(--muted-foreground)"
                          strokeDasharray="4 4"
                          label={{
                            value: `Media ${averageIntensity.toFixed(1)}`,
                            position: "right",
                            fill: "var(--muted-foreground)",
                            fontSize: 10,
                          }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="intensity"
                        stroke="oklch(0.73 0.19 148)"
                        strokeWidth={2.5}
                        connectNulls={false}
                        dot={{ fill: "oklch(0.73 0.19 148)", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState text="Sin intensidades registradas en los ejercicios." />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
