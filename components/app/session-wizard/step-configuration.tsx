"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
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

export function StepConfiguration({
  state,
  update,
  errors,
}: StepConfigurationProps) {
  const [studentsOpen, setStudentsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Always-visible basics: title, date, duration, location */}
      <StepBasics state={state} update={update} errors={errors} />

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* Always-visible: objective, intensity, tags */}
      <StepObjective state={state} update={update} errors={errors} />

      {/* Alumnos — optional accordion, stays collapsed by default */}
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
  );
}
