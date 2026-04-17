"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Target, Brain, Dumbbell, Flame } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Category = "technique" | "tactics" | "fitness" | "warm-up";
type Difficulty = "beginner" | "intermediate" | "advanced";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(255, "Máximo 255 caracteres"),
  description: z
    .string()
    .max(2000, "Máximo 2000 caracteres")
    .optional()
    .nullable(),
  category: z.enum(["technique", "tactics", "fitness", "warm-up"] as const, {
    required_error: "Selecciona una categoría",
  }),
  difficulty: z.enum(["beginner", "intermediate", "advanced"] as const, {
    required_error: "Selecciona una dificultad",
  }),
  durationMinutes: z.coerce
    .number({ invalid_type_error: "Introduce un número válido" })
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 minuto")
    .max(300, "Máximo 300 minutos"),
});

type FormValues = z.infer<typeof formSchema>;

const CATEGORIES: {
  id: Category;
  label: string;
  icon: React.ElementType;
  color: string;
  activeBg: string;
  activeBorder: string;
  bg: string;
  border: string;
}[] = [
  {
    id: "technique",
    label: "Técnica",
    icon: Target,
    color: "text-blue-400",
    activeBg: "bg-blue-400/15",
    activeBorder: "border-blue-400",
    bg: "bg-blue-400/5",
    border: "border-blue-400/20",
  },
  {
    id: "tactics",
    label: "Táctica",
    icon: Brain,
    color: "text-purple-400",
    activeBg: "bg-purple-400/15",
    activeBorder: "border-purple-400",
    bg: "bg-purple-400/5",
    border: "border-purple-400/20",
  },
  {
    id: "fitness",
    label: "Fitness",
    icon: Dumbbell,
    color: "text-amber-400",
    activeBg: "bg-amber-400/15",
    activeBorder: "border-amber-400",
    bg: "bg-amber-400/5",
    border: "border-amber-400/20",
  },
  {
    id: "warm-up",
    label: "Calentamiento",
    icon: Flame,
    color: "text-brand",
    activeBg: "bg-brand/15",
    activeBorder: "border-brand",
    bg: "bg-brand/5",
    border: "border-brand/20",
  },
];

const DIFFICULTIES: {
  id: Difficulty;
  label: string;
  activeColor: string;
  activeBg: string;
  activeBorder: string;
}[] = [
  {
    id: "beginner",
    label: "Principiante",
    activeColor: "text-brand",
    activeBg: "bg-brand/10",
    activeBorder: "border-brand",
  },
  {
    id: "intermediate",
    label: "Intermedio",
    activeColor: "text-amber-400",
    activeBg: "bg-amber-400/10",
    activeBorder: "border-amber-400",
  },
  {
    id: "advanced",
    label: "Avanzado",
    activeColor: "text-red-400",
    activeBg: "bg-red-400/10",
    activeBorder: "border-red-400",
  },
];

interface ExerciseFormProps {
  mode: "create" | "edit";
  exerciseId?: string;
  initialData?: {
    name?: string;
    description?: string | null;
    category?: Category;
    difficulty?: Difficulty;
    durationMinutes?: number;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExerciseForm({
  mode,
  exerciseId,
  initialData,
  onSuccess,
  onCancel,
}: ExerciseFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      category: initialData?.category,
      difficulty: initialData?.difficulty,
      durationMinutes: initialData?.durationMinutes,
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const url =
      mode === "create" ? "/api/exercises" : `/api/exercises/${exerciseId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const payload = {
      ...values,
      description: values.description?.trim() || null,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.details && Array.isArray(data.details)) {
        setServerError(
          data.details
            .map((d: { message: string }) => d.message)
            .join(". ")
        );
      } else {
        setServerError(
          data.error ?? "Ha ocurrido un error. Inténtalo de nuevo."
        );
      }
      return;
    }

    if (mode === "create") {
      router.push("/exercises");
      router.refresh();
    } else {
      onSuccess?.();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="block text-sm font-semibold text-foreground"
        >
          Nombre
        </label>
        <input
          id="name"
          type="text"
          placeholder="Ej: Bandeja cruzada"
          autoComplete="off"
          aria-invalid={!!errors.name}
          {...register("name")}
          className="w-full h-10 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-foreground">
          Categoría
        </label>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map(
                ({
                  id,
                  label,
                  icon: Icon,
                  color,
                  activeBg,
                  activeBorder,
                  bg,
                  border,
                }) => {
                  const isSelected = field.value === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => field.onChange(id)}
                      className={cn(
                        "flex flex-col items-center gap-2 px-3 py-4 rounded-xl border text-sm font-medium transition-all duration-150",
                        isSelected
                          ? `${activeBg} ${activeBorder} ${color}`
                          : `${bg} ${border} text-muted-foreground hover:text-foreground hover:bg-muted`
                      )}
                    >
                      <Icon className="size-5" />
                      {label}
                    </button>
                  );
                }
              )}
            </div>
          )}
        />
        {errors.category && (
          <p className="text-xs text-destructive">{errors.category.message}</p>
        )}
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-foreground">
          Dificultad
        </label>
        <Controller
          name="difficulty"
          control={control}
          render={({ field }) => (
            <div className="flex gap-2 flex-wrap">
              {DIFFICULTIES.map(
                ({ id, label, activeColor, activeBg, activeBorder }) => {
                  const isSelected = field.value === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => field.onChange(id)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150",
                        isSelected
                          ? `${activeBg} ${activeBorder} ${activeColor}`
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {label}
                    </button>
                  );
                }
              )}
            </div>
          )}
        />
        {errors.difficulty && (
          <p className="text-xs text-destructive">
            {errors.difficulty.message}
          </p>
        )}
      </div>

      {/* Duration */}
      <div className="space-y-1.5">
        <label
          htmlFor="durationMinutes"
          className="block text-sm font-semibold text-foreground"
        >
          Duración{" "}
          <span className="font-normal text-muted-foreground">(minutos)</span>
        </label>
        <input
          id="durationMinutes"
          type="number"
          min={1}
          max={300}
          placeholder="15"
          aria-invalid={!!errors.durationMinutes}
          {...register("durationMinutes")}
          className="w-32 h-10 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
        />
        {errors.durationMinutes && (
          <p className="text-xs text-destructive">
            {errors.durationMinutes.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label
          htmlFor="description"
          className="block text-sm font-semibold text-foreground"
        >
          Descripción{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          id="description"
          placeholder="Describe el ejercicio, cómo ejecutarlo, consejos…"
          rows={4}
          maxLength={2000}
          {...register("description")}
          className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground resize-none"
        />
        {errors.description && (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
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
          {mode === "create" ? "Crear ejercicio" : "Guardar cambios"}
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
            href="/exercises"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5"
          >
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
