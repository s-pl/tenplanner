"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  Loader2,
  Clock,
  Target,
  Brain,
  Dumbbell,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { ExerciseForm } from "@/components/app/exercise-form";

type Category = "technique" | "tactics" | "fitness" | "warm-up";
type Difficulty = "beginner" | "intermediate" | "advanced";

export interface ExerciseData {
  id: string;
  name: string;
  description: string | null;
  category: Category;
  difficulty: Difficulty;
  durationMinutes: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_META: Record<
  Category,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  technique: {
    label: "Técnica",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    icon: Target,
  },
  tactics: {
    label: "Táctica",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    icon: Brain,
  },
  fitness: {
    label: "Fitness",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    icon: Dumbbell,
  },
  "warm-up": {
    label: "Calentamiento",
    color: "text-brand",
    bg: "bg-brand/10",
    icon: Flame,
  },
};

const DIFFICULTY_META: Record<Difficulty, { label: string; color: string }> = {
  beginner: { label: "Principiante", color: "text-brand" },
  intermediate: { label: "Intermedio", color: "text-amber-400" },
  advanced: { label: "Avanzado", color: "text-red-400" },
};

export function ExerciseDetailClient({ exercise }: { exercise: ExerciseData }) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const cat = CATEGORY_META[exercise.category];
  const diff = DIFFICULTY_META[exercise.difficulty];
  const CategoryIcon = cat.icon;

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch(`/api/exercises/${exercise.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setDeleteError("No se pudo eliminar el ejercicio. Inténtalo de nuevo.");
      setDeleting(false);
      return;
    }
    router.push("/exercises");
    router.refresh();
  }

  if (mode === "edit") {
    return (
      <div className="px-6 md:px-8 py-8 space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMode("view")}
            className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Editar ejercicio
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Modifica los datos del ejercicio
            </p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <ExerciseForm
            mode="edit"
            exerciseId={exercise.id}
            initialData={{
              name: exercise.name,
              description: exercise.description,
              category: exercise.category,
              difficulty: exercise.difficulty,
              durationMinutes: exercise.durationMinutes,
            }}
            onSuccess={() => {
              setMode("view");
              router.refresh();
            }}
            onCancel={() => setMode("view")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-8 py-8 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/exercises"
            className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <p className="text-xs text-muted-foreground font-medium truncate">
            Biblioteca de Ejercicios
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMode("edit")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground border border-border px-3 py-2 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
          >
            <Pencil className="size-3.5" />
            <span className="hidden sm:inline">Editar</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive border border-destructive/30 px-3 py-2 rounded-lg hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="size-3.5" />
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>
      </div>

      {/* Exercise card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Category stripe */}
        <div className={`${cat.bg} px-6 py-5 border-b border-border/50`}>
          <div className="flex items-center gap-3">
            <div
              className={`size-11 rounded-xl ${cat.bg} border border-current/10 flex items-center justify-center shrink-0`}
            >
              <CategoryIcon className={`size-5 ${cat.color}`} />
            </div>
            <div>
              <p
                className={`text-xs font-bold ${cat.color} uppercase tracking-widest`}
              >
                {cat.label}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-medium ${diff.color}`}>
                  {diff.label}
                </span>
                <span className="text-muted-foreground/50 text-xs">·</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {exercise.durationMinutes} min
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground leading-snug">
            {exercise.name}
          </h1>

          {exercise.description ? (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Descripción
              </p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {exercise.description}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Sin descripción.
            </p>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-start gap-4 mb-5">
              <div className="size-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="size-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">
                  Eliminar ejercicio
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  ¿Seguro que quieres eliminar{" "}
                  <span className="font-medium text-foreground">
                    {exercise.name}
                  </span>
                  ? Esta acción no se puede deshacer.
                </p>
              </div>
              <button
                onClick={() => !deleting && setShowDeleteConfirm(false)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            {deleteError && (
              <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                <p className="text-xs text-destructive">{deleteError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => !deleting && setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 text-sm font-medium text-muted-foreground border border-border px-4 py-2.5 rounded-xl hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-destructive text-destructive-foreground text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-destructive/90 active:scale-95 transition-all duration-150 disabled:opacity-60"
              >
                {deleting && <Loader2 className="size-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
