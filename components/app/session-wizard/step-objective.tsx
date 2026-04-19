"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardState } from "./types";

interface StepObjectiveProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  errors: Partial<Record<keyof WizardState, string>>;
}

const INTENSITY_LABELS = ["Muy suave", "Suave", "Moderada", "Alta", "Máxima"];

export function StepObjective({ state, update, errors }: StepObjectiveProps) {
  const [tagInput, setTagInput] = useState("");

  function addTag(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (trimmed.length > 30) return;
    const lower = trimmed.toLowerCase();
    if (state.tags.some((t) => t.toLowerCase() === lower)) return;
    if (state.tags.length >= 10) return;
    update({ tags: [...state.tags, trimmed] });
    setTagInput("");
  }

  function removeTag(idx: number) {
    update({ tags: state.tags.filter((_, i) => i !== idx) });
  }

  function onTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && tagInput === "" && state.tags.length > 0) {
      removeTag(state.tags.length - 1);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="objective" className="block text-sm font-semibold text-foreground">
          Objetivo <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          id="objective"
          value={state.objective}
          onChange={(e) => update({ objective: e.target.value })}
          placeholder="¿Qué quieres conseguir con esta sesión? Ej: Mejorar la bandeja y el control de pared lateral."
          rows={4}
          maxLength={2000}
          className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-foreground">
          Intensidad <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const selected = state.intensity === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => update({ intensity: selected ? null : n })}
                className={cn(
                  "flex items-center gap-2 h-10 px-4 rounded-full border text-xs font-semibold transition-colors",
                  selected
                    ? "bg-brand text-brand-foreground border-brand"
                    : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-brand/40"
                )}
              >
                <span className="font-bold">{n}</span>
                <span>{INTENSITY_LABELS[n - 1]}</span>
              </button>
            );
          })}
        </div>
        {errors.intensity && <p className="text-xs text-destructive">{errors.intensity}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="tag-input" className="block text-sm font-semibold text-foreground">
          Etiquetas <span className="font-normal text-muted-foreground">(máx. 10)</span>
        </label>
        <div className="flex flex-wrap gap-2 p-2 min-h-11 bg-background border border-border rounded-xl focus-within:ring-2 focus-within:ring-brand/40 focus-within:border-brand/50 transition-colors">
          {state.tags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="inline-flex items-center gap-1 pl-2.5 pr-1 h-7 text-xs font-medium bg-brand/10 text-brand rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(i)}
                className="size-5 rounded-full flex items-center justify-center hover:bg-brand/20 transition-colors"
                aria-label={`Eliminar etiqueta ${tag}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
            id="tag-input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={onTagKeyDown}
            onBlur={() => tagInput && addTag(tagInput)}
            placeholder={state.tags.length === 0 ? "Ej: bandeja, derecha, presión…" : ""}
            disabled={state.tags.length >= 10}
            className="flex-1 min-w-[120px] h-7 px-1 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Pulsa Enter o coma para añadir una etiqueta. {state.tags.length}/10
        </p>
        {errors.tags && <p className="text-xs text-destructive">{errors.tags}</p>}
      </div>
    </div>
  );
}
