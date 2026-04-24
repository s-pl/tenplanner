import Link from "next/link";
import { AlertTriangle, Sparkles, TrendingUp, ArrowRight, Flame } from "lucide-react";
import { findInactiveStudents, getCoachStats } from "@/lib/dr-planner/insights";
import { cn } from "@/lib/utils";

export async function AiInsightsWidget({ coachId }: { coachId: string }) {
  const [stats, inactive] = await Promise.all([
    getCoachStats(coachId),
    findInactiveStudents(coachId, 14),
  ]);

  const sessionDelta = stats.sessionsThisMonth - stats.sessionsPrevMonth;
  const deltaLabel =
    sessionDelta === 0
      ? "="
      : sessionDelta > 0
        ? `+${sessionDelta}`
        : String(sessionDelta);

  const hasSomething = stats.sessionsThisMonth > 0 || inactive.length > 0 || stats.totalStudents > 0;

  if (!hasSomething) return null;

  return (
    <section
      aria-labelledby="ai-insights-heading"
      className="space-y-4"
    >
      <div className="flex items-baseline justify-between gap-4 pb-2 border-b border-foreground/10">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-brand" strokeWidth={1.6} />
          <h2
            id="ai-insights-heading"
            className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/55"
          >
            Insights de IA
          </h2>
        </div>
        <Link
          href="/sessions/dr-planner"
          className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/45 hover:text-brand transition-colors inline-flex items-center gap-1"
        >
          Abrir Dr. Planner <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Inactive alert */}
        {inactive.length > 0 ? (
          <Link
            href="/sessions/dr-planner"
            className={cn(
              "group border border-amber-500/40 bg-amber-500/[0.06] p-4 hover:border-amber-500/60 transition-colors",
              "md:col-span-1"
            )}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                className="size-3.5 text-amber-600 shrink-0 mt-0.5"
                strokeWidth={1.6}
              />
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-amber-700">
                  Alerta
                </p>
                <p className="font-heading text-[15px] leading-tight mt-0.5">
                  {inactive.length} alumno
                  {inactive.length !== 1 ? "s" : ""} sin entrenar
                </p>
                <p className="text-[12px] text-foreground/65 mt-1">
                  {inactive
                    .slice(0, 3)
                    .map((s) =>
                      s.daysSinceLast === null
                        ? s.name
                        : `${s.name} (${s.daysSinceLast}d)`
                    )
                    .join(", ")}
                  {inactive.length > 3 && "…"}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold tracking-[0.12em] uppercase text-brand group-hover:gap-1.5 transition-all">
                  Abordarlo <ArrowRight className="size-3" strokeWidth={2} />
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="border border-foreground/15 bg-foreground/[0.02] p-4">
            <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/55">
              Estado
            </p>
            <p className="font-heading text-[15px] leading-tight mt-0.5">
              Roster al día
            </p>
            <p className="text-[12px] text-foreground/65 mt-1">
              Todos tus alumnos han entrenado en los últimos 14 días.
            </p>
          </div>
        )}

        {/* Activity trend */}
        <div className="border border-foreground/15 bg-foreground/[0.02] p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-3.5 text-brand" strokeWidth={1.6} />
            <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/55">
              Actividad
            </p>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="font-heading text-3xl tabular-nums leading-none">
              {stats.sessionsThisMonth}
            </p>
            <span
              className={cn(
                "font-sans text-[11px] tabular-nums tracking-wide",
                sessionDelta > 0 && "text-brand",
                sessionDelta < 0 && "text-destructive",
                sessionDelta === 0 && "text-foreground/50"
              )}
            >
              {deltaLabel} vs mes anterior
            </span>
          </div>
          <p className="text-[12px] text-foreground/65 mt-1">
            {stats.minutesThisMonth} min · intensidad media{" "}
            {stats.avgIntensityThisMonth !== null
              ? stats.avgIntensityThisMonth.toFixed(1)
              : "—"}
            /5
          </p>
        </div>

        {/* Top exercise / focus */}
        <div className="border border-foreground/15 bg-foreground/[0.02] p-4">
          <div className="flex items-center gap-2">
            <Flame className="size-3.5 text-brand" strokeWidth={1.6} />
            <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/55">
              Más usado
            </p>
          </div>
          {stats.topExercises.length > 0 ? (
            <>
              <p className="font-heading text-[15px] leading-tight mt-1 truncate">
                {stats.topExercises[0].name}
              </p>
              <p className="text-[12px] text-foreground/65 mt-1">
                {stats.topExercises[0].uses} usos ·{" "}
                {stats.categoryDistribution.length} categorías activas
              </p>
            </>
          ) : (
            <p className="text-[12px] text-foreground/60 mt-2">
              Aún sin datos de uso en tu biblioteca.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
