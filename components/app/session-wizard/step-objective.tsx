"use client";

import { useState, KeyboardEvent } from "react";
import { X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardState } from "./types";

interface StepObjectiveProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  errors: Partial<Record<keyof WizardState, string>>;
}

const INTENSITY_LABELS = ["Muy suave", "Suave", "Moderada", "Alta", "Máxima"];
const INTENSITY_COLORS = [
  { bar: "bg-sky-400", text: "text-sky-400" },
  { bar: "bg-brand", text: "text-brand" },
  { bar: "bg-amber-400", text: "text-amber-400" },
  { bar: "bg-orange-400", text: "text-orange-400" },
  { bar: "bg-red-400", text: "text-red-400" },
];

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

  const intensityColor = state.intensity !== null ? INTENSITY_COLORS[state.intensity - 1] : null;

  return (
    <div className="space-y-6">
      {/* Objective */}
      <div className="space-y-2">
        <label
          htmlFor="objective"
          className="block text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          Objetivo{" "}
          <span className="text-[10px] normal-case tracking-normal font-normal text-muted-foreground">opcional</span>
        </label>
        <textarea
          id="objective"
          value={state.objective}
          onChange={(e) => update({ objective: e.target.value })}
          placeholder="¿Qué quieres conseguir con esta sesión? Ej: Mejorar la bandeja y el control de pared lateral."
          rows={3}
          maxLength={2000}
          className="w-full px-4 py-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground/50 resize-none leading-relaxed"
        />
      </div>

      {/* Intensity */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Intensidad{" "}
          <span className="text-[10px] normal-case tracking-normal font-normal text-muted-foreground">opcional</span>
        </label>

        {/* Visual bar */}
        {state.intensity !== null && (
          <div className="flex items-center gap-3 mb-3">
            <Zap className={cn("size-4 shrink-0", intensityColor?.text)} />
            <div className="flex-1 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => update({ intensity: n === state.intensity ? null : n })}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-all duration-200",
                    n <= (state.intensity ?? 0) ? intensityColor?.bar : "bg-border hover:bg-muted-foreground/30"
                  )}
                  aria-label={INTENSITY_LABELS[n - 1]}
                />
              ))}
            </div>
            {intensityColor && (
              <p className={cn("text-xs font-bold whitespace-nowrap min-w-[70px] text-right", intensityColor.text)}>
                {INTENSITY_LABELS[(state.intensity ?? 1) - 1]}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const isSelected = state.intensity === n;
            const color = INTENSITY_COLORS[n - 1];
            return (
              <button
                key={n}
                type="button"
                onClick={() => update({ intensity: isSelected ? null : n })}
                className={cn(
                  "flex items-center gap-2 h-9 px-3.5 rounded-full border text-xs font-semibold transition-all",
                  isSelected
                    ? cn(color.bar, "border-transparent text-white")
                    : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full shrink-0",
                    isSelected ? "bg-white/70" : color.bar
                  )}
                />
                <span>{n}</span>
                <span className="hidden sm:inline">{INTENSITY_LABELS[n - 1]}</span>
              </button>
            );
          })}
        </div>
        {errors.intensity && (
          <p className="text-xs text-destructive font-medium">{errors.intensity}</p>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label
          htmlFor="tag-input"
          className="block text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          Etiquetas{" "}
          <span className="text-[10px] normal-case tracking-normal font-normal text-muted-foreground">máx. 10</span>
        </label>
        <div className="flex flex-wrap gap-2 p-2.5 min-h-11 bg-background border border-border rounded-xl focus-within:ring-2 focus-within:ring-brand/40 focus-within:border-brand/50 transition-colors">
          {state.tags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="inline-flex items-center gap-1 pl-2.5 pr-1 h-7 text-xs font-semibold bg-brand/10 text-brand rounded-full"
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
            className="flex-1 min-w-[120px] h-7 px-1 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground/50"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Pulsa Enter o coma para añadir · {state.tags.length}/10
        </p>
        {errors.tags && (
          <p className="text-xs text-destructive font-medium">{errors.tags}</p>
        )}
      </div>
    </div>
  );
}
