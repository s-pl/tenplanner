"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressIndicator } from "./progress-indicator";
import { StepBasics } from "./step-basics";
import { StepObjective } from "./step-objective";
import { StepStudents } from "./step-students";
import { StepExercises } from "./step-exercises";
import type { AvailableExercise, WizardExercise, WizardState } from "./types";

const STEP_LABELS = ["Básico", "Objetivo", "Alumnos", "Ejercicios"];
const TOTAL_STEPS = STEP_LABELS.length;

interface SessionWizardProps {
  availableExercises: AvailableExercise[];
  initialExercises?: WizardExercise[];
}

function defaultScheduledAt() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function validateStep(
  step: number,
  state: WizardState
): Partial<Record<keyof WizardState, string>> {
  const errors: Partial<Record<keyof WizardState, string>> = {};
  if (step === 1) {
    if (!state.title.trim()) errors.title = "El título es obligatorio";
    else if (state.title.trim().length > 255)
      errors.title = "Máximo 255 caracteres";
    if (!state.scheduledAt)
      errors.scheduledAt = "La fecha y hora son obligatorias";
    else {
      const parsed = new Date(state.scheduledAt);
      if (isNaN(parsed.getTime())) errors.scheduledAt = "Fecha inválida";
    }
    if (
      !state.durationMinutes ||
      state.durationMinutes < 5 ||
      state.durationMinutes > 600
    ) {
      errors.durationMinutes = "Duración entre 5 y 600 minutos";
    }
  }
  if (step === 2) {
    if (
      state.intensity !== null &&
      (state.intensity < 1 || state.intensity > 5)
    ) {
      errors.intensity = "Intensidad debe ser 1-5";
    }
    if (state.tags.length > 10) errors.tags = "Máximo 10 etiquetas";
  }
  return errors;
}

export function SessionWizard({
  availableExercises,
  initialExercises,
}: SessionWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawStep = parseInt(searchParams.get("step") ?? "1", 10);
  const step =
    Number.isFinite(rawStep) && rawStep >= 1 && rawStep <= TOTAL_STEPS
      ? rawStep
      : 1;

  const [state, setState] = useState<WizardState>(() => ({
    title: "",
    scheduledAt: defaultScheduledAt(),
    durationMinutes: 60,
    location: "",
    objective: "",
    intensity: null,
    tags: [],
    studentIds: [],
    exercises: initialExercises ?? [],
  }));

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const errors = useMemo(() => validateStep(step, state), [step, state]);
  const canProceed = Object.keys(errors).length === 0;

  function update(patch: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function goToStep(next: number) {
    const clamped = Math.max(1, Math.min(TOTAL_STEPS, next));
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", String(clamped));
    router.replace(`?${params.toString()}`, { scroll: false });
    setShowErrors(false);
  }

  function onNext() {
    if (!canProceed) {
      setShowErrors(true);
      return;
    }
    goToStep(step + 1);
  }

  function onPrev() {
    goToStep(step - 1);
  }

  async function onSubmit() {
    const allErrors = {
      ...validateStep(1, state),
      ...validateStep(2, state),
    };
    if (Object.keys(allErrors).length > 0) {
      setShowErrors(true);
      goToStep(1);
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      const scheduledIso = new Date(state.scheduledAt).toISOString();
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: state.title.trim(),
          description: null,
          scheduledAt: scheduledIso,
          durationMinutes: state.durationMinutes,
          objective: state.objective.trim() || null,
          intensity: state.intensity,
          tags: state.tags.length > 0 ? state.tags : null,
          location: state.location.trim() || null,
          studentIds: state.studentIds,
          exercises: state.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            durationMinutes: e.overrideDuration ?? null,
            notes: e.notes.trim() || null,
            phase: e.phase,
            intensity: e.intensity,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          data.details?.map((d: { message: string }) => d.message).join(". ") ??
          data.error ??
          "Ha ocurrido un error.";
        setServerError(msg);
        return;
      }

      router.push("/sessions");
      router.refresh();
    } catch {
      setServerError("Error de red. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const visibleErrors = showErrors ? errors : {};

  return (
    <div className="flex flex-col gap-6 pb-28 md:pb-6">
      <ProgressIndicator step={step} total={TOTAL_STEPS} labels={STEP_LABELS} />

      <div className="min-h-[320px]">
        {step === 1 && (
          <StepBasics state={state} update={update} errors={visibleErrors} />
        )}
        {step === 2 && (
          <StepObjective state={state} update={update} errors={visibleErrors} />
        )}
        {step === 3 && <StepStudents state={state} update={update} />}
        {step === 4 && (
          <StepExercises
            state={state}
            update={update}
            availableExercises={availableExercises}
          />
        )}
      </div>

      {serverError && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      <div
        className={cn(
          "flex items-center justify-between gap-3",
          "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:bg-background/95 max-md:backdrop-blur max-md:border-t max-md:border-border max-md:px-4 max-md:py-3",
          "md:pt-4 md:border-t md:border-border/60"
        )}
      >
        {step === 1 ? (
          <Link
            href="/sessions"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5"
          >
            Cancelar
          </Link>
        ) : (
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5"
          >
            <ChevronLeft className="size-4" />
            Anterior
          </button>
        )}

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed && showErrors}
            className={cn(
              "inline-flex items-center gap-1.5 bg-brand text-brand-foreground text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-150",
              canProceed
                ? "hover:bg-brand/90 active:scale-95"
                : "opacity-60 hover:bg-brand"
            )}
          >
            Siguiente
            <ChevronRight className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-brand text-brand-foreground text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-brand/90 active:scale-95 transition-all duration-150 disabled:opacity-60"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Crear sesión
          </button>
        )}
      </div>
    </div>
  );
}
