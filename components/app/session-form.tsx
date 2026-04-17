"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Search,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/app/date-time-picker";

const CATEGORY_COLORS: Record<string, string> = {
  technique: "text-blue-400 bg-blue-400/10",
  tactics: "text-purple-400 bg-purple-400/10",
  fitness: "text-amber-400 bg-amber-400/10",
  "warm-up": "text-brand bg-brand/10",
};

const CATEGORY_LABELS: Record<string, string> = {
  technique: "Técnica",
  tactics: "Táctica",
  fitness: "Fitness",
  "warm-up": "Calentamiento",
};

const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "El título es obligatorio")
    .max(255, "Máximo 255 caracteres"),
  description: z
    .string()
    .max(2000, "Máximo 2000 caracteres")
    .optional()
    .nullable(),
  scheduledAt: z.string().min(1, "La fecha y hora son obligatorias"),
});

type FormValues = z.infer<typeof formSchema>;

export interface AvailableExercise {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  durationMinutes: number;
}

interface SelectedExercise {
  exerciseId: string;
  name: string;
  category: string;
  durationMinutes: number;
  overrideDuration: number | null;
}

interface SessionFormProps {
  mode: "create" | "edit";
  sessionId?: string;
  availableExercises: AvailableExercise[];
  initialData?: {
    title?: string;
    description?: string | null;
    scheduledAt?: string;
    exercises?: { exerciseId: string; durationMinutes: number; name: string; category: string }[];
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

function toDatetimeLocalValue(isoString: string): string {
  const date = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SessionForm({
  mode,
  sessionId,
  availableExercises,
  initialData,
  onSuccess,
  onCancel,
}: SessionFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>(
    () =>
      (initialData?.exercises ?? []).map((e) => ({
        exerciseId: e.exerciseId,
        name: e.name,
        category: e.category,
        durationMinutes: availableExercises.find((a) => a.id === e.exerciseId)?.durationMinutes ?? e.durationMinutes,
        overrideDuration: null,
      }))
  );

  const totalDuration = selectedExercises.reduce(
    (sum, e) => sum + (e.overrideDuration ?? e.durationMinutes),
    0
  );

  const selectedIds = new Set(selectedExercises.map((e) => e.exerciseId));

  const filteredAvailable = availableExercises.filter(
    (ex) =>
      !selectedIds.has(ex.id) &&
      ex.name.toLowerCase().includes(search.toLowerCase())
  );

  function addExercise(ex: AvailableExercise) {
    setSelectedExercises((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        name: ex.name,
        category: ex.category,
        durationMinutes: ex.durationMinutes,
        overrideDuration: null,
      },
    ]);
  }

  function removeExercise(exerciseId: string) {
    setSelectedExercises((prev) => prev.filter((e) => e.exerciseId !== exerciseId));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setSelectedExercises((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    setSelectedExercises((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      scheduledAt: initialData?.scheduledAt ? toDatetimeLocalValue(initialData.scheduledAt) : "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const url = mode === "create" ? "/api/sessions" : `/api/sessions/${sessionId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const localDate = new Date(values.scheduledAt);

    const payload = {
      title: values.title,
      description: values.description?.trim() || null,
      scheduledAt: localDate.toISOString(),
      exercises: selectedExercises.map((e) => ({
        exerciseId: e.exerciseId,
        durationMinutes: e.overrideDuration ?? null,
        notes: null,
      })),
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.details && Array.isArray(data.details)) {
        setServerError(data.details.map((d: { message: string }) => d.message).join(". "));
      } else {
        setServerError(data.error ?? "Ha ocurrido un error. Inténtalo de nuevo.");
      }
      return;
    }

    if (mode === "create") {
      router.push("/sessions");
      router.refresh();
    } else {
      onSuccess?.();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="title" className="block text-sm font-semibold text-foreground">
          Título
        </label>
        <input
          id="title"
          type="text"
          placeholder="Ej: Entrenamiento de técnica"
          autoComplete="off"
          aria-invalid={!!errors.title}
          {...register("title")}
          className="w-full h-10 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Scheduled At */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-foreground">
          Fecha y hora
        </label>
        <Controller
          name="scheduledAt"
          control={control}
          render={({ field }) => (
            <DateTimePicker
              value={field.value}
              onChange={field.onChange}
              error={!!errors.scheduledAt}
            />
          )}
        />
        {errors.scheduledAt && (
          <p className="text-xs text-destructive">{errors.scheduledAt.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-semibold text-foreground">
          Descripción{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          id="description"
          placeholder="Objetivo de la sesión, notas, etc."
          rows={3}
          maxLength={2000}
          {...register("description")}
          className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground resize-none"
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-foreground">
            Ejercicios
          </label>
          {totalDuration > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {totalDuration} min en total
            </span>
          )}
        </div>

        {/* Selected exercises */}
        {selectedExercises.length > 0 && (
          <div className="space-y-1.5">
            {selectedExercises.map((ex, idx) => (
              <div
                key={ex.exerciseId}
                className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2"
              >
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="size-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    aria-label="Subir"
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={idx === selectedExercises.length - 1}
                    className="size-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    aria-label="Bajar"
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                </div>

                <span className="text-xs text-muted-foreground w-5 text-center shrink-0 font-mono">
                  {idx + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ex.name}</p>
                  <span
                    className={cn(
                      "inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                      CATEGORY_COLORS[ex.category] ?? "text-muted-foreground bg-muted"
                    )}
                  >
                    {CATEGORY_LABELS[ex.category] ?? ex.category}
                  </span>
                </div>

                <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="size-3" />
                  {ex.overrideDuration ?? ex.durationMinutes} min
                </span>

                <button
                  type="button"
                  onClick={() => removeExercise(ex.exerciseId)}
                  className="size-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  aria-label="Quitar ejercicio"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Exercise library picker */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ejercicios…"
                className="w-full h-8 pl-8 pr-3 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto divide-y divide-border/60">
            {filteredAvailable.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                {search ? "Sin resultados" : availableExercises.length === 0 ? "No hay ejercicios en la biblioteca" : "Todos los ejercicios añadidos"}
              </p>
            ) : (
              filteredAvailable.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => addExercise(ex)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ex.name}</p>
                    <span
                      className={cn(
                        "inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                        CATEGORY_COLORS[ex.category] ?? "text-muted-foreground bg-muted"
                      )}
                    >
                      {CATEGORY_LABELS[ex.category] ?? ex.category}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="size-3" />
                    {ex.durationMinutes} min
                  </span>
                  <span className="size-6 rounded-md flex items-center justify-center bg-brand/10 text-brand opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Plus className="size-3.5" />
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {serverError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 bg-brand text-brand-foreground text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand/90 active:scale-95 transition-all duration-150 disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {mode === "create" ? "Crear sesión" : "Guardar cambios"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5"
          >
            Cancelar
          </button>
        ) : (
          <Link
            href="/sessions"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5"
          >
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
