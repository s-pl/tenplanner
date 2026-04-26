"use client";

import { useEffect, useState } from "react";
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
  Video,
  Lightbulb,
  Package,
  ListOrdered,
  ExternalLink,
  BookMarked,
  CalendarPlus,
  Shuffle,
  Lock,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ExerciseForm } from "@/components/app/exercise-form";
import { ExerciseRating } from "@/components/app/exercise-rating";
import { ExerciseListPicker } from "@/components/app/exercise-list-picker";
import { cn } from "@/lib/utils";

type Category = "technique" | "tactics" | "fitness" | "warm-up";
type Difficulty = "beginner" | "intermediate" | "advanced";
type Location = "indoor" | "outdoor" | "any";
type Phase = "activation" | "main" | "cooldown";
type Formato = "individual" | "parejas" | "grupal" | "multigrupo";
type TipoActividad =
  | "tecnico_tactico"
  | "fisico"
  | "cognitivo"
  | "competitivo"
  | "ludico";
type TipoPelota = "normal" | "lenta" | "rapida" | "sin_pelota";

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
  imageUrls: string[] | null;
  variantes: string | null;
  formato: Formato | null;
  numJugadores: number | null;
  tipoPelota: TipoPelota | null;
  tipoActividad: TipoActividad | null;
  golpes: string[] | null;
  efecto: string[] | null;
  phase: Phase | null;
  intensity: number | null;
  isGlobal: boolean;
  isAiGenerated: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SavedListSummary {
  id: string;
  name: string;
  emoji: string | null;
  itemsCount?: number;
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

const FORMATO_LABELS: Record<Formato, string> = {
  individual: "Individual",
  parejas: "Parejas",
  grupal: "Grupal",
  multigrupo: "Multigrupo",
};

const TIPO_ACTIVIDAD_LABELS: Record<TipoActividad, string> = {
  tecnico_tactico: "Técnico-táctico",
  fisico: "Físico",
  cognitivo: "Cognitivo",
  competitivo: "Competitivo",
  ludico: "Lúdico",
};

const TIPO_PELOTA_LABELS: Record<TipoPelota, string> = {
  normal: "Normal",
  lenta: "Lenta",
  rapida: "Rápida",
  sin_pelota: "Sin pelota",
};

const GOLPE_LABELS: Record<string, string> = {
  derecha: "Derecha",
  reves: "Revés",
  globo: "Globo",
  smash: "Smash",
  bandeja: "Bandeja",
  volea_dcha: "Volea dcha.",
  volea_rev: "Volea rev.",
  bajada_pared: "Bajada pared",
  vibora: "Víbora",
  saque: "Saque",
  chiquita: "Chiquita",
  dejada: "Dejada",
};

const EFECTO_LABELS: Record<string, string> = {
  liftado: "Liftado",
  cortado: "Cortado",
  plano: "Plano",
  sin_efecto: "Sin efecto",
};

export function ExerciseDetailClient({
  exercise,
  canEdit = false,
  isAdmin = false,
  userId = null,
  initialRating = null,
  ratingAvg = null,
  ratingTotal = 0,
}: {
  exercise: ExerciseData;
  canEdit?: boolean;
  isAdmin?: boolean;
  userId?: string | null;
  initialRating?: number | null;
  ratingAvg?: number | null;
  ratingTotal?: number;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showListPicker, setShowListPicker] = useState(false);
  const [savedInLists, setSavedInLists] = useState<SavedListSummary[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const cat = CATEGORY_META[exercise.category];
  const diff = DIFFICULTY_META[exercise.difficulty];
  const CategoryIcon = cat.icon;

  async function refreshSavedLists() {
    if (!userId) return;

    setLoadingLists(true);
    try {
      const res = await fetch(
        `/api/exercise-lists?exerciseId=${encodeURIComponent(exercise.id)}`,
        { cache: "no-store" }
      );
      const payload = (await res.json().catch(() => ({}))) as {
        data?: Array<{
          id: string;
          name: string;
          emoji: string | null;
          itemsCount?: number;
          containsExercise?: boolean;
        }>;
      };

      setSavedInLists(
        Array.isArray(payload.data)
          ? payload.data
              .filter((list) => list.containsExercise)
              .map((list) => ({
                id: list.id,
                name: list.name,
                emoji: list.emoji,
                itemsCount: list.itemsCount ?? 0,
              }))
          : []
      );
    } finally {
      setLoadingLists(false);
    }
  }

  useEffect(() => {
    void refreshSavedLists();
  }, [exercise.id, userId]);

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
              imageUrls: exercise.imageUrls,
              variantes: exercise.variantes,
              formato: exercise.formato,
              numJugadores: exercise.numJugadores,
              tipoPelota: exercise.tipoPelota,
              tipoActividad: exercise.tipoActividad,
              golpes: exercise.golpes,
              efecto: exercise.efecto,
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

  const hasParams =
    exercise.formato ||
    exercise.numJugadores ||
    exercise.tipoPelota ||
    exercise.tipoActividad ||
    (exercise.golpes && exercise.golpes.length > 0) ||
    (exercise.efecto && exercise.efecto.length > 0);

  return (
    <div className="max-w-5xl space-y-6 px-4 py-8 sm:px-6 md:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
        {canEdit ? (
          <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
            <button
              onClick={() => setMode("edit")}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex-none"
            >
              <Pencil className="size-3.5" />
              <span className="hidden sm:inline">Editar</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 sm:flex-none"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          </div>
        ) : userId && exercise.isGlobal && !isAdmin ? (
          <div className="flex w-full items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground sm:w-auto sm:shrink-0">
            <ShieldAlert className="size-3.5 shrink-0" strokeWidth={1.6} />
            <span className="hidden sm:inline">
              Solo administradores pueden modificar ejercicios globales
            </span>
            <span className="sm:hidden">Solo admins</span>
          </div>
        ) : null}
      </div>

      {/* Main card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Category stripe */}
        <div
          className={`${cat.bg} border-b border-border/50 px-4 py-5 sm:px-6`}
        >
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
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
                {exercise.intensity && (
                  <>
                    <span className="text-muted-foreground/50 text-xs">·</span>
                    <span className="text-xs text-muted-foreground">
                      Intensidad {exercise.intensity}/5
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
        <div className="space-y-6 p-4 sm:p-6">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground leading-snug">
            {exercise.name}
          </h1>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {userId && (
              <>
                <button
                  type="button"
                  onClick={() => setShowListPicker(true)}
                  className="inline-flex items-center gap-2 text-sm font-medium border border-border px-4 py-2 rounded-xl hover:bg-muted transition-colors text-foreground"
                >
                  <BookMarked className="size-4 text-brand" strokeWidth={1.6} />
                  {savedInLists.length > 0
                    ? `En ${savedInLists.length} lista${savedInLists.length !== 1 ? "s" : ""}`
                    : "Guardar"}
                </button>
                <Link
                  href={`/sessions/new?exercises=${exercise.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium border border-border px-4 py-2 rounded-xl hover:bg-muted transition-colors text-foreground"
                >
                  <CalendarPlus
                    className="size-4 text-brand"
                    strokeWidth={1.6}
                  />
                  Añadir a sesión
                </Link>
              </>
            )}
            {!userId && (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium border border-brand/40 bg-brand/5 text-brand px-4 py-2 rounded-xl hover:bg-brand/10 transition-colors"
              >
                <Lock className="size-3.5" strokeWidth={1.8} />
                Inicia sesión para guardar
              </Link>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <ExerciseRating
              exerciseId={exercise.id}
              initialRating={initialRating}
              avgRating={ratingAvg ?? 0}
              totalRatings={ratingTotal}
              readonly={!userId}
            />
          </div>

          {userId ? (
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    En tus listas
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {savedInLists.length > 0
                      ? "Este ejercicio ya está organizado dentro de tus colecciones."
                      : "Todavía no está en ninguna lista. Guárdalo para recuperarlo más rápido."}
                  </p>
                </div>
                {loadingLists ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : null}
              </div>

              {savedInLists.length > 0 ? (
                <>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {savedInLists.map((list) => (
                      <span
                        key={list.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                      >
                        <span>{list.emoji ?? "📋"}</span>
                        <span>{list.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {list.itemsCount ?? 0}
                        </span>
                      </span>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link
                      href="/exercises?view=lists"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:text-brand/80"
                    >
                      Ver todas tus listas
                      <ExternalLink className="size-3.5" />
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {/* Params badges */}
          {hasParams && (
            <div className="flex flex-wrap gap-2">
              {exercise.formato && (
                <span className="text-xs font-medium bg-muted text-foreground px-2.5 py-1 rounded-lg">
                  👥 {FORMATO_LABELS[exercise.formato]}
                </span>
              )}
              {exercise.numJugadores && (
                <span className="text-xs font-medium bg-muted text-foreground px-2.5 py-1 rounded-lg">
                  {exercise.numJugadores} jugadores
                </span>
              )}
              {exercise.tipoActividad && (
                <span className="text-xs font-medium bg-muted text-foreground px-2.5 py-1 rounded-lg">
                  {TIPO_ACTIVIDAD_LABELS[exercise.tipoActividad]}
                </span>
              )}
              {exercise.tipoPelota && (
                <span className="text-xs font-medium bg-muted text-foreground px-2.5 py-1 rounded-lg">
                  🎾 {TIPO_PELOTA_LABELS[exercise.tipoPelota]}
                </span>
              )}
              {exercise.golpes &&
                exercise.golpes.map((g) => (
                  <span
                    key={g}
                    className="text-xs font-medium bg-blue-400/10 text-blue-400 px-2.5 py-1 rounded-lg"
                  >
                    {GOLPE_LABELS[g] ?? g}
                  </span>
                ))}
              {exercise.efecto &&
                exercise.efecto.map((e) => (
                  <span
                    key={e}
                    className="text-xs font-medium bg-purple-400/10 text-purple-400 px-2.5 py-1 rounded-lg"
                  >
                    {EFECTO_LABELS[e] ?? e}
                  </span>
                ))}
            </div>
          )}

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

          {exercise.variantes && (
            <div className="bg-muted/50 border border-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Shuffle className="size-3.5 text-muted-foreground" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Variantes
                </p>
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {exercise.variantes}
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

          {/* Image gallery */}
          {exercise.imageUrls && exercise.imageUrls.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Galería
              </p>
              <div
                className={cn(
                  "grid gap-2",
                  exercise.imageUrls.length === 1
                    ? "grid-cols-1"
                    : exercise.imageUrls.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-2"
                )}
              >
                {exercise.imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="aspect-video rounded-xl overflow-hidden bg-muted relative"
                  >
                    <Image
                      src={url}
                      alt={`${exercise.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
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

      {/* List picker modal */}
      {showListPicker && userId && (
        <ExerciseListPicker
          exerciseId={exercise.id}
          onClose={() => {
            setShowListPicker(false);
            void refreshSavedLists();
          }}
        />
      )}
    </div>
  );
}
