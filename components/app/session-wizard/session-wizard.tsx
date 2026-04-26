"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DraftStatusPill } from "@/components/app/draft-status-pill";
import {
  generateDraftId,
  getSessionDraft,
  hasMeaningfulSessionDraft,
  migrateLocalStorageDrafts,
  removeSessionDraft,
  upsertSessionDraft,
  type SessionDraftPayload,
} from "@/lib/drafts";
import { defaultScheduledAt } from "./defaults";
import { ProgressIndicator } from "./progress-indicator";
import { StepConfiguration } from "./step-configuration";
import { StepExercises } from "./step-exercises";
import type { AvailableExercise, WizardExercise, WizardState } from "./types";

const STEP_LABELS = ["Configuración", "Ejercicios"];
const TOTAL_STEPS = STEP_LABELS.length;

interface SessionWizardProps {
  availableExercises: AvailableExercise[];
  initialExercises?: WizardExercise[];
  initialTitle?: string;
  initialObjective?: string;
  initialLocation?: string;
  allowDraftRestore?: boolean;
}

function validateStep(
  step: number,
  state: WizardState
): Partial<Record<keyof WizardState, string>> {
  const errors: Partial<Record<keyof WizardState, string>> = {};

  if (step === 1) {
    if (!state.title.trim()) errors.title = "El título es obligatorio";
    else if (state.title.trim().length > 255) {
      errors.title = "Máximo 255 caracteres";
    }

    if (!state.scheduledAt) {
      errors.scheduledAt = "La fecha y hora son obligatorias";
    } else {
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

    if (
      state.intensity !== null &&
      (state.intensity < 1 || state.intensity > 5)
    ) {
      errors.intensity = "Intensidad debe ser 1-5";
    }

    if (state.tags.length > 10) errors.tags = "Máximo 10 etiquetas";
  }

  if (step === 2) {
    if (state.exercises.length === 0) {
      errors.exercises = "Añade al menos un ejercicio antes de crear la sesión";
    }
  }

  return errors;
}

function isWizardExercise(value: unknown): value is WizardExercise {
  if (!value || typeof value !== "object") return false;

  const exercise = value as Partial<WizardExercise>;
  return (
    typeof exercise.exerciseId === "string" &&
    typeof exercise.name === "string" &&
    typeof exercise.category === "string" &&
    typeof exercise.durationMinutes === "number" &&
    (typeof exercise.overrideDuration === "number" ||
      exercise.overrideDuration === null) &&
    typeof exercise.notes === "string" &&
    (exercise.phase === "activation" ||
      exercise.phase === "main" ||
      exercise.phase === "cooldown" ||
      exercise.phase === null) &&
    (typeof exercise.intensity === "number" || exercise.intensity === null)
  );
}

function createInitialState({
  initialExercises,
  initialTitle,
  initialObjective,
  initialLocation,
}: Pick<
  SessionWizardProps,
  "initialExercises" | "initialTitle" | "initialObjective" | "initialLocation"
>): WizardState {
  return {
    title: initialTitle ?? "",
    scheduledAt: defaultScheduledAt(),
    durationMinutes: 60,
    location: initialLocation ?? "",
    objective: initialObjective ?? "",
    intensity: null,
    tags: [],
    studentIds: [],
    exercises: initialExercises ?? [],
  };
}

function toDraftPayload(state: WizardState): SessionDraftPayload {
  return {
    title: state.title,
    scheduledAt: state.scheduledAt,
    durationMinutes: state.durationMinutes,
    location: state.location,
    objective: state.objective,
    intensity: state.intensity,
    tags: state.tags,
    studentIds: state.studentIds,
    exercises: state.exercises,
  };
}

function sanitizeDraftPayload(
  payload: Partial<SessionDraftPayload> | null | undefined,
  fallback: WizardState
): WizardState {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  return {
    title: typeof payload.title === "string" ? payload.title : fallback.title,
    scheduledAt:
      typeof payload.scheduledAt === "string" && payload.scheduledAt
        ? payload.scheduledAt
        : fallback.scheduledAt,
    durationMinutes:
      typeof payload.durationMinutes === "number"
        ? payload.durationMinutes
        : fallback.durationMinutes,
    location:
      typeof payload.location === "string"
        ? payload.location
        : fallback.location,
    objective:
      typeof payload.objective === "string"
        ? payload.objective
        : fallback.objective,
    intensity:
      typeof payload.intensity === "number" || payload.intensity === null
        ? payload.intensity
        : fallback.intensity,
    tags: Array.isArray(payload.tags)
      ? payload.tags.filter((tag): tag is string => typeof tag === "string")
      : fallback.tags,
    studentIds: Array.isArray(payload.studentIds)
      ? payload.studentIds.filter(
          (studentId): studentId is string => typeof studentId === "string"
        )
      : fallback.studentIds,
    exercises: Array.isArray(payload.exercises)
      ? payload.exercises.filter(isWizardExercise)
      : fallback.exercises,
  };
}

export function SessionWizard({
  availableExercises,
  initialExercises,
  initialTitle,
  initialObjective,
  initialLocation,
  allowDraftRestore = true,
}: SessionWizardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawStep = parseInt(searchParams.get("step") ?? "1", 10);
  const step =
    Number.isFinite(rawStep) && rawStep >= 1 && rawStep <= TOTAL_STEPS
      ? rawStep
      : 1;
  const initialStateRef = useRef<WizardState | null>(null);
  if (!initialStateRef.current) {
    initialStateRef.current = createInitialState({
      initialExercises,
      initialTitle,
      initialObjective,
      initialLocation,
    });
  }
  const baselineState = initialStateRef.current;

  const [state, setState] = useState<WizardState>(baselineState);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const draftReadyRef = useRef(false);
  const draftIdRef = useRef<string | null>(null);
  const baselinePayloadRef = useRef<SessionDraftPayload>(
    toDraftPayload(baselineState)
  );
  const saveTimerRef = useRef<number | null>(null);

  // One-time mount hydration — intentionally empty deps to avoid re-running
  // when the URL is updated by the auto-save effect below.
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const params = new URLSearchParams(window.location.search);
      const restoredDraftId = params.get("draft");

      if (!restoredDraftId && allowDraftRestore) {
        await migrateLocalStorageDrafts();
      }

      if (restoredDraftId) {
        const draft = await getSessionDraft(restoredDraftId);
        if (cancelled) return;

        if (draft) {
          draftReadyRef.current = false;
          draftIdRef.current = restoredDraftId;
          setHasDraft(true);
          setState(
            sanitizeDraftPayload(
              draft.payload,
              initialStateRef.current ?? baselineState
            )
          );
          window.setTimeout(() => {
            if (!cancelled) draftReadyRef.current = true;
          }, 0);
        } else {
          // Draft param in URL but no matching draft — clean up
          draftIdRef.current = null;
          const cleanParams = new URLSearchParams(window.location.search);
          cleanParams.delete("draft");
          const next = cleanParams.toString();
          window.history.replaceState(
            null,
            "",
            next
              ? `${window.location.pathname}?${next}`
              : window.location.pathname
          );
          draftReadyRef.current = true;
        }
      } else {
        draftReadyRef.current = true;
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const draftPayload = useMemo(() => toDraftPayload(state), [state]);

  // Debounced auto-save — uses window.history.replaceState instead of router.replace
  // to avoid triggering searchParams changes that would re-run this effect.
  useEffect(() => {
    if (!draftReadyRef.current) return;

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;

      if (
        !hasMeaningfulSessionDraft(draftPayload, baselinePayloadRef.current)
      ) {
        if (draftIdRef.current) {
          void removeSessionDraft(draftIdRef.current);
          draftIdRef.current = null;
          setHasDraft(false);
          const params = new URLSearchParams(window.location.search);
          if (params.has("draft")) {
            params.delete("draft");
            const next = params.toString();
            window.history.replaceState(
              null,
              "",
              next
                ? `${window.location.pathname}?${next}`
                : window.location.pathname
            );
          }
        }
        return;
      }

      let nextDraftId = draftIdRef.current;
      if (!nextDraftId) {
        nextDraftId = generateDraftId();
        draftIdRef.current = nextDraftId;
        setHasDraft(true);
        const params = new URLSearchParams(window.location.search);
        params.set("draft", nextDraftId);
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}?${params.toString()}`
        );
      }

      setSaveStatus("saving");
      void upsertSessionDraft({
        id: nextDraftId,
        title: draftPayload.title.trim() || "Sesión sin título",
        updatedAt: new Date().toISOString(),
        payload: draftPayload,
      }).then(() => {
        setSaveStatus("saved");
        setSavedAt(new Date());
      });
    }, 800);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [draftPayload]);

  const errors = useMemo(() => validateStep(step, state), [step, state]);
  const canProceed = Object.keys(errors).length === 0;

  function update(patch: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function goToStep(next: number) {
    const clamped = Math.max(1, Math.min(TOTAL_STEPS, next));
    // Read from window.location.search so the draft param set via history.replaceState is preserved
    const params = new URLSearchParams(window.location.search);
    params.set("step", String(clamped));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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
    const allErrors = validateStep(1, state);
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
          exercises: state.exercises.map((exercise) => ({
            exerciseId: exercise.exerciseId,
            durationMinutes: exercise.overrideDuration ?? null,
            notes: exercise.notes.trim() || null,
            phase: exercise.phase,
            intensity: exercise.intensity,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          data.details
            ?.map((detail: { message: string }) => detail.message)
            .join(". ") ??
          data.error ??
          "Ha ocurrido un error.";
        setServerError(msg);
        return;
      }

      if (draftIdRef.current) {
        void removeSessionDraft(draftIdRef.current);
        draftIdRef.current = null;
        setHasDraft(false);
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
    <div className="flex flex-col gap-8 pb-28 md:pb-6">
      {/* Header: step indicator + draft status */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <ProgressIndicator
          step={step}
          total={TOTAL_STEPS}
          labels={STEP_LABELS}
        />
        <DraftStatusPill
          status={saveStatus}
          savedAt={savedAt}
          className="mt-1 sm:shrink-0"
        />
      </div>

      {/* Step heading */}
      <div className="space-y-1">
        <h2 className="font-heading text-2xl font-semibold text-foreground">
          {step === 1 ? "Configura tu sesión" : "Añade ejercicios"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {step === 1
            ? "Define los datos básicos de la sesión de entrenamiento."
            : "Selecciona y ordena los ejercicios del plan."}
        </p>
      </div>

      <div className="min-h-[320px]">
        {step === 1 ? (
          <StepConfiguration
            state={state}
            update={update}
            errors={visibleErrors}
          />
        ) : (
          <StepExercises
            state={state}
            update={update}
            availableExercises={availableExercises}
          />
        )}
      </div>

      {showErrors && visibleErrors.exercises ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3">
          <p className="text-sm font-medium text-destructive">
            {visibleErrors.exercises}
          </p>
        </div>
      ) : null}

      {serverError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3">
          <p className="text-sm font-medium text-destructive">{serverError}</p>
        </div>
      ) : null}

      {/* Navigation bar */}
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:border-t max-md:border-border max-md:bg-background/95 max-md:px-4 max-md:py-3 max-md:backdrop-blur",
          "md:border-t md:border-border/50 md:pt-5"
        )}
      >
        {step === 1 ? (
          <Link
            href="/sessions"
            className="px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancelar
          </Link>
        ) : (
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Atrás
          </button>
        )}

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={onNext}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-brand-foreground shadow-sm transition-all duration-150",
              canProceed
                ? "hover:bg-brand/90 active:scale-95"
                : "opacity-55 cursor-not-allowed"
            )}
          >
            Siguiente
            <ChevronRight className="size-4" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            {state.exercises.length > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
                {state.exercises.length} ejercicio
                {state.exercises.length !== 1 ? "s" : ""}
                {" · "}
                {state.exercises.reduce(
                  (sum, e) => sum + (e.overrideDuration ?? e.durationMinutes),
                  0
                )}{" "}
                min
              </span>
            )}
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || state.exercises.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-brand-foreground shadow-sm transition-all duration-150 hover:bg-brand/90 active:scale-95 disabled:opacity-55"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Crear sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
