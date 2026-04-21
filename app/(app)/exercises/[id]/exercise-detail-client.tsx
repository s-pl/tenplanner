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
  MapPin,
  Video,
  Lightbulb,
  Package,
  ListOrdered,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ExerciseForm } from "@/components/app/exercise-form";
import { cn } from "@/lib/utils";

type Category = "technique" | "tactics" | "fitness" | "warm-up";
type Difficulty = "beginner" | "intermediate" | "advanced";
type Location = "indoor" | "outdoor" | "any";

type Phase = "activation" | "main" | "cooldown";

export interface ExerciseData {
  id: string;
  name: string;
  description: string | null;
  category: Category;
  difficulty: Difficulty;
  durationMinutes: number;
  objectives: string | null;
  steps: Array<{ title: string; description: string }> | null;
  materials: string[] | null;
  location: Location | null;
  videoUrl: string | null;
  tips: string | null;
  imageUrl: string | null;
  phase: Phase | null;
  intensity: number | null;
  isGlobal: boolean;
  isAiGenerated: boolean;
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

const LOCATION_LABELS: Record<Location, string> = {
  indoor: "🏟️ Pista cubierta",
  outdoor: "☀️ Pista exterior",
  any: "📍 Cualquier lugar",
};

export function ExerciseDetailClient({
  exercise,
  canEdit = true,
  isAdmin = false,
}: {
  exercise: ExerciseData;
  canEdit?: boolean;
  isAdmin?: boolean;
}) {
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

  if (mode === "edit" && canEdit) {
    return (
      <div className="px-4 md:px-8 py-8 space-y-6 max-w-5xl">
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
            isAdmin={isAdmin}
            initialData={{
              name: exercise.name,
              description: exercise.description,
              category: exercise.category,
              difficulty: exercise.difficulty,
              durationMinutes: exercise.durationMinutes,
              objectives: exercise.objectives,
              steps: exercise.steps,
              materials: exercise.materials,
              location: exercise.location,
              videoUrl: exercise.videoUrl,
              tips: exercise.tips,
              imageUrl: exercise.imageUrl,
              phase: exercise.phase,
              intensity: exercise.intensity,
              isGlobal: exercise.isGlobal,
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
    <div className="px-4 md:px-8 py-8 space-y-6 max-w-5xl">
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
        {canEdit && (
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
        )}
      </div>

      {/* Main card */}
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
                {exercise.location && (
                  <>
                    <span className="text-muted-foreground/50 text-xs">·</span>
                    <span className="text-xs text-muted-foreground">
                      {LOCATION_LABELS[exercise.location]}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hero image */}
        {exercise.imageUrl && (
          <div className="aspect-video w-full overflow-hidden bg-muted relative">
            <Image
              src={exercise.imageUrl}
              alt={exercise.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground leading-snug">
            {exercise.name}
          </h1>

          {exercise.objectives && (
            <div className="bg-brand/5 border border-brand/20 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-brand uppercase tracking-widest mb-1">
                Objetivo
              </p>
              <p className="text-sm text-foreground">{exercise.objectives}</p>
            </div>
          )}

          {exercise.description && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Descripción
              </p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {exercise.description}
              </p>
            </div>
          )}

          {exercise.steps && exercise.steps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ListOrdered className="size-4 text-muted-foreground" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Pasos de ejecución
                </p>
              </div>
              <div className="space-y-3">
                {exercise.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="size-6 rounded-lg bg-brand/10 text-brand text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {step.title}
                      </p>
                      {step.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exercise.materials && exercise.materials.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="size-4 text-muted-foreground" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Materiales
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {exercise.materials.map((m) => (
                  <span
                    key={m}
                    className="text-xs font-medium bg-muted text-foreground px-2.5 py-1 rounded-lg"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {exercise.tips && (
            <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Lightbulb className="size-3.5 text-amber-400" />
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Tips del entrenador
                </p>
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {exercise.tips}
              </p>
            </div>
          )}

          {exercise.videoUrl && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Vídeo de referencia
              </p>
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-brand hover:text-brand/80 transition-colors font-medium"
              >
                <Video className="size-4" />
                Ver vídeo
                <ExternalLink className="size-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
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
