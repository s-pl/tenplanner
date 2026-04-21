"use client";

import { useState, useRef, DragEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Plus,
  X,
  Search,
  Clock,
  GripVertical,
  CalendarDays,
  Dumbbell,
  BookOpen,
  ChevronDown,
  StickyNote,
  BarChart3,
  Filter,
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

const CATEGORY_BAR: Record<string, string> = {
  technique: "bg-blue-400",
  tactics: "bg-purple-400",
  fitness: "bg-amber-400",
  "warm-up": "bg-brand",
};

const CATEGORY_BAR_HEX: Record<string, string> = {
  technique: "#60a5fa",
  tactics: "#c084fc",
  fitness: "#fbbf24",
  "warm-up": "var(--brand)",
};

const CATEGORY_LABELS: Record<string, string> = {
  technique: "Técnica",
  tactics: "Táctica",
  fitness: "Fitness",
  "warm-up": "Calentamiento",
};

const formSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(255),
  description: z.string().max(2000).optional().nullable(),
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
  notes: string;
}

interface SessionFormProps {
  mode: "create" | "edit";
  sessionId?: string;
  availableExercises: AvailableExercise[];
  initialData?: {
    title?: string;
    description?: string | null;
    scheduledAt?: string;
    exercises?: {
      exerciseId: string;
      durationMinutes: number;
      name: string;
      category: string;
    }[];
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

function toDatetimeLocalValue(isoString: string): string {
  const date = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
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
  const [libCategoryFilter, setLibCategoryFilter] = useState<string>("all");
  const [selectedExercises, setSelectedExercises] = useState<
    SelectedExercise[]
  >(() =>
    (initialData?.exercises ?? []).map((e) => ({
      exerciseId: e.exerciseId,
      name: e.name,
      category: e.category,
      durationMinutes:
        availableExercises.find((a) => a.id === e.exerciseId)
          ?.durationMinutes ?? e.durationMinutes,
      overrideDuration: null,
      notes: "",
    }))
  );

  // Per-item UI state
  const [editingDurationIdx, setEditingDurationIdx] = useState<number | null>(
    null
  );
  const [durationEditValue, setDurationEditValue] = useState("");
  const [expandedNotesIdx, setExpandedNotesIdx] = useState<number | null>(null);
  const durationInputRef = useRef<HTMLInputElement>(null);

  // DnD state
  const [dragOverTimelineIndex, setDragOverTimelineIndex] = useState<
    number | null
  >(null);
  const [dragSrcTimelineIndex, setDragSrcTimelineIndex] = useState<
    number | null
  >(null);
  const [isDropZoneActive, setIsDropZoneActive] = useState(false);
  const dragCounter = useRef(0);

  const totalDuration = selectedExercises.reduce(
    (sum, e) => sum + (e.overrideDuration ?? e.durationMinutes),
    0
  );
  const selectedIds = new Set(selectedExercises.map((e) => e.exerciseId));

  const availableCategories = Array.from(
    new Set(availableExercises.map((e) => e.category))
  );

  const filteredAvailable = availableExercises.filter((ex) => {
    const notSelected = !selectedIds.has(ex.id);
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      libCategoryFilter === "all" || ex.category === libCategoryFilter;
    return notSelected && matchesSearch && matchesCategory;
  });

  // Category breakdown for summary bar
  const breakdown = Object.entries(
    selectedExercises.reduce<Record<string, number>>((acc, e) => {
      const dur = e.overrideDuration ?? e.durationMinutes;
      acc[e.category] = (acc[e.category] ?? 0) + dur;
      return acc;
    }, {})
  );

  // Cumulative time markers
  function getCumulativeStart(idx: number) {
    return selectedExercises
      .slice(0, idx)
      .reduce((sum, e) => sum + (e.overrideDuration ?? e.durationMinutes), 0);
  }

  useEffect(() => {
    if (editingDurationIdx !== null) durationInputRef.current?.focus();
  }, [editingDurationIdx]);

  function startEditDuration(idx: number) {
    const ex = selectedExercises[idx];
    setDurationEditValue(String(ex.overrideDuration ?? ex.durationMinutes));
    setEditingDurationIdx(idx);
  }

  function commitDurationEdit(idx: number) {
    const val = parseInt(durationEditValue, 10);
    if (!isNaN(val) && val >= 1 && val <= 300) {
      setSelectedExercises((prev) =>
        prev.map((e, i) => (i === idx ? { ...e, overrideDuration: val } : e))
      );
    }
    setEditingDurationIdx(null);
  }

  function updateNotes(idx: number, notes: string) {
    setSelectedExercises((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, notes } : e))
    );
  }

  function addExercise(ex: AvailableExercise, atIndex?: number) {
    const item: SelectedExercise = {
      exerciseId: ex.id,
      name: ex.name,
      category: ex.category,
      durationMinutes: ex.durationMinutes,
      overrideDuration: null,
      notes: "",
    };
    setSelectedExercises((prev) => {
      if (atIndex !== undefined) {
        const next = [...prev];
        next.splice(atIndex, 0, item);
        return next;
      }
      return [...prev, item];
    });
  }

  function removeExercise(exerciseId: string) {
    setSelectedExercises((prev) =>
      prev.filter((e) => e.exerciseId !== exerciseId)
    );
  }

  function reorderExercises(fromIndex: number, toIndex: number) {
    setSelectedExercises((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }

  function onLibraryDragStart(e: DragEvent, ex: AvailableExercise) {
    e.dataTransfer.setData("dnd-type", "library");
    e.dataTransfer.setData("exercise-id", ex.id);
    e.dataTransfer.effectAllowed = "copy";
  }

  function onTimelineDragStart(e: DragEvent, index: number) {
    e.dataTransfer.setData("dnd-type", "reorder");
    e.dataTransfer.setData("src-index", String(index));
    e.dataTransfer.effectAllowed = "move";
    setDragSrcTimelineIndex(index);
  }

  function onTimelineDragEnd() {
    setDragSrcTimelineIndex(null);
    setDragOverTimelineIndex(null);
  }

  function onTimelineItemDrop(e: DragEvent, toIndex: number) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTimelineIndex(null);
    const type = e.dataTransfer.getData("dnd-type");
    if (type === "library") {
      const exerciseId = e.dataTransfer.getData("exercise-id");
      const ex = availableExercises.find((a) => a.id === exerciseId);
      if (ex && !selectedIds.has(exerciseId)) addExercise(ex, toIndex);
    } else if (type === "reorder") {
      const fromIndex = parseInt(e.dataTransfer.getData("src-index"), 10);
      if (fromIndex !== toIndex) reorderExercises(fromIndex, toIndex);
    }
    setDragSrcTimelineIndex(null);
  }

  function onDropZoneDrop(e: DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDropZoneActive(false);
    const type = e.dataTransfer.getData("dnd-type");
    if (type === "library") {
      const exerciseId = e.dataTransfer.getData("exercise-id");
      const ex = availableExercises.find((a) => a.id === exerciseId);
      if (ex && !selectedIds.has(exerciseId)) addExercise(ex);
    } else if (type === "reorder") {
      const fromIndex = parseInt(e.dataTransfer.getData("src-index"), 10);
      reorderExercises(fromIndex, selectedExercises.length - 1);
    }
    setDragSrcTimelineIndex(null);
  }

  function onDropZoneDragEnter(e: DragEvent) {
    e.preventDefault();
    dragCounter.current++;
    setIsDropZoneActive(true);
  }

  function onDropZoneDragLeave() {
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDropZoneActive(false);
    }
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
      scheduledAt: initialData?.scheduledAt
        ? toDatetimeLocalValue(initialData.scheduledAt)
        : "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const url =
      mode === "create" ? "/api/sessions" : `/api/sessions/${sessionId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: values.title,
        description: values.description?.trim() || null,
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        exercises: selectedExercises.map((e) => ({
          exerciseId: e.exerciseId,
          durationMinutes: e.overrideDuration ?? null,
          notes: e.notes.trim() || null,
        })),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setServerError(
        data.details?.map((d: { message: string }) => d.message).join(". ") ??
          data.error ??
          "Ha ocurrido un error."
      );
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* ─── Session metadata ─── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-foreground"
            >
              Título de la sesión
            </label>
            <input
              id="title"
              type="text"
              placeholder="Ej: Entrenamiento de técnica ofensiva"
              autoComplete="off"
              aria-invalid={!!errors.title}
              {...register("title")}
              className="w-full h-11 px-4 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground font-medium"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

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
              <p className="text-xs text-destructive">
                {errors.scheduledAt.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-foreground"
            >
              Descripción{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </label>
            <textarea
              id="description"
              placeholder="Objetivo de la sesión, notas…"
              rows={3}
              maxLength={2000}
              {...register("description")}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>
        </div>
      </div>

      {/* ─── Session summary bar ─── */}
      {selectedExercises.length > 0 && (
        <div className="bg-card border border-border rounded-2xl px-5 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BarChart3 className="size-4 text-muted-foreground" />
              Resumen de sesión
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-bold text-foreground">
                {formatMinutes(totalDuration)}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {selectedExercises.length} ejercicio
                {selectedExercises.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          {/* Category breakdown bar */}
          <div className="flex h-2 rounded-full overflow-hidden gap-px">
            {breakdown.map(([cat, dur]) => (
              <div
                key={cat}
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(dur / totalDuration) * 100}%`,
                  backgroundColor: CATEGORY_BAR_HEX[cat] ?? "#888",
                }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {breakdown.map(([cat, dur]) => (
              <div
                key={cat}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: CATEGORY_BAR_HEX[cat] ?? "#888" }}
                />
                <span>{CATEGORY_LABELS[cat] ?? cat}</span>
                <span className="font-medium text-foreground">
                  {formatMinutes(dur)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Two-panel builder ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 min-h-[500px]">
        {/* LEFT: Session timeline */}
        <div className="flex flex-col rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                Plan de entrenamiento
              </span>
            </div>
            {totalDuration > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                <Clock className="size-3" />
                {formatMinutes(totalDuration)}
              </span>
            )}
          </div>

          <div
            className={cn(
              "flex-1 p-3 transition-colors overflow-y-auto",
              isDropZoneActive &&
                selectedExercises.length === 0 &&
                "bg-brand/5",
              selectedExercises.length === 0 &&
                "flex items-center justify-center"
            )}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={onDropZoneDragEnter}
            onDragLeave={onDropZoneDragLeave}
            onDrop={onDropZoneDrop}
          >
            {selectedExercises.length === 0 ? (
              <div
                className={cn(
                  "w-full max-w-xs mx-auto flex flex-col items-center text-center py-10 rounded-xl border-2 border-dashed transition-colors",
                  isDropZoneActive ? "border-brand bg-brand/5" : "border-border"
                )}
              >
                <Dumbbell
                  className={cn(
                    "size-8 mb-3",
                    isDropZoneActive ? "text-brand" : "text-muted-foreground"
                  )}
                />
                <p className="text-sm font-medium text-foreground mb-1">
                  {isDropZoneActive ? "¡Suelta aquí!" : "Sin ejercicios aún"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Arrastra ejercicios desde la biblioteca o pulsa{" "}
                  <Plus className="size-3 inline" />
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {selectedExercises.map((ex, idx) => {
                  const cumulativeStart = getCumulativeStart(idx);
                  const effectiveDuration =
                    ex.overrideDuration ?? ex.durationMinutes;
                  const isEditingDuration = editingDurationIdx === idx;
                  const isExpanded = expandedNotesIdx === idx;
                  const isDragging = dragSrcTimelineIndex === idx;

                  return (
                    <div key={ex.exerciseId}>
                      {/* Drop indicator above */}
                      <div
                        className={cn(
                          "h-0.5 rounded-full transition-all mb-1",
                          dragOverTimelineIndex === idx
                            ? "bg-brand"
                            : "bg-transparent"
                        )}
                      />

                      <div
                        draggable={!isEditingDuration}
                        onDragStart={(e) =>
                          !isEditingDuration && onTimelineDragStart(e, idx)
                        }
                        onDragEnd={onTimelineDragEnd}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverTimelineIndex(idx);
                        }}
                        onDragLeave={() => setDragOverTimelineIndex(null)}
                        onDrop={(e) => onTimelineItemDrop(e, idx)}
                        className={cn(
                          "group bg-card border rounded-xl transition-all",
                          isDragging
                            ? "opacity-40 border-dashed border-border cursor-grabbing"
                            : "border-border hover:border-brand/30 hover:shadow-sm cursor-grab active:cursor-grabbing"
                        )}
                      >
                        {/* Main row */}
                        <div className="flex items-center gap-2.5 px-3 py-2.5">
                          <div
                            className={cn(
                              "w-0.5 h-8 rounded-full shrink-0",
                              CATEGORY_BAR[ex.category] ?? "bg-muted"
                            )}
                          />
                          <GripVertical className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 transition-colors" />

                          {/* Time marker */}
                          <div className="flex flex-col items-center shrink-0 w-10 text-center">
                            <span className="text-[10px] font-mono text-muted-foreground/50">
                              {cumulativeStart}m
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground/30">
                              ▼
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate leading-snug">
                              {ex.name}
                            </p>
                            <span
                              className={cn(
                                "inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                                CATEGORY_COLORS[ex.category] ??
                                  "text-muted-foreground bg-muted"
                              )}
                            >
                              {CATEGORY_LABELS[ex.category] ?? ex.category}
                            </span>
                          </div>

                          {/* Duration — click to edit */}
                          {isEditingDuration ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                ref={durationInputRef}
                                type="number"
                                min={1}
                                max={300}
                                value={durationEditValue}
                                onChange={(e) =>
                                  setDurationEditValue(e.target.value)
                                }
                                onBlur={() => commitDurationEdit(idx)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    commitDurationEdit(idx);
                                  }
                                  if (e.key === "Escape")
                                    setEditingDurationIdx(null);
                                }}
                                className="w-14 h-7 text-xs text-center bg-background border border-brand/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
                              />
                              <span className="text-xs text-muted-foreground">
                                min
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditDuration(idx)}
                              title="Editar duración"
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 px-1.5 py-1 rounded-lg hover:bg-muted group/dur"
                            >
                              <Clock className="size-3" />
                              <span>{effectiveDuration} min</span>
                              <ChevronDown className="size-2.5 opacity-0 group-hover/dur:opacity-100 transition-opacity" />
                            </button>
                          )}

                          {/* Notes toggle */}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedNotesIdx(isExpanded ? null : idx)
                            }
                            title="Notas"
                            className={cn(
                              "size-6 rounded-md flex items-center justify-center transition-colors shrink-0",
                              isExpanded || ex.notes
                                ? "text-brand bg-brand/10"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100"
                            )}
                          >
                            <StickyNote className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeExercise(ex.exerciseId)}
                            className="size-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>

                        {/* Notes area */}
                        {isExpanded && (
                          <div className="px-3 pb-2.5 border-t border-border/40 pt-2">
                            <textarea
                              value={ex.notes}
                              onChange={(e) => updateNotes(idx, e.target.value)}
                              placeholder="Notas para este ejercicio: puntos clave, variantes, carga…"
                              rows={2}
                              className="w-full text-xs bg-muted/40 border border-border/50 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground resize-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Drop zone at end */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDropZoneDrop}
                  className={cn(
                    "h-10 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors mt-2",
                    isDropZoneActive
                      ? "border-brand bg-brand/5"
                      : "border-border/40"
                  )}
                >
                  <p className="text-xs text-muted-foreground">
                    {isDropZoneActive
                      ? "Suelta aquí"
                      : "Arrastra más ejercicios aquí"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Exercise library */}
        <div className="flex flex-col rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30 shrink-0">
            <BookOpen className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Biblioteca
            </span>
            {filteredAvailable.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {filteredAvailable.length} disponibles
              </span>
            )}
          </div>

          {/* Search */}
          <div className="px-3 pt-2 pb-1.5 border-b border-border shrink-0">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ejercicios…"
                className="w-full h-8 pl-8 pr-3 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {/* Category filter chips */}
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {["all", ...availableCategories].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setLibCategoryFilter(cat)}
                  className={cn(
                    "shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full transition-colors whitespace-nowrap",
                    libCategoryFilter === cat
                      ? "bg-brand text-brand-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat === "all" ? "Todos" : (CATEGORY_LABELS[cat] ?? cat)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/50 max-h-[400px] lg:max-h-none">
            {filteredAvailable.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Filter className="size-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  {search || libCategoryFilter !== "all"
                    ? "Sin resultados para ese filtro"
                    : availableExercises.length === 0
                      ? "No hay ejercicios en la biblioteca"
                      : "Todos los ejercicios están en la sesión"}
                </p>
              </div>
            ) : (
              filteredAvailable.map((ex) => (
                <div
                  key={ex.id}
                  draggable
                  onDragStart={(e) => onLibraryDragStart(e, ex)}
                  className="group flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing"
                >
                  <div
                    className={cn(
                      "w-0.5 h-7 rounded-full shrink-0",
                      CATEGORY_BAR[ex.category] ?? "bg-muted"
                    )}
                  />
                  <GripVertical className="size-3.5 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate leading-snug">
                      {ex.name}
                    </p>
                    <span
                      className={cn(
                        "inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                        CATEGORY_COLORS[ex.category] ??
                          "text-muted-foreground bg-muted"
                      )}
                    >
                      {CATEGORY_LABELS[ex.category] ?? ex.category}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="size-3" />
                    {ex.durationMinutes} min
                  </span>
                  <button
                    type="button"
                    onClick={() => addExercise(ex)}
                    className="size-6 rounded-md flex items-center justify-center bg-brand/10 text-brand hover:bg-brand/20 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {serverError && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1 border-t border-border/60">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 bg-brand text-brand-foreground text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-brand/90 active:scale-95 transition-all duration-150 disabled:opacity-60"
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
