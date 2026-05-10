"use client";

import { useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
  Repeat,
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
  places?: { id: string; name: string }[];
  monitorName?: string;
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
      ? {
          bar: INTENSITY_BAR[state.intensity - 1],
          text: INTENSITY_TEXT[state.intensity - 1],
        }
      : null;

  return (
    <div className="sticky top-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 pl-1">
        Vista previa
      </p>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
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
              <span className="text-xs text-foreground/70">
                {state.durationMinutes} min
              </span>
            </div>
            {state.location && (
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 shrink-0 text-brand" />
                <span className="text-xs text-foreground/70">
                  {state.location}
                </span>
              </div>
            )}
          </div>

          {/* Divider */}
          {(state.objective ||
            state.intensity !== null ||
            state.tags.length > 0 ||
            state.studentIds.length > 0) && (
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
                        n <= (state.intensity ?? 0)
                          ? intensityColor.bar
                          : "bg-border"
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

export function StepConfiguration({
  state,
  update,
  errors,
  places = [],
  monitorName,
}: StepConfigurationProps) {
  const [studentsOpen, setStudentsOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_252px] gap-8">
      {/* Left: form fields */}
      <div className="flex flex-col gap-6 min-w-0">
        <StepBasics state={state} update={update} errors={errors} />

        {/* Lugar (PMV) */}
        <div className="space-y-1.5">
          <label
            htmlFor="placeId"
            className="block text-sm font-semibold text-foreground"
          >
            Lugar{" "}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>
          {places.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Aún no tienes lugares.{" "}
              <a
                href="/places"
                className="text-brand font-semibold hover:underline"
              >
                Crear lugar →
              </a>
            </p>
          ) : (
            <select
              id="placeId"
              value={state.placeId ?? ""}
              onChange={(e) =>
                update({ placeId: e.target.value ? e.target.value : null })
              }
              className="w-full h-11 px-4 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 text-foreground"
            >
              <option value="">Sin lugar asignado</option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {monitorName && (
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">
              Monitor
            </label>
            <div className="flex items-center h-11 px-4 text-sm bg-muted/40 border border-border rounded-xl text-foreground/80 cursor-not-allowed">
              {monitorName}
            </div>
          </div>
        )}

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

        {/* Recurrencia (PMV: "todos los lunes…") */}
        <RecurrenceBlock state={state} update={update} />
      </div>

      {/* Right: live preview (desktop only) */}
      <div className="hidden lg:block">
        <SessionPreview state={state} />
      </div>
    </div>
  );
}

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
// Map from display index (Monday-first) to JS Date getDay value (Sunday=0).
const WEEKDAY_TO_JSDAY = [1, 2, 3, 4, 5, 6, 0];

function RecurrenceBlock({
  state,
  update,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}) {
  const r = state.recurrence;
  const scheduled = new Date(state.scheduledAt);
  const baseWeekday = isNaN(scheduled.getTime())
    ? null
    : scheduled.getDay();

  function toggleEnabled(next: boolean) {
    update({
      recurrence: {
        ...r,
        enabled: next,
        weekdays:
          r.weekdays.length === 0 && baseWeekday !== null
            ? [baseWeekday]
            : r.weekdays,
      },
    });
  }

  function toggleWeekday(jsDay: number) {
    const has = r.weekdays.includes(jsDay);
    update({
      recurrence: {
        ...r,
        weekdays: has
          ? r.weekdays.filter((d) => d !== jsDay)
          : [...r.weekdays, jsDay],
      },
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => toggleEnabled(!r.enabled)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Repeat className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Repetir sesión
          </p>
          <p className="text-xs text-muted-foreground">
            {r.enabled
              ? `Cada semana durante ${r.weeks} semanas${r.weekdays.length > 1 ? " · varios días" : ""}`
              : "Crea esta misma sesión los próximos días que indiques"}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex h-6 w-11 items-center rounded-full border transition-colors",
            r.enabled
              ? "bg-brand border-brand"
              : "bg-muted border-border"
          )}
        >
          <span
            className={cn(
              "size-5 rounded-full bg-background transition-transform",
              r.enabled ? "translate-x-5" : "translate-x-0.5"
            )}
          />
        </span>
      </button>

      {r.enabled && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Días de la semana
            </p>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_LABELS.map((label, i) => {
                const jsDay = WEEKDAY_TO_JSDAY[i];
                const active = r.weekdays.includes(jsDay);
                return (
                  <button
                    key={jsDay}
                    type="button"
                    onClick={() => toggleWeekday(jsDay)}
                    className={cn(
                      "size-9 rounded-lg border text-sm font-semibold transition-colors",
                      active
                        ? "bg-brand text-brand-foreground border-brand"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {r.weekdays.length === 0 && baseWeekday !== null && (
              <p className="text-[11px] text-muted-foreground mt-2 italic">
                Si no eliges días, se usará el mismo día que la primera sesión.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="recurrence-weeks"
              className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2"
            >
              Durante cuántas semanas
            </label>
            <input
              id="recurrence-weeks"
              type="number"
              min={2}
              max={52}
              value={r.weeks}
              onChange={(e) =>
                update({
                  recurrence: {
                    ...r,
                    weeks: Math.min(
                      52,
                      Math.max(2, parseInt(e.target.value, 10) || 2)
                    ),
                  },
                })
              }
              className="w-24 h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 text-foreground"
            />
            <span className="ml-2 text-xs text-muted-foreground">
              semanas (incluida la primera)
            </span>
          </div>

          <p className="text-[12px] text-muted-foreground italic">
            Se crearán automáticamente todas las sesiones para los días
            seleccionados. Después podrás editarlas o cancelarlas
            individualmente.
          </p>
        </div>
      )}
    </div>
  );
}
