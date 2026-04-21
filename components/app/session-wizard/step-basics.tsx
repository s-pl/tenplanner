"use client";

import { Minus, Plus } from "lucide-react";
import { DateTimePicker } from "@/components/app/date-time-picker";
import { cn } from "@/lib/utils";
import { LOCATION_OPTIONS, type WizardState } from "./types";

interface StepBasicsProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  errors: Partial<Record<keyof WizardState, string>>;
}

export function StepBasics({ state, update, errors }: StepBasicsProps) {
  function bumpDuration(delta: number) {
    const next = Math.max(5, Math.min(600, state.durationMinutes + delta));
    update({ durationMinutes: next });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="title"
          className="block text-sm font-semibold text-foreground"
        >
          Título <span className="text-destructive">*</span>
        </label>
        <input
          id="title"
          type="text"
          placeholder="Ej: Entrenamiento de técnica ofensiva"
          autoComplete="off"
          value={state.title}
          onChange={(e) => update({ title: e.target.value })}
          aria-invalid={!!errors.title}
          className={cn(
            "w-full h-11 px-4 text-sm bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground font-medium",
            errors.title ? "border-destructive" : "border-border"
          )}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">
            Fecha y hora <span className="text-destructive">*</span>
          </label>
          <DateTimePicker
            value={state.scheduledAt}
            onChange={(v) => update({ scheduledAt: v })}
            error={!!errors.scheduledAt}
          />
          {errors.scheduledAt && (
            <p className="text-xs text-destructive">{errors.scheduledAt}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">
            Duración (minutos) <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => bumpDuration(-5)}
              className="size-10 shrink-0 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Disminuir duración"
            >
              <Minus className="size-4" />
            </button>
            <input
              type="number"
              min={5}
              max={600}
              value={state.durationMinutes}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) update({ durationMinutes: v });
              }}
              className="w-full h-10 text-center text-sm font-semibold bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground"
            />
            <button
              type="button"
              onClick={() => bumpDuration(5)}
              className="size-10 shrink-0 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Aumentar duración"
            >
              <Plus className="size-4" />
            </button>
          </div>
          {errors.durationMinutes && (
            <p className="text-xs text-destructive">{errors.durationMinutes}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-foreground">
          Ubicación{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {LOCATION_OPTIONS.map((loc) => {
            const selected = state.location === loc;
            return (
              <button
                key={loc}
                type="button"
                onClick={() => update({ location: selected ? "" : loc })}
                className={cn(
                  "h-9 px-3.5 text-xs font-semibold rounded-full border transition-colors",
                  selected
                    ? "bg-brand text-brand-foreground border-brand"
                    : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-brand/40"
                )}
              >
                {loc}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
