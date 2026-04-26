"use client";

import { useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
  Tag,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StepBasics } from "./step-basics";
import { StepObjective } from "./step-objective";
import { StepStudents } from "./step-students";
import type { WizardState } from "./types";

interface StepConfigurationProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  errors: Partial<Record<keyof WizardState, string>>;
}

const INTENSITY_LABELS = ["Muy suave", "Suave", "Moderada", "Alta", "Máxima"];
const INTENSITY_BAR = [
  "bg-sky-400",
  "bg-brand",
  "bg-amber-400",
  "bg-orange-400",
  "bg-red-400",
];
const INTENSITY_TEXT = [
  "text-sky-400",
  "text-brand",
  "text-amber-400",
  "text-orange-400",
  "text-red-400",
];

function formatScheduledAt(scheduledAt: string): string {
  try {
    const d = new Date(scheduledAt);
    if (isNaN(d.getTime())) return "Sin fecha";
    return d.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Sin fecha";
  }
}

function SessionPreview({ state }: { state: WizardState }) {
  const hasTitle = !!state.title.trim();
  const intensityColor =
    state.intensity !== null
      ? { bar: INTENSITY_BAR[state.intensity - 1], text: INTENSITY_TEXT[state.intensity - 1] }
      : null;

  return (
    <div className="sticky top-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 pl-1">
        Vista previa
      </p>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Top accent stripe */}
        <div className="h-1 bg-gradient-to-r from-brand via-brand/50 to-transparent" />

        <div className="p-5 space-y-4">
          {/* Title */}
          <p
            className={cn(
              "font-heading text-xl font-semibold leading-snug",
              hasTitle ? "text-foreground" : "text-muted-foreground/30 italic"
            )}
          >
            {hasTitle ? state.title : "Título de la sesión"}
          </p>

          {/* Meta */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Calendar className="size-3.5 shrink-0 text-brand" />
              <span className="text-xs text-foreground/70">
                {formatScheduledAt(state.scheduledAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 shrink-0 text-brand" />
              <span className="text-xs text-foreground/70">{state.durationMinutes} min</span>
            </div>
            {state.location && (
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 shrink-0 text-brand" />
                <span className="text-xs text-foreground/70">{state.location}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          {(state.objective || state.intensity !== null || state.tags.length > 0 || state.studentIds.length > 0) && (
            <div className="border-t border-border/40" />
          )}

          {/* Objective */}
          {state.objective && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                Objetivo
              </p>
              <p className="text-xs text-foreground/65 leading-relaxed line-clamp-3">
                {state.objective}
              </p>
            </div>
          )}

          {/* Intensity */}
          {state.intensity !== null && intensityColor && (
            <div className="flex items-center gap-3">
              <Zap className={cn("size-3.5 shrink-0", intensityColor.text)} />
              <div className="flex-1">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className={cn(
                        "h-1.5 flex-1 rounded-full",
                        n <= (state.intensity ?? 0) ? intensityColor.bar : "bg-border"
                      )}
                    />
                  ))}
                </div>
                <p className={cn("text-[10px] font-bold", intensityColor.text)}>
                  {INTENSITY_LABELS[(state.intensity ?? 1) - 1]}
                </p>
              </div>
            </div>
          )}

          {/* Tags */}
          {state.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {state.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 pl-2 pr-2 h-5 text-[10px] font-semibold bg-brand/10 text-brand rounded-full"
                >
                  <Tag className="size-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Students */}
          {state.studentIds.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="size-3.5 text-brand" />
              <span>
                {state.studentIds.length} alumno
                {state.studentIds.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/40 text-center mt-3">
        Actualización en tiempo real
      </p>
    </div>
  );
}

export function StepConfiguration({ state, update, errors }: StepConfigurationProps) {
  const [studentsOpen, setStudentsOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_252px] gap-8">
      {/* Left: form fields */}
      <div className="flex flex-col gap-6 min-w-0">
        <StepBasics state={state} update={update} errors={errors} />

        <div className="border-t border-border/40" />

        <StepObjective state={state} update={update} errors={errors} />

        {/* Students accordion */}
        <div className="rounded-2xl border border-border bg-card">
          <button
            type="button"
            onClick={() => setStudentsOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Users className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Alumnos</p>
              <p className="text-xs text-muted-foreground">
                {state.studentIds.length > 0
                  ? `${state.studentIds.length} alumno${state.studentIds.length !== 1 ? "s" : ""} asignado${state.studentIds.length !== 1 ? "s" : ""}`
                  : "Asigna alumnos a esta sesión (opcional)"}
              </p>
            </div>
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors",
                studentsOpen && "bg-muted text-foreground"
              )}
            >
              {studentsOpen ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </div>
          </button>

          {studentsOpen && (
            <div className="border-t border-border px-4 py-4">
              <StepStudents state={state} update={update} />
            </div>
          )}
        </div>
      </div>

      {/* Right: live preview (desktop only) */}
      <div className="hidden lg:block">
        <SessionPreview state={state} />
      </div>
    </div>
  );
}
