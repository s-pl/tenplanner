"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  Loader2,
  Calendar,
  Clock,
  Dumbbell,
  CheckCircle2,
  Circle,
} from "lucide-react";
import Link from "next/link";
import { SessionForm, type AvailableExercise } from "@/components/app/session-form";
import { SessionAnalyticsView } from "@/components/app/session-analytics";
import type { SessionAnalytics } from "@/lib/sessions/analytics";
import { cn } from "@/lib/utils";
import { Target, Flame, MapPin, Hash } from "lucide-react";

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

const DIFFICULTY_META: Record<string, { label: string; color: string }> = {
  beginner: { label: "Principiante", color: "text-brand" },
  intermediate: { label: "Intermedio", color: "text-amber-400" },
  advanced: { label: "Avanzado", color: "text-red-400" },
};

export interface SessionData {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  durationMinutes: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  objective: string | null;
  intensity: number | null;
  tags: string[];
  location: string | null;
}

export interface SessionStudentData {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface SessionExerciseData {
  exerciseId: string;
  name: string;
  category: string;
  difficulty: string;
  orderIndex: number;
  durationMinutes: number;
  notes: string | null;
}

function formatDate(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days === -1) return "Ayer";

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }).format(date);
}

function formatTime(isoString: string) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}

interface Props {
  session: SessionData;
  sessionExercises: SessionExerciseData[];
  availableExercises: AvailableExercise[];
  analytics: SessionAnalytics;
  students: SessionStudentData[];
}

function IntensityIndicator({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn(
            "size-1.5 rounded-full",
            n <= value ? "bg-brand" : "bg-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}

function MetadataChips({ session }: { session: SessionData }) {
  const hasAny =
    !!session.objective ||
    typeof session.intensity === "number" ||
    !!session.location ||
    session.tags.length > 0;
  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {session.objective && (
        <span className="inline-flex items-center gap-1.5 text-xs text-foreground bg-muted/60 border border-border px-2.5 py-1 rounded-full">
          <Target className="size-3 text-muted-foreground" />
          <span className="truncate max-w-[24ch]">{session.objective}</span>
        </span>
      )}
      {typeof session.intensity === "number" && (
        <span className="inline-flex items-center gap-1.5 text-xs text-foreground bg-muted/60 border border-border px-2.5 py-1 rounded-full">
          <Flame className="size-3 text-muted-foreground" />
          <IntensityIndicator value={session.intensity} />
          <span className="font-mono text-muted-foreground">
            {session.intensity}/5
          </span>
        </span>
      )}
      {session.location && (
        <span className="inline-flex items-center gap-1.5 text-xs text-foreground bg-muted/60 border border-border px-2.5 py-1 rounded-full">
          <MapPin className="size-3 text-muted-foreground" />
          {session.location}
        </span>
      )}
      {session.tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 text-xs text-brand bg-brand/10 border border-brand/20 px-2.5 py-1 rounded-full"
        >
          <Hash className="size-3" />
          {tag}
        </span>
      ))}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StudentsSection({ students }: { students: SessionStudentData[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50">
        <h2 className="font-semibold text-sm text-foreground">Alumnos</h2>
      </div>
      <div className="p-6">
        {students.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Sin alumnos asignados
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {students.map((s) => (
              <div
                key={s.id}
                className="inline-flex items-center gap-2 bg-muted/40 border border-border rounded-full pl-1 pr-3 py-1"
              >
                {s.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.imageUrl}
                    alt={s.name}
                    className="size-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="size-6 rounded-full bg-brand/20 text-brand text-[10px] font-bold flex items-center justify-center">
                    {getInitials(s.name)}
                  </span>
                )}
                <span className="text-xs font-medium text-foreground truncate max-w-[14ch]">
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const CATEGORY_BAR: Record<string, string> = {
  technique: "bg-blue-500",
  tactics: "bg-purple-500",
  fitness: "bg-amber-500",
  "warm-up": "bg-brand",
};

const CATEGORY_BAR_LIGHT: Record<string, string> = {
  technique: "bg-blue-500/15 border-blue-500/30",
  tactics: "bg-purple-500/15 border-purple-500/30",
  fitness: "bg-amber-500/15 border-amber-500/30",
  "warm-up": "bg-brand/15 border-brand/30",
};

function SessionRoadmap({ exercises, totalMinutes }: { exercises: SessionExerciseData[]; totalMinutes: number }) {
  const total = totalMinutes > 0 ? totalMinutes : exercises.reduce((s, e) => s + e.durationMinutes, 0);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50">
        <h2 className="font-semibold text-sm text-foreground">Hoja de ruta</h2>
      </div>
      <div className="p-6 space-y-4">
        {/* Timeline bar */}
        <div className="flex h-8 rounded-xl overflow-hidden gap-px">
          {exercises.map((ex) => {
            const pct = total > 0 ? (ex.durationMinutes / total) * 100 : 100 / exercises.length;
            return (
              <div
                key={ex.exerciseId}
                className={cn("h-full relative group", CATEGORY_BAR[ex.category] ?? "bg-muted")}
                style={{ width: `${pct}%`, minWidth: "2px" }}
                title={`${ex.name} · ${ex.durationMinutes} min`}
              />
            );
          })}
        </div>

        {/* Step list */}
        <div className="space-y-2">
          {exercises.map((ex, idx) => {
            const pct = total > 0 ? Math.round((ex.durationMinutes / total) * 100) : 0;
            const elapsed = exercises.slice(0, idx).reduce((s, e) => s + e.durationMinutes, 0);
            return (
              <div key={ex.exerciseId} className="flex items-center gap-3">
                {/* Timeline dot + line */}
                <div className="flex flex-col items-center shrink-0 w-4">
                  <div className={cn("size-2.5 rounded-full border-2", CATEGORY_BAR_LIGHT[ex.category] ?? "bg-muted border-muted-foreground/30", "border-current")} />
                  {idx < exercises.length - 1 && <div className="w-px flex-1 min-h-[1.25rem] bg-border/60 mt-1" />}
                </div>

                {/* Content */}
                <div className={cn("flex-1 flex items-center justify-between gap-3 px-3 py-2 rounded-xl border text-xs", CATEGORY_BAR_LIGHT[ex.category] ?? "bg-muted/30 border-border")}>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{ex.name}</p>
                    <p className="text-muted-foreground mt-0.5">{CATEGORY_LABELS[ex.category] ?? ex.category}</p>
                  </div>
                  <div className="text-right shrink-0 text-muted-foreground">
                    <p className="font-mono">{elapsed}′ – {elapsed + ex.durationMinutes}′</p>
                    <p className="text-[10px] mt-0.5">{ex.durationMinutes} min · {pct}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-1">
          {(["warm-up", "technique", "tactics", "fitness"] as const).filter(cat =>
            exercises.some(e => e.category === cat)
          ).map(cat => (
            <div key={cat} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className={cn("size-2 rounded-sm", CATEGORY_BAR[cat])} />
              {CATEGORY_LABELS[cat]}
              <span className="font-mono">
                {exercises.filter(e => e.category === cat).reduce((s, e) => s + e.durationMinutes, 0)} min
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SessionDetailClient({ session, sessionExercises, availableExercises, analytics, students }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isPast = new Date(session.scheduledAt) < new Date();

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
    if (!res.ok) {
      setDeleteError("No se pudo eliminar la sesión. Inténtalo de nuevo.");
      setDeleting(false);
      return;
    }
    router.push("/sessions");
    router.refresh();
  }

  if (mode === "edit") {
    return (
      <div className="px-4 md:px-8 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMode("view")}
            className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Editar sesión
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Modifica los datos de la sesión
            </p>
          </div>
        </div>
        <SessionForm
          mode="edit"
          sessionId={session.id}
          availableExercises={availableExercises}
          initialData={{
            title: session.title,
            description: session.description,
            scheduledAt: session.scheduledAt,
            exercises: sessionExercises.map((e) => ({
              exerciseId: e.exerciseId,
              name: e.name,
              category: e.category,
              durationMinutes: e.durationMinutes,
            })),
          }}
          onSuccess={() => {
            setMode("view");
            router.refresh();
          }}
          onCancel={() => setMode("view")}
        />
      </div>
    );
  }

  return (
    <div className="px-6 md:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/sessions"
            className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <p className="text-xs text-muted-foreground font-medium truncate">
            Sesiones de Entrenamiento
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

      {/* Session card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header stripe */}
        <div className="px-6 py-5 border-b border-border/50 bg-muted/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                {isPast ? (
                  <CheckCircle2 className="size-5 text-brand" />
                ) : (
                  <Circle className="size-5 text-muted-foreground/60" />
                )}
              </div>
              <div>
                <span
                  className={cn(
                    "text-xs font-bold uppercase tracking-widest",
                    isPast ? "text-muted-foreground" : "text-brand"
                  )}
                >
                  {isPast ? "Completada" : "Próxima"}
                </span>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    {formatDate(session.scheduledAt)} a las {formatTime(session.scheduledAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground leading-snug">
            {session.title}
          </h1>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {session.durationMinutes} min
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Dumbbell className="size-3.5" />
              {sessionExercises.length} {sessionExercises.length !== 1 ? "ejercicios" : "ejercicio"}
            </span>
          </div>

          <MetadataChips session={session} />

          {session.description && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Descripción
              </p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {session.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Analytics */}
      <SessionAnalyticsView analytics={analytics} />

      {/* Students */}
      <StudentsSection students={students} />

      {/* Roadmap */}
      {sessionExercises.length > 0 && (
        <SessionRoadmap exercises={sessionExercises} totalMinutes={session.durationMinutes} />
      )}

      {/* Exercises list */}
      {sessionExercises.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50">
            <h2 className="font-semibold text-sm text-foreground">Ejercicios</h2>
          </div>
          <div className="divide-y divide-border/60">
            {sessionExercises.map((ex, idx) => {
              const diff = DIFFICULTY_META[ex.difficulty];
              return (
                <Link
                  key={ex.exerciseId}
                  href={`/exercises/${ex.exerciseId}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors group"
                >
                  <span className="text-xs font-mono text-muted-foreground/60 w-5 shrink-0 text-right">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-brand transition-colors">
                      {ex.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                          CATEGORY_COLORS[ex.category] ?? "text-muted-foreground bg-muted"
                        )}
                      >
                        {CATEGORY_LABELS[ex.category] ?? ex.category}
                      </span>
                      <span className={cn("text-[10px] font-medium", diff?.color ?? "text-muted-foreground")}>
                        {diff?.label ?? ex.difficulty}
                      </span>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="size-3" />
                    {ex.durationMinutes} min
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

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
                <h3 className="font-semibold text-foreground">Eliminar sesión</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  ¿Seguro que quieres eliminar{" "}
                  <span className="font-medium text-foreground">{session.title}</span>? Esta acción no se puede deshacer.
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
