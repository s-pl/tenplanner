"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Search, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudentOption, WizardState } from "./types";

interface StepStudentsProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}

type LoadStatus = "loading" | "ready" | "unavailable";

export function StepStudents({ state, update }: StepStudentsProps) {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/students", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setStatus("unavailable");
          return;
        }
        const payload = (await res.json()) as { data?: StudentOption[] };
        if (cancelled) return;
        setStudents(Array.isArray(payload?.data) ? payload.data : []);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("unavailable");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleStudent(id: string) {
    const set = new Set(state.studentIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    update({ studentIds: Array.from(set) });
  }

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin mr-2" />
        <span className="text-sm">Cargando alumnos…</span>
      </div>
    );
  }

  if (status === "unavailable" || students.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-12 px-4 rounded-2xl border border-dashed border-border">
        <Users className="size-10 text-muted-foreground mb-3" />
        <p className="text-sm font-semibold text-foreground mb-1">
          Aún no tienes alumnos
        </p>
        <p className="text-xs text-muted-foreground mb-5 max-w-sm">
          Puedes crear la sesión sin asignar alumnos o añadirlos más tarde.
        </p>
        <Link
          href="/students/new"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 transition-colors"
        >
          <UserPlus className="size-4" />
          Añadir alumno
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Selecciona los alumnos para esta sesión.
        </p>
        <span className="text-xs font-semibold text-foreground">
          {state.studentIds.length} seleccionado
          {state.studentIds.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar alumnos…"
          className="w-full h-10 pl-10 pr-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map((s) => {
          const selected = state.studentIds.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleStudent(s.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors",
                selected
                  ? "border-brand bg-brand/5"
                  : "border-border bg-background hover:border-brand/40"
              )}
            >
              <div
                className={cn(
                  "size-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                  selected ? "bg-brand border-brand" : "border-border"
                )}
              >
                {selected && (
                  <Check className="size-3.5 text-brand-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {s.name}
                </p>
                {s.playerLevel && (
                  <p className="text-xs text-muted-foreground truncate">
                    {s.playerLevel}
                  </p>
                )}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground col-span-full text-center py-6">
            Sin resultados para &ldquo;{search}&rdquo;
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Este paso es opcional, puedes continuar sin seleccionar alumnos.
      </p>
    </div>
  );
}
