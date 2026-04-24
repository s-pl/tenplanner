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
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  technique: "border-blue-500/40 bg-blue-500/5",
  tactics: "border-purple-500/40 bg-purple-500/5",
  fitness: "border-amber-500/40 bg-amber-500/5",
  "warm-up": "border-brand/40 bg-brand/5",
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

export function ExecuteSessionClient({ session, exercises }: Props) {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showFinish, setShowFinish] = useState(false);

  const current = exercises[currentIdx];
  const totalExercises = exercises.length;
  const progress = totalExercises > 0 ? (done.size / totalExercises) * 100 : 0;

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => setTimerSeconds((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Reset timer when exercise changes
  useEffect(() => {
    setTimerSeconds(0);
    setTimerRunning(false);
  }, [currentIdx]);

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
        <p className="font-heading text-2xl text-foreground/60 italic mb-4">
          Esta sesión no tiene ejercicios.
        </p>
        <Link href={`/sessions/${session.id}`} className="text-sm text-brand border-b border-brand/30">
          Volver a la sesión
        </Link>
      </div>
    );
  }

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
          <p className="text-xs font-medium text-foreground truncate max-w-[160px]">{session.title}</p>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {currentIdx + 1} / {totalExercises}
          </p>
        </div>

        <button
          onClick={() => setShowFinish(true)}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand border border-brand/30 bg-brand/5 px-3 py-1.5 rounded-full hover:bg-brand/15 transition-colors"
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
      <main className="flex-1 flex flex-col px-4 py-6 max-w-2xl mx-auto w-full gap-6">
        {/* Category + name */}
        <div
          className={cn(
            "rounded-2xl border p-6",
            CATEGORY_COLORS[current.category] ?? "border-border bg-card"
          )}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-2">
            {CATEGORY_LABELS[current.category] ?? current.category}
          </p>
          <h1 className="font-heading text-3xl text-foreground leading-tight mb-3">
            {current.name}
          </h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {current.durationMinutes} min sugeridos
            </span>
            {done.has(current.exerciseId) && (
              <span className="flex items-center gap-1 text-brand font-medium">
                <CheckCircle2 className="size-3" />
                Completado
              </span>
            )}
          </div>
        </div>

        {/* Timer */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <span className="font-mono text-3xl tabular-nums text-foreground flex-1">
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
              onClick={() => { setTimerSeconds(0); setTimerRunning(false); }}
              className="size-11 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Reiniciar"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
        </div>

        {/* Description */}
        {current.description && (
          <div className="text-sm text-foreground/70 leading-relaxed">
            {current.description}
          </div>
        )}

        {/* Steps */}
        {current.steps.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pasos</p>
            <ol className="space-y-3">
              {current.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="size-6 rounded-full bg-muted flex items-center justify-center text-[11px] font-mono text-muted-foreground shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{step.title}</p>
                    {step.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70 mb-1">Notas</p>
            <p className="text-sm text-foreground/80">{current.notes}</p>
          </div>
        )}

        {/* Tips */}
        {current.tips && (
          <div className="bg-muted/40 border border-border rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Tips</p>
            <p className="text-sm text-foreground/70">{current.tips}</p>
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
              {isDone && !isCurrent
                ? <CheckCircle2 className="size-3.5" />
                : idx + 1}
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
          className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 active:scale-[0.98] transition-all"
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
              <h2 className="font-heading text-2xl text-foreground mb-1">¡Sesión completada!</h2>
              <p className="text-sm text-muted-foreground">
                {done.size} de {totalExercises} ejercicios realizados · {formatTime(timerSeconds)} cronometrado
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
                className="flex-1 inline-flex items-center justify-center gap-2 bg-brand text-background text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand/90 active:scale-95 transition-all disabled:opacity-60"
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
