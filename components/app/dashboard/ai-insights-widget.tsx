import Link from "next/link";
import {
  AlertTriangle,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Flame,
  Activity,
} from "lucide-react";
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

  const hasSomething =
    stats.sessionsThisMonth > 0 ||
    inactive.length > 0 ||
    stats.totalStudents > 0;

  if (!hasSomething) return null;

  return (
    <section
      aria-labelledby="ai-insights-heading"
      className="flex flex-col gap-4"
    >
      <div className="flex items-end justify-between gap-4 border-b border-foreground/10 pb-2">
        <div className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center border border-brand/35 bg-brand/10 text-brand">
            <Sparkles className="size-3.5" strokeWidth={1.6} />
          </span>
          <h2
            id="ai-insights-heading"
            className="font-mono text-[10px] uppercase text-foreground/55"
          >
            Insights de IA
          </h2>
        </div>
        <Link
          href="/sessions/dr-planner"
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-foreground/45 transition-colors hover:text-brand"
        >
          Abrir Dr. Planner <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {inactive.length > 0 ? (
          <Link
            href="/sessions/dr-planner"
            className={cn(
              "group border border-destructive/45 bg-destructive/10 p-4 transition-colors hover:border-destructive/70",
              "md:col-span-1"
            )}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                className="mt-0.5 size-3.5 shrink-0 text-destructive"
                strokeWidth={1.6}
              />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[9px] uppercase text-destructive">
                  Alerta
                </p>
                <p className="mt-0.5 font-heading text-[16px] leading-tight">
                  {inactive.length} alumno
                  {inactive.length !== 1 ? "s" : ""} sin entrenar
                </p>
                <p className="mt-1 text-[12px] text-foreground/65">
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
                <span className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase text-brand transition-all group-hover:gap-1.5">
                  Abordarlo <ArrowRight className="size-3" strokeWidth={2} />
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="border border-foreground/12 bg-card/75 p-4">
            <div className="flex items-center gap-2">
              <Activity className="size-3.5 text-brand" strokeWidth={1.6} />
              <p className="font-mono text-[9px] uppercase text-foreground/55">
                Estado
              </p>
            </div>
            <p className="mt-1 font-heading text-[16px] leading-tight">
              Roster al día
            </p>
            <p className="mt-1 text-[12px] text-foreground/65">
              Todos tus alumnos han entrenado en los últimos 14 días.
            </p>
          </div>
        )}

        <div className="border border-foreground/12 bg-card/75 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-3.5 text-brand" strokeWidth={1.6} />
            <p className="font-mono text-[9px] uppercase text-foreground/55">
              Actividad
            </p>
          </div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="font-heading text-4xl leading-none tabular-nums">
              {stats.sessionsThisMonth}
            </p>
            <span
              className={cn(
                "pb-1 font-mono text-[10px] tabular-nums",
                sessionDelta > 0 && "text-brand",
                sessionDelta < 0 && "text-destructive",
                sessionDelta === 0 && "text-foreground/50"
              )}
            >
              {deltaLabel} mes ant.
            </span>
          </div>
          <p className="mt-2 text-[12px] text-foreground/65">
            {stats.minutesThisMonth} min / intensidad media{" "}
            {stats.avgIntensityThisMonth !== null
              ? stats.avgIntensityThisMonth.toFixed(1)
              : "—"}
            /5
          </p>
        </div>

        <div className="border border-foreground/12 bg-card/75 p-4">
          <div className="flex items-center gap-2">
            <Flame className="size-3.5 text-brand" strokeWidth={1.6} />
            <p className="font-mono text-[9px] uppercase text-foreground/55">
              Más usado
            </p>
          </div>
          {stats.topExercises.length > 0 ? (
            <>
              <p className="mt-2 truncate font-heading text-[16px] leading-tight">
                {stats.topExercises[0].name}
              </p>
              <p className="mt-1 text-[12px] text-foreground/65">
                {stats.topExercises[0].uses} usos /{" "}
                {stats.categoryDistribution.length} categorías activas
              </p>
            </>
          ) : (
            <p className="mt-2 text-[12px] text-foreground/60">
              Aún sin datos de uso en tu biblioteca.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
