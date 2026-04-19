"use client";

import { useRef, useState, DragEvent, useEffect } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  Clock,
  Dumbbell,
  Filter,
  GripVertical,
  Plus,
  Search,
  StickyNote,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PHASE_LABELS,
  type AvailableExercise,
  type TrainingPhase,
  type WizardExercise,
  type WizardState,
} from "./types";

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

const CATEGORY_LABELS: Record<string, string> = {
  technique: "Técnica",
  tactics: "Táctica",
  fitness: "Fitness",
  "warm-up": "Calentamiento",
};

interface StepExercisesProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  availableExercises: AvailableExercise[];
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function StepExercises({ state, update, availableExercises }: StepExercisesProps) {
  const [search, setSearch] = useState("");
  const [libCategoryFilter, setLibCategoryFilter] = useState<string>("all");
  const [editingDurationIdx, setEditingDurationIdx] = useState<number | null>(null);
  const [durationEditValue, setDurationEditValue] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const durationInputRef = useRef<HTMLInputElement>(null);

  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null);
  const [isDropZoneActive, setIsDropZoneActive] = useState(false);
  const dragCounter = useRef(0);

  const selected = state.exercises;
  const totalDuration = selected.reduce(
    (sum, e) => sum + (e.overrideDuration ?? e.durationMinutes),
    0
  );
  const selectedIds = new Set(selected.map((e) => e.exerciseId));
  const availableCategories = Array.from(new Set(availableExercises.map((e) => e.category)));

  const filteredAvailable = availableExercises.filter((ex) => {
    const notSelected = !selectedIds.has(ex.id);
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = libCategoryFilter === "all" || ex.category === libCategoryFilter;
    return notSelected && matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (editingDurationIdx !== null) durationInputRef.current?.focus();
  }, [editingDurationIdx]);

  function setExercises(next: WizardExercise[]) {
    update({ exercises: next });
  }

  function addExercise(ex: AvailableExercise, atIndex?: number) {
    const item: WizardExercise = {
      exerciseId: ex.id,
      name: ex.name,
      category: ex.category,
      durationMinutes: ex.durationMinutes,
      overrideDuration: null,
      notes: "",
      phase: null,
      intensity: null,
    };
    if (atIndex !== undefined) {
      const next = [...selected];
      next.splice(atIndex, 0, item);
      setExercises(next);
    } else {
      setExercises([...selected, item]);
    }
  }

  function removeExercise(id: string) {
    setExercises(selected.filter((e) => e.exerciseId !== id));
  }

  function reorder(from: number, to: number) {
    const next = [...selected];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setExercises(next);
  }

  function patchItem(idx: number, patch: Partial<WizardExercise>) {
    setExercises(selected.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }

  function startEditDuration(idx: number) {
    const ex = selected[idx];
    setDurationEditValue(String(ex.overrideDuration ?? ex.durationMinutes));
    setEditingDurationIdx(idx);
  }

  function commitDurationEdit(idx: number) {
    const val = parseInt(durationEditValue, 10);
    if (!isNaN(val) && val >= 1 && val <= 300) {
      patchItem(idx, { overrideDuration: val });
    }
    setEditingDurationIdx(null);
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
    setDragSrcIdx(index);
  }

  function onTimelineItemDrop(e: DragEvent, toIndex: number) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIdx(null);
    const type = e.dataTransfer.getData("dnd-type");
    if (type === "library") {
      const id = e.dataTransfer.getData("exercise-id");
      const ex = availableExercises.find((a) => a.id === id);
      if (ex && !selectedIds.has(id)) addExercise(ex, toIndex);
    } else if (type === "reorder") {
      const from = parseInt(e.dataTransfer.getData("src-index"), 10);
      if (from !== toIndex) reorder(from, toIndex);
    }
    setDragSrcIdx(null);
  }

  function onDropZoneDrop(e: DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDropZoneActive(false);
    const type = e.dataTransfer.getData("dnd-type");
    if (type === "library") {
      const id = e.dataTransfer.getData("exercise-id");
      const ex = availableExercises.find((a) => a.id === id);
      if (ex && !selectedIds.has(id)) addExercise(ex);
    } else if (type === "reorder") {
      const from = parseInt(e.dataTransfer.getData("src-index"), 10);
      reorder(from, selected.length - 1);
    }
    setDragSrcIdx(null);
  }

  return (
    <div className="space-y-4">
      {selected.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {selected.length} ejercicio{selected.length !== 1 ? "s" : ""}
          </span>
          <span className="font-semibold text-foreground">{formatMinutes(totalDuration)}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 min-h-[440px]">
        {/* LEFT: timeline */}
        <div className="flex flex-col rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30 shrink-0">
            <CalendarDays className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Plan de entrenamiento</span>
            {totalDuration > 0 && (
              <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                <Clock className="size-3" />
                {formatMinutes(totalDuration)}
              </span>
            )}
          </div>

          <div
            className={cn(
              "flex-1 p-3 transition-colors overflow-y-auto",
              isDropZoneActive && selected.length === 0 && "bg-brand/5",
              selected.length === 0 && "flex items-center justify-center"
            )}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => {
              e.preventDefault();
              dragCounter.current++;
              setIsDropZoneActive(true);
            }}
            onDragLeave={() => {
              dragCounter.current--;
              if (dragCounter.current <= 0) {
                dragCounter.current = 0;
                setIsDropZoneActive(false);
              }
            }}
            onDrop={onDropZoneDrop}
          >
            {selected.length === 0 ? (
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
                  Arrastra ejercicios desde la biblioteca o pulsa <Plus className="size-3 inline" />
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {selected.map((ex, idx) => {
                  const effectiveDuration = ex.overrideDuration ?? ex.durationMinutes;
                  const isEditingDuration = editingDurationIdx === idx;
                  const isExpanded = expandedIdx === idx;
                  const isDragging = dragSrcIdx === idx;

                  return (
                    <div key={`${ex.exerciseId}-${idx}`}>
                      <div
                        className={cn(
                          "h-0.5 rounded-full transition-all mb-1",
                          dragOverIdx === idx ? "bg-brand" : "bg-transparent"
                        )}
                      />
                      <div
                        draggable={!isEditingDuration}
                        onDragStart={(e) => !isEditingDuration && onTimelineDragStart(e, idx)}
                        onDragEnd={() => {
                          setDragSrcIdx(null);
                          setDragOverIdx(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverIdx(idx);
                        }}
                        onDragLeave={() => setDragOverIdx(null)}
                        onDrop={(e) => onTimelineItemDrop(e, idx)}
                        className={cn(
                          "group bg-card border rounded-xl transition-all",
                          isDragging
                            ? "opacity-40 border-dashed border-border cursor-grabbing"
                            : "border-border hover:border-brand/30 hover:shadow-sm cursor-grab active:cursor-grabbing"
                        )}
                      >
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <div
                            className={cn(
                              "w-0.5 h-8 rounded-full shrink-0",
                              CATEGORY_BAR[ex.category] ?? "bg-muted"
                            )}
                          />
                          <GripVertical className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 transition-colors" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate leading-snug">
                              {ex.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={cn(
                                  "inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                                  CATEGORY_COLORS[ex.category] ?? "text-muted-foreground bg-muted"
                                )}
                              >
                                {CATEGORY_LABELS[ex.category] ?? ex.category}
                              </span>
                              {ex.phase && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-brand/10 text-brand">
                                  {PHASE_LABELS[ex.phase]}
                                </span>
                              )}
                              {ex.intensity !== null && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400">
                                  Int. {ex.intensity}
                                </span>
                              )}
                            </div>
                          </div>

                          {isEditingDuration ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                ref={durationInputRef}
                                type="number"
                                min={1}
                                max={300}
                                value={durationEditValue}
                                onChange={(e) => setDurationEditValue(e.target.value)}
                                onBlur={() => commitDurationEdit(idx)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    commitDurationEdit(idx);
                                  }
                                  if (e.key === "Escape") setEditingDurationIdx(null);
                                }}
                                className="w-14 h-7 text-xs text-center bg-background border border-brand/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
                              />
                              <span className="text-xs text-muted-foreground">min</span>
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

                          <button
                            type="button"
                            onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                            title="Ajustes"
                            className={cn(
                              "size-6 rounded-md flex items-center justify-center transition-colors shrink-0",
                              isExpanded || ex.notes || ex.phase || ex.intensity !== null
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

                        {isExpanded && (
                          <div className="px-3 pb-3 border-t border-border/40 pt-3 space-y-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Fase
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => patchItem(idx, { phase: null })}
                                  className={cn(
                                    "h-7 px-2.5 text-[10px] font-semibold rounded-full border transition-colors",
                                    ex.phase === null
                                      ? "bg-muted border-border text-foreground"
                                      : "border-transparent text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  Auto
                                </button>
                                {(Object.keys(PHASE_LABELS) as TrainingPhase[]).map((p) => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => patchItem(idx, { phase: p })}
                                    className={cn(
                                      "h-7 px-2.5 text-[10px] font-semibold rounded-full border transition-colors",
                                      ex.phase === p
                                        ? "bg-brand text-brand-foreground border-brand"
                                        : "bg-background border-border text-muted-foreground hover:text-foreground"
                                    )}
                                  >
                                    {PHASE_LABELS[p]}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Intensidad
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => patchItem(idx, { intensity: null })}
                                  className={cn(
                                    "h-7 px-2.5 text-[10px] font-semibold rounded-full border transition-colors",
                                    ex.intensity === null
                                      ? "bg-muted border-border text-foreground"
                                      : "border-transparent text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  Auto
                                </button>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => patchItem(idx, { intensity: n })}
                                    className={cn(
                                      "size-7 text-[10px] font-bold rounded-full border transition-colors",
                                      ex.intensity === n
                                        ? "bg-brand text-brand-foreground border-brand"
                                        : "bg-background border-border text-muted-foreground hover:text-foreground"
                                    )}
                                  >
                                    {n}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <textarea
                              value={ex.notes}
                              onChange={(e) => patchItem(idx, { notes: e.target.value })}
                              placeholder="Notas para este ejercicio…"
                              rows={2}
                              className="w-full text-xs bg-muted/40 border border-border/50 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground resize-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDropZoneDrop}
                  className={cn(
                    "h-10 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors mt-2",
                    isDropZoneActive ? "border-brand bg-brand/5" : "border-border/40"
                  )}
                >
                  <p className="text-xs text-muted-foreground">
                    {isDropZoneActive ? "Suelta aquí" : "Arrastra más ejercicios aquí"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: library */}
        <div className="flex flex-col rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30 shrink-0">
            <BookOpen className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Biblioteca</span>
            {filteredAvailable.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {filteredAvailable.length} disponibles
              </span>
            )}
          </div>
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
                  {cat === "all" ? "Todos" : CATEGORY_LABELS[cat] ?? cat}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/50 max-h-[360px] lg:max-h-none">
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
    </div>
  );
}
