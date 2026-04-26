"use client";

import { useState } from "react";
import Image from "next/image";
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
  XCircle,
  Circle,
  FileDown,
  Copy,
  Star,
  Play,
  Upload,
} from "lucide-react";
import Link from "next/link";
import {
  SessionForm,
  type AvailableExercise,
} from "@/components/app/session-form";
import { SessionAnalyticsView } from "@/components/app/session-analytics";
import type { SessionAnalytics } from "@/lib/sessions/analytics";
import { cn } from "@/lib/utils";
import { Target, Flame, MapPin, Hash, Package } from "lucide-react";

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
  status: "scheduled" | "completed" | "cancelled";
}

export interface SessionStudentData {
  id: string;
  name: string;
  imageUrl: string | null;
  attended: boolean | null;
}

export interface SessionExerciseData {
  exerciseId: string;
  name: string;
  category: string;
  difficulty: string;
  orderIndex: number;
  durationMinutes: number;
  notes: string | null;
  coachRating: number | null;
  materials: string[];
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
  favoritedExerciseIds: string[];
}

function IntensityIndicator({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn(
            "size-1.5 rounded-full",
            n <= value ? "bg-brand" : "bg-muted-foreground/30"
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

function StudentsSection({
  students,
  sessionId,
}: {
  students: SessionStudentData[];
  sessionId: string;
}) {
  const [attendance, setAttendance] = useState<Record<string, boolean | null>>(
    () => Object.fromEntries(students.map((s) => [s.id, s.attended]))
  );
  const [saving, setSaving] = useState<string | null>(null);

  async function toggleAttendance(studentId: string) {
    const current = attendance[studentId];
    const next = current === true ? false : true;
    setSaving(studentId);
    const res = await fetch(`/api/sessions/${sessionId}/attendance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, attended: next }),
    });
    if (res.ok) setAttendance((prev) => ({ ...prev, [studentId]: next }));
    setSaving(null);
  }

  const presentCount = Object.values(attendance).filter(Boolean).length;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
        <h2 className="font-semibold text-sm text-foreground">Pase de lista</h2>
        {students.length > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {presentCount}/{students.length} presentes
          </span>
        )}
      </div>
      <div className="divide-y divide-border/50">
        {students.length === 0 ? (
          <p className="px-6 py-4 text-xs text-muted-foreground">
            Sin alumnos asignados
          </p>
        ) : (
          students.map((s) => {
            const attended = attendance[s.id];
            const isSaving = saving === s.id;
            return (
              <div key={s.id} className="flex items-center gap-3 px-6 py-3">
                {s.imageUrl ? (
                  <Image
                    src={s.imageUrl}
                    alt={s.name}
                    width={32}
                    height={32}
                    className="size-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span className="size-8 rounded-full bg-brand/20 text-brand text-[11px] font-bold flex items-center justify-center shrink-0">
                    {getInitials(s.name)}
                  </span>
                )}
                <span className="flex-1 text-sm font-medium text-foreground truncate">
                  {s.name}
                </span>
                <button
                  onClick={() => toggleAttendance(s.id)}
                  disabled={isSaving}
                  aria-label={attended ? "Marcar ausente" : "Marcar presente"}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all active:scale-95 disabled:opacity-50 min-w-[90px] justify-center",
                    attended === true
                      ? "bg-brand/10 border-brand/30 text-brand"
                      : attended === false
                        ? "bg-destructive/10 border-destructive/30 text-destructive"
                        : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {isSaving ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : attended === true ? (
                    <>
                      <CheckCircle2 className="size-3" /> Presente
                    </>
                  ) : attended === false ? (
                    <>
                      <XCircle className="size-3" /> Ausente
                    </>
                  ) : (
                    <>
                      <Circle className="size-3" /> Sin marcar
                    </>
                  )}
                </button>
              </div>
            );
          })
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

function SessionRoadmap({
  exercises,
  totalMinutes,
}: {
  exercises: SessionExerciseData[];
  totalMinutes: number;
}) {
  const total =
    totalMinutes > 0
      ? totalMinutes
      : exercises.reduce((s, e) => s + e.durationMinutes, 0);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50">
        <h2 className="font-semibold text-sm text-foreground">Hoja de ruta</h2>
      </div>
      <div className="p-6 space-y-4">
        {/* Timeline bar */}
        <div className="flex h-8 rounded-xl overflow-hidden gap-px">
          {exercises.map((ex) => {
            const pct =
              total > 0
                ? (ex.durationMinutes / total) * 100
                : 100 / exercises.length;
            return (
              <div
                key={ex.exerciseId}
                className={cn(
                  "h-full relative group",
                  CATEGORY_BAR[ex.category] ?? "bg-muted"
                )}
                style={{ width: `${pct}%`, minWidth: "2px" }}
                title={`${ex.name} · ${ex.durationMinutes} min`}
              />
            );
          })}
        </div>

        {/* Step list */}
        <div className="space-y-2">
          {exercises.map((ex, idx) => {
            const pct =
              total > 0 ? Math.round((ex.durationMinutes / total) * 100) : 0;
            const elapsed = exercises
              .slice(0, idx)
              .reduce((s, e) => s + e.durationMinutes, 0);
            return (
              <div key={ex.exerciseId} className="flex items-center gap-3">
                {/* Timeline dot + line */}
                <div className="flex flex-col items-center shrink-0 w-4">
                  <div
                    className={cn(
                      "size-2.5 rounded-full border-2",
                      CATEGORY_BAR_LIGHT[ex.category] ??
                        "bg-muted border-muted-foreground/30",
                      "border-current"
                    )}
                  />
                  {idx < exercises.length - 1 && (
                    <div className="w-px flex-1 min-h-[1.25rem] bg-border/60 mt-1" />
                  )}
                </div>

                {/* Content */}
                <div
                  className={cn(
                    "flex-1 flex items-center justify-between gap-3 px-3 py-2 rounded-xl border text-xs",
                    CATEGORY_BAR_LIGHT[ex.category] ??
                      "bg-muted/30 border-border"
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {ex.name}
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      {CATEGORY_LABELS[ex.category] ?? ex.category}
                    </p>
                  </div>
                  <div className="text-right shrink-0 text-muted-foreground">
                    <p className="font-mono">
                      {elapsed}′ – {elapsed + ex.durationMinutes}′
                    </p>
                    <p className="text-[10px] mt-0.5">
                      {ex.durationMinutes} min · {pct}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-1">
          {(["warm-up", "technique", "tactics", "fitness"] as const)
            .filter((cat) => exercises.some((e) => e.category === cat))
            .map((cat) => (
              <div
                key={cat}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
              >
                <div className={cn("size-2 rounded-sm", CATEGORY_BAR[cat])} />
                {CATEGORY_LABELS[cat]}
                <span className="font-mono">
                  {exercises
                    .filter((e) => e.category === cat)
                    .reduce((s, e) => s + e.durationMinutes, 0)}{" "}
                  min
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export function SessionDetailClient({
  session,
  sessionExercises,
  availableExercises,
  analytics,
  students,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [sanitizeNotes, setSanitizeNotes] = useState(true);
  const [templateTitle, setTemplateTitle] = useState(session.title);
  const [templateDescription, setTemplateDescription] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState(session.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [exerciseRatings, setExerciseRatings] = useState<
    Record<string, number>
  >(() =>
    Object.fromEntries(
      sessionExercises
        .filter((e) => e.coachRating != null)
        .map((e) => [e.exerciseId, e.coachRating!])
    )
  );
  const [savingRating, setSavingRating] = useState<string | null>(null);

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/pdf`);
      if (!res.ok) throw new Error("Error generando PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] ??
        `sesion-${session.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silencioso — el botón vuelve a su estado normal
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleStatusChange(
    newStatus: "completed" | "cancelled" | "scheduled"
  ) {
    setUpdatingStatus(true);
    const res = await fetch(`/api/sessions/${session.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setStatus(newStatus);
      router.refresh();
    }
    setUpdatingStatus(false);
  }

  async function handleRateExercise(exerciseId: string, rating: number) {
    setSavingRating(exerciseId);
    const res = await fetch(`/api/sessions/${session.id}/exercise-rating`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId, rating }),
    });
    if (res.ok) {
      setExerciseRatings((prev) => ({ ...prev, [exerciseId]: rating }));
    }
    setSavingRating(null);
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch(`/api/sessions/${session.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setDeleteError("No se pudo eliminar la sesión. Inténtalo de nuevo.");
      setDeleting(false);
      return;
    }
    router.push("/sessions");
    router.refresh();
  }

  async function handlePublish() {
    if (!templateTitle.trim()) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sanitizeNotes,
          templateTitle: templateTitle.trim(),
          templateDescription: templateDescription.trim() || null,
        }),
      });
      const json = (await res.json()) as { data?: { templateId: string } };
      if (res.ok && json.data?.templateId) {
        router.push(`/sessions/templates/${json.data.templateId}`);
      }
    } finally {
      setPublishing(false);
      setShowPublishDialog(false);
    }
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
    <div className="space-y-6 px-4 py-8 sm:px-6 md:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
          {/* Execute session — only for upcoming/scheduled */}
          {status === "scheduled" && (
            <Link
              href={`/sessions/${session.id}/execute`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-background bg-brand px-3 py-2 rounded-lg hover:bg-brand/90 transition-colors"
            >
              <Play className="size-3.5" />
              <span className="hidden sm:inline">Dar clase</span>
            </Link>
          )}
          {/* Reutilizar */}
          <Link
            href={`/sessions/new?from=${session.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground border border-border px-3 py-2 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
          >
            <Copy className="size-3.5" />
            <span className="hidden sm:inline">Reutilizar</span>
          </Link>
          <button
            onClick={() => setShowPublishDialog(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand border border-brand/30 px-3 py-2 rounded-lg hover:bg-brand/10 transition-colors"
          >
            <Upload className="size-3.5" />
            <span className="hidden sm:inline">Publicar</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground border border-border px-3 py-2 rounded-lg hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingPdf ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileDown className="size-3.5" />
            )}
            <span className="hidden sm:inline">PDF</span>
          </button>
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
        <div className="border-b border-border/50 bg-muted/20 px-4 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                {status === "completed" ? (
                  <CheckCircle2 className="size-5 text-brand" />
                ) : status === "cancelled" ? (
                  <XCircle className="size-5 text-destructive" />
                ) : (
                  <Circle className="size-5 text-muted-foreground/60" />
                )}
              </div>
              <div>
                <span
                  className={cn(
                    "text-xs font-bold uppercase tracking-widest",
                    status === "completed"
                      ? "text-brand"
                      : status === "cancelled"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  )}
                >
                  {status === "completed"
                    ? "Completada"
                    : status === "cancelled"
                      ? "Cancelada"
                      : "Programada"}
                </span>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    {formatDate(session.scheduledAt)} a las{" "}
                    {formatTime(session.scheduledAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status actions */}
        {status !== "completed" && status !== "cancelled" && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border/50 px-4 py-3 sm:px-6">
            <button
              onClick={() => handleStatusChange("completed")}
              disabled={updatingStatus}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand border border-brand/30 bg-brand/5 px-3 py-1.5 rounded-full hover:bg-brand/15 transition-colors disabled:opacity-50"
            >
              {updatingStatus ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3" />
              )}
              Marcar completada
            </button>
            <button
              onClick={() => handleStatusChange("cancelled")}
              disabled={updatingStatus}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive border border-destructive/30 bg-destructive/5 px-3 py-1.5 rounded-full hover:bg-destructive/15 transition-colors disabled:opacity-50"
            >
              <XCircle className="size-3" />
              Cancelar sesión
            </button>
          </div>
        )}
        {status === "cancelled" && (
          <div className="border-b border-border/50 px-4 py-3 sm:px-6">
            <button
              onClick={() => handleStatusChange("scheduled")}
              disabled={updatingStatus}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground border border-border px-3 py-1.5 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
            >
              {updatingStatus ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Circle className="size-3" />
              )}
              Reprogramar
            </button>
          </div>
        )}

        {/* Content */}
        <div className="space-y-5 p-4 sm:p-6">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground leading-snug">
            {session.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {session.durationMinutes} min
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Dumbbell className="size-3.5" />
              {sessionExercises.length}{" "}
              {sessionExercises.length !== 1 ? "ejercicios" : "ejercicio"}
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
      <StudentsSection students={students} sessionId={session.id} />

      {/* Roadmap */}
      {sessionExercises.length > 0 && (
        <SessionRoadmap
          exercises={sessionExercises}
          totalMinutes={session.durationMinutes}
        />
      )}

      {/* Materials summary */}
      {(() => {
        const allMaterials = Array.from(
          new Set(sessionExercises.flatMap((e) => e.materials ?? []))
        );
        if (allMaterials.length === 0) return null;
        return (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex items-center gap-2">
              <Package className="size-4 text-brand" />
              <h2 className="font-semibold text-sm text-foreground">
                Material necesario
              </h2>
              <span className="ml-auto text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {allMaterials.length} elemento
                {allMaterials.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="px-6 py-4 flex flex-wrap gap-2">
              {allMaterials.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand/10 text-brand border border-brand/15 px-3 py-1.5 rounded-full"
                >
                  <Package className="size-3 opacity-70" />
                  {m}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Exercises list */}
      {sessionExercises.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-foreground">
              Ejercicios
            </h2>
            {status === "completed" && (
              <p className="text-[10px] text-muted-foreground">
                Valoración post-sesión
              </p>
            )}
          </div>
          <div className="divide-y divide-border/60">
            {sessionExercises.map((ex, idx) => {
              const diff = DIFFICULTY_META[ex.difficulty];
              const currentRating = exerciseRatings[ex.exerciseId] ?? 0;
              const isSaving = savingRating === ex.exerciseId;
              return (
                <div key={ex.exerciseId} className="px-6 py-4">
                  <div className="flex items-start gap-4">
                    <span className="text-xs font-mono text-muted-foreground/60 w-5 shrink-0 text-right mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/exercises/${ex.exerciseId}`}
                        className="text-sm font-medium text-foreground hover:text-brand transition-colors"
                      >
                        {ex.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                            CATEGORY_COLORS[ex.category] ??
                              "text-muted-foreground bg-muted"
                          )}
                        >
                          {CATEGORY_LABELS[ex.category] ?? ex.category}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-medium",
                            diff?.color ?? "text-muted-foreground"
                          )}
                        >
                          {diff?.label ?? ex.difficulty}
                        </span>
                      </div>
                      {ex.materials && ex.materials.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {ex.materials.map((m) => (
                            <span
                              key={m}
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border/60 px-2 py-0.5 rounded-full"
                            >
                              <Package className="size-2.5 opacity-60" />
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                      {ex.notes && (
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed italic">
                          {ex.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                        <Clock className="size-3" />
                        {ex.durationMinutes} min
                      </span>
                      <div
                        className="flex items-center gap-0.5"
                        title="Valorar ejercicio"
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() =>
                              handleRateExercise(ex.exerciseId, star)
                            }
                            disabled={isSaving}
                            aria-label={`Valorar con ${star} estrellas`}
                            className={cn(
                              "p-0.5 transition-colors disabled:opacity-50 touch-manipulation",
                              star <= currentRating
                                ? "text-amber-400"
                                : "text-muted-foreground/25 hover:text-amber-400/60"
                            )}
                          >
                            <Star className="size-4 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
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
                <h3 className="font-semibold text-foreground">
                  Eliminar sesión
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  ¿Seguro que quieres eliminar{" "}
                  <span className="font-medium text-foreground">
                    {session.title}
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

      {showPublishDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-foreground/15 bg-background shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-foreground/8">
              <button
                onClick={() => setShowPublishDialog(false)}
                className="absolute right-4 top-4 size-7 flex items-center justify-center rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/8 transition-colors"
              >
                <X className="size-4" />
              </button>
              <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/40 mb-1">
                Publicar como plantilla
              </p>
              <h2 className="font-heading text-[20px] text-foreground">
                Compartir en el mercado
              </h2>
              <p className="mt-1 text-[13px] text-foreground/50 leading-relaxed">
                Se crea una copia pública. Tu información personal no se
                publica.
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Template title */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-semibold text-foreground/70 uppercase tracking-[0.1em]">
                  Título de la plantilla <span className="text-brand">*</span>
                </label>
                <input
                  type="text"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  maxLength={255}
                  className="w-full h-10 px-3.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-brand/50 transition-colors"
                />
              </div>

              {/* Template description */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-semibold text-foreground/70 uppercase tracking-[0.1em]">
                  Descripción{" "}
                  <span className="font-normal normal-case tracking-normal text-foreground/40">
                    (opcional)
                  </span>
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Explica el objetivo, nivel o contexto de uso de esta plantilla…"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-brand/50 transition-colors resize-none"
                />
              </div>

              {/* Privacy summary */}
              <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3.5 space-y-2">
                <p className="text-[11px] font-semibold text-foreground/50 uppercase tracking-[0.12em]">
                  Qué se publica
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
                  {[
                    { label: "Estructura de ejercicios", included: true },
                    { label: "Duración e intensidad", included: true },
                    { label: "Objetivo y etiquetas", included: true },
                    { label: "Tu nombre (autor)", included: true },
                    { label: "Alumnos asignados", included: false },
                    { label: "Ubicación del entreno", included: false },
                    { label: "Asistencia y notas privadas", included: false },
                  ].map(({ label, included }) => (
                    <span
                      key={label}
                      className={cn(
                        "flex items-center gap-1.5",
                        included
                          ? "text-foreground/70"
                          : "text-foreground/35 line-through"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full shrink-0",
                          included ? "bg-brand" : "bg-foreground/20"
                        )}
                      />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Strip notes */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sanitizeNotes}
                  onChange={(e) => setSanitizeNotes(e.target.checked)}
                  className="mt-0.5 accent-[var(--brand)]"
                />
                <div>
                  <p className="text-[13px] font-medium text-foreground">
                    Vaciar notas de ejercicios
                  </p>
                  <p className="text-[12px] text-foreground/50">
                    Elimina anotaciones personales de cada ejercicio.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-2 px-6 pb-6">
              <button
                onClick={() => setShowPublishDialog(false)}
                className="flex-1 rounded-xl border border-foreground/15 px-4 py-2.5 text-[13px] font-medium text-foreground/70 hover:border-foreground/30 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || !templateTitle.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-background px-4 py-2.5 text-[13px] font-semibold hover:bg-brand/90 disabled:opacity-60 transition-colors"
              >
                {publishing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Publicar plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
