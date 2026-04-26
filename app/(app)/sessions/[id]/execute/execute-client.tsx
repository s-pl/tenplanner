"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  X,
  Play,
  Pause,
  SkipForward,
  Flag,
  Loader2,
  RotateCcw,
  Package,
  Timer,
  ChevronRight,
  Dumbbell,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  technique: "border-blue-500/40 bg-blue-500/5",
  tactics: "border-purple-500/40 bg-purple-500/5",
  fitness: "border-amber-500/40 bg-amber-500/5",
  "warm-up": "border-brand/40 bg-brand/5",
};

const CATEGORY_ACCENT: Record<string, string> = {
  technique: "text-blue-400",
  tactics: "text-purple-400",
  fitness: "text-amber-400",
  "warm-up": "text-brand",
};

const CATEGORY_LABELS: Record<string, string> = {
  technique: "Técnica",
  tactics: "Táctica",
  fitness: "Fitness",
  "warm-up": "Calentamiento",
};

interface ExerciseData {
  exerciseId: string;
  name: string;
  category: string;
  difficulty: string;
  description: string | null;
  durationMinutes: number;
  notes: string | null;
  orderIndex: number;
  steps: Array<{ title: string; description: string }>;
  tips: string | null;
  materials: string[];
}

interface SessionData {
  id: string;
  title: string;
  durationMinutes: number;
  scheduledAt: string;
  status: string;
}

interface Props {
  session: SessionData;
  exercises: ExerciseData[];
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(isoString: string) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}

export function ExecuteSessionClient({ session, exercises }: Props) {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [countdownMode, setCountdownMode] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showFinish, setShowFinish] = useState(false);

  const current = exercises[currentIdx];
  const totalExercises = exercises.length;
  const progress = totalExercises > 0 ? (done.size / totalExercises) * 100 : 0;

  const allMaterials = Array.from(
    new Set(exercises.flatMap((e) => e.materials ?? []))
  );

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((t) => {
        if (countdownMode && t <= 0) {
          setTimerRunning(false);
          return 0;
        }
        return countdownMode ? t - 1 : t + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, countdownMode]);

  // Reset timer when exercise changes
  useEffect(() => {
    if (!started) return;
    setTimerRunning(false);
    if (countdownMode && current) {
      setTimerSeconds((current.durationMinutes ?? 0) * 60);
    } else {
      setTimerSeconds(0);
    }
  }, [currentIdx, started]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleCountdown() {
    const next = !countdownMode;
    setCountdownMode(next);
    setTimerRunning(false);
    if (next && current) {
      setTimerSeconds((current.durationMinutes ?? 0) * 60);
    } else {
      setTimerSeconds(0);
    }
  }

  function markDone(exerciseId: string) {
    setDone((prev) => {
      const next = new Set(prev);
      next.add(exerciseId);
      return next;
    });
  }

  function goNext() {
    if (current) markDone(current.exerciseId);
    if (currentIdx < totalExercises - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setShowFinish(true);
    }
  }

  function goPrev() {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  }

  async function handleFinish() {
    setFinishing(true);
    if (current) markDone(current.exerciseId);
    await fetch(`/api/sessions/${session.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    router.push(`/sessions/${session.id}`);
    router.refresh();
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Dumbbell className="size-10 text-muted-foreground/40 mb-4" />
        <p className="font-heading text-2xl text-foreground/60 italic mb-2">
          Esta sesión no tiene ejercicios.
        </p>
        <Link
          href={`/sessions/${session.id}`}
          className="text-sm text-brand border-b border-brand/30 mt-2"
        >
          Volver a la sesión
        </Link>
      </div>
    );
  }

  // ── Preparation screen ──────────────────────────────────────────────
  if (!started) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur">
          <Link
            href={`/sessions/${session.id}`}
            className="size-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </Link>
          <p className="text-xs font-semibold text-foreground truncate max-w-[200px]">
            {session.title}
          </p>
          <div className="w-9" />
        </header>

        <main className="flex-1 flex flex-col px-4 py-8 max-w-xl mx-auto w-full gap-8">
          {/* Session overview */}
          <div className="text-center space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand">
              Preparación
            </p>
            <h1 className="font-heading text-3xl font-semibold text-foreground leading-tight">
              {session.title}
            </h1>
            <p className="text-sm text-muted-foreground">{formatDate(session.scheduledAt)}</p>
            <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-brand" />
                {session.durationMinutes} min
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="flex items-center gap-1.5">
                <Dumbbell className="size-3.5 text-brand" />
                {totalExercises} ejercicio{totalExercises !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Materials checklist */}
          {allMaterials.length > 0 && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
                <Package className="size-4 text-brand" />
                <h2 className="text-sm font-bold text-foreground">
                  Material necesario
                </h2>
                <span className="ml-auto text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  {allMaterials.length}
                </span>
              </div>
              <div className="px-5 py-4 flex flex-wrap gap-2">
                {allMaterials.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand/10 text-brand border border-brand/20 px-3 py-1.5 rounded-full"
                  >
                    <Package className="size-3 opacity-70" />
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Exercise list preview */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border/50">
              <h2 className="text-sm font-bold text-foreground">Ejercicios</h2>
            </div>
            <div className="divide-y divide-border/50">
              {exercises.map((ex, idx) => (
                <div key={ex.exerciseId} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-[10px] font-mono text-muted-foreground/50 w-4 shrink-0 text-right">
                    {idx + 1}
                  </span>
                  <div
                    className={cn(
                      "w-1 h-7 rounded-full shrink-0",
                      ex.category === "technique" && "bg-blue-400",
                      ex.category === "tactics" && "bg-purple-400",
                      ex.category === "fitness" && "bg-amber-400",
                      ex.category === "warm-up" && "bg-brand",
                      !["technique", "tactics", "fitness", "warm-up"].includes(ex.category) && "bg-muted"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ex.name}</p>
                    <p className={cn("text-[10px] font-semibold", CATEGORY_ACCENT[ex.category] ?? "text-muted-foreground")}>
                      {CATEGORY_LABELS[ex.category] ?? ex.category}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {ex.durationMinutes} min
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="px-4 py-5 border-t border-border pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <button
            onClick={() => setStarted(true)}
            className="w-full h-14 flex items-center justify-center gap-2.5 rounded-2xl bg-brand text-brand-foreground font-bold text-base shadow-sm hover:bg-brand/90 active:scale-[0.98] transition-all"
          >
            <Play className="size-5 translate-x-0.5" />
            Comenzar sesión
          </button>
        </footer>
      </div>
    );
  }

  // ── Session in progress ─────────────────────────────────────────────
  const countdownPct =
    countdownMode && current
      ? Math.min(100, (timerSeconds / (current.durationMinutes * 60)) * 100)
      : 0;
  const isOvertime = countdownMode && timerSeconds === 0 && timerRunning === false && done.has(current?.exerciseId ?? "");

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur">
        <Link
          href={`/sessions/${session.id}`}
          className="size-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="size-4" />
        </Link>

        <div className="text-center">
          <p className="text-xs font-semibold text-foreground truncate max-w-[160px]">{session.title}</p>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {currentIdx + 1} / {totalExercises}
          </p>
        </div>

        <button
          onClick={() => setShowFinish(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand border border-brand/30 bg-brand/5 px-3 py-1.5 rounded-full hover:bg-brand/15 transition-colors"
        >
          <Flag className="size-3" />
          Terminar
        </button>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-border">
        <div
          className="h-full bg-brand transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Exercise content */}
      <main className="flex-1 flex flex-col px-4 py-6 max-w-2xl mx-auto w-full gap-5">
        {/* Category + name */}
        <div
          className={cn(
            "rounded-2xl border p-6",
            CATEGORY_COLORS[current.category] ?? "border-border bg-card"
          )}
        >
          <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-2", CATEGORY_ACCENT[current.category] ?? "text-brand")}>
            {CATEGORY_LABELS[current.category] ?? current.category}
          </p>
          <h1 className="font-heading text-3xl text-foreground leading-tight mb-3">
            {current.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {current.durationMinutes} min sugeridos
            </span>
            {done.has(current.exerciseId) && (
              <span className="flex items-center gap-1 text-brand font-semibold">
                <CheckCircle2 className="size-3" />
                Completado
              </span>
            )}
          </div>
        </div>

        {/* Timer */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Countdown progress bar */}
          {countdownMode && (
            <div className="h-1 bg-border">
              <div
                className={cn(
                  "h-full transition-all duration-1000",
                  countdownPct > 30 ? "bg-brand" : countdownPct > 10 ? "bg-amber-400" : "bg-red-400"
                )}
                style={{ width: `${countdownPct}%` }}
              />
            </div>
          )}
          <div className="p-5 flex items-center gap-4">
            <span
              className={cn(
                "font-mono text-3xl tabular-nums flex-1",
                countdownMode && timerSeconds === 0 ? "text-red-400" : "text-foreground"
              )}
            >
              {formatTime(timerSeconds)}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimerRunning((r) => !r)}
                className="size-11 flex items-center justify-center rounded-xl bg-brand text-background hover:bg-brand/90 active:scale-95 transition-all"
                aria-label={timerRunning ? "Pausar" : "Iniciar"}
              >
                {timerRunning ? <Pause className="size-5" /> : <Play className="size-5 translate-x-0.5" />}
              </button>
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(countdownMode ? current.durationMinutes * 60 : 0);
                }}
                className="size-11 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Reiniciar"
              >
                <RotateCcw className="size-4" />
              </button>
              <button
                onClick={toggleCountdown}
                title={countdownMode ? "Cambiar a cronómetro" : "Cambiar a cuenta atrás"}
                className={cn(
                  "size-11 flex items-center justify-center rounded-xl border transition-colors",
                  countdownMode
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                aria-label={countdownMode ? "Modo cronómetro" : "Modo cuenta atrás"}
              >
                <Timer className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Materials for this exercise */}
        {current.materials && current.materials.length > 0 && (
          <div className="flex items-start gap-3 px-4 py-3 bg-muted/30 border border-border/50 rounded-xl">
            <Package className="size-4 text-brand mt-0.5 shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {current.materials.map((m) => (
                <span
                  key={m}
                  className="text-[11px] font-semibold bg-brand/10 text-brand px-2 py-1 rounded-full"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {current.description && (
          <div className="text-sm text-foreground/70 leading-relaxed">
            {current.description}
          </div>
        )}

        {/* Steps */}
        {current.steps.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Pasos
            </p>
            <ol className="space-y-3">
              {current.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="size-6 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-[11px] font-bold text-brand shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    {step.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Coach notes */}
        {current.notes && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70 mb-1.5">
              Notas del entrenador
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">{current.notes}</p>
          </div>
        )}

        {/* Tips */}
        {current.tips && (
          <div className="bg-muted/40 border border-border rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Tips</p>
            <p className="text-sm text-foreground/70 leading-relaxed">{current.tips}</p>
          </div>
        )}
      </main>

      {/* Exercise index strip */}
      <div className="flex items-center gap-1.5 px-4 py-3 overflow-x-auto border-t border-border scrollbar-none">
        {exercises.map((ex, idx) => {
          const isDone = done.has(ex.exerciseId);
          const isCurrent = idx === currentIdx;
          return (
            <button
              key={ex.exerciseId}
              onClick={() => setCurrentIdx(idx)}
              title={ex.name}
              className={cn(
                "shrink-0 size-8 rounded-full text-[10px] font-mono transition-all flex items-center justify-center",
                isCurrent
                  ? "bg-brand text-background ring-2 ring-brand ring-offset-2 ring-offset-background"
                  : isDone
                    ? "bg-brand/15 text-brand border border-brand/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/60"
              )}
            >
              {isDone && !isCurrent ? <CheckCircle2 className="size-3.5" /> : idx + 1}
            </button>
          );
        })}
      </div>

      {/* Bottom nav */}
      <footer className="flex items-center gap-3 px-4 py-4 border-t border-border pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button
          onClick={goPrev}
          disabled={currentIdx === 0}
          className="size-12 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="size-5" />
        </button>

        <button
          onClick={goNext}
          className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-foreground text-background font-bold text-sm hover:bg-foreground/90 active:scale-[0.98] transition-all"
        >
          {currentIdx < totalExercises - 1 ? (
            <>
              <SkipForward className="size-4" />
              Siguiente
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" />
              Completar sesión
            </>
          )}
        </button>
      </footer>

      {/* Finish modal */}
      {showFinish && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !finishing && setShowFinish(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-6">
              <div className="size-14 rounded-full bg-brand/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="size-7 text-brand" />
              </div>
              <h2 className="font-heading text-2xl text-foreground mb-1">
                ¡Sesión completada!
              </h2>
              <p className="text-sm text-muted-foreground">
                {done.size} de {totalExercises} ejercicios realizados
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinish(false)}
                disabled={finishing}
                className="flex-1 text-sm font-medium text-muted-foreground border border-border px-4 py-2.5 rounded-xl hover:bg-muted transition-colors"
              >
                Seguir
              </button>
              <button
                onClick={handleFinish}
                disabled={finishing}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-brand text-background text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-brand/90 active:scale-95 transition-all disabled:opacity-60"
              >
                {finishing && <Loader2 className="size-4 animate-spin" />}
                Guardar y salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
