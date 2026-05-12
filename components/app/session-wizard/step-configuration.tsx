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
  places: { id: string; name: string }[];
  monitorName?: string;
}

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

  return (
    <div className="sticky top-6">
      <p className="mb-3 pl-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Vista previa
      </p>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="space-y-4 p-5">
          <p
            className={cn(
              "font-heading text-xl font-semibold leading-snug",
              hasTitle ? "text-foreground" : "text-muted-foreground/30 italic"
            )}
          >
            {hasTitle ? state.title : "Título de la sesión"}
          </p>

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

          {(state.objective ||
            state.material ||
            state.observations ||
            state.tags.length > 0 ||
            state.studentIds.length > 0) && (
            <div className="border-t border-border/40" />
          )}

          {state.objective && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Objetivo
              </p>
              <p className="line-clamp-3 text-xs leading-relaxed text-foreground/65">
                {state.objective}
              </p>
            </div>
          )}

          {state.material && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Material
              </p>
              <p className="line-clamp-2 text-xs leading-relaxed text-foreground/65">
                {state.material}
              </p>
            </div>
          )}

          {state.observations && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Observaciones
              </p>
              <p className="line-clamp-2 text-xs leading-relaxed text-foreground/65">
                {state.observations}
              </p>
            </div>
          )}

          {state.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {state.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex h-5 items-center gap-1 rounded-full bg-brand/10 px-2 text-[10px] font-semibold text-brand"
                >
                  <Tag className="size-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}

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
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_252px]">
      <div className="flex min-w-0 flex-col gap-6">
        <StepBasics state={state} update={update} errors={errors} />

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
            <p className="text-xs italic text-muted-foreground">
              Aún no tienes lugares.{" "}
              <a
                href="/places"
                className="font-semibold text-brand hover:underline"
              >
                Crear lugar
              </a>
            </p>
          ) : (
            <select
              id="placeId"
              value={state.placeId ?? ""}
              onChange={(e) =>
                update({ placeId: e.target.value ? e.target.value : null })
              }
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50"
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
              Entrenador
            </label>
            <div className="flex h-11 cursor-not-allowed items-center rounded-xl border border-border bg-muted/40 px-4 text-sm text-foreground/80">
              {monitorName}
            </div>
          </div>
        )}

        <div className="border-t border-border/40" />

        <StepObjective state={state} update={update} errors={errors} />

        <div className="rounded-2xl border border-border bg-card">
          <button
            type="button"
            onClick={() => setStudentsOpen((v) => !v)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
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

        <RecurrenceBlock state={state} update={update} />
      </div>

      <div className="hidden lg:block">
        <SessionPreview state={state} />
      </div>
    </div>
  );
}

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
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
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
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
              ? `Cada semana durante ${r.weeks} semanas${r.weekdays.length > 1 ? " - varios días" : ""}`
              : "Crea esta misma sesión los próximos días que indiques"}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex h-6 w-11 items-center rounded-full border transition-colors",
            r.enabled ? "border-brand bg-brand" : "border-border bg-muted"
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
        <div className="space-y-4 border-t border-border px-4 py-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                        ? "border-brand bg-brand text-brand-foreground"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {r.weekdays.length === 0 && baseWeekday !== null && (
              <p className="mt-2 text-[11px] italic text-muted-foreground">
                Si no eliges días, se usará el mismo día que la primera sesión.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="recurrence-weeks"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
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
              className="h-10 w-24 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50"
            />
            <span className="ml-2 text-xs text-muted-foreground">
              semanas (incluida la primera)
            </span>
          </div>

          <p className="text-[12px] italic text-muted-foreground">
            Se crearán automáticamente todas las sesiones para los días
            seleccionados. Después podrás editarlas o cancelarlas
            individualmente.
          </p>
        </div>
      )}
    </div>
  );
}
