"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList, Dumbbell, Loader2 } from "lucide-react";
import { SPORT_OPTIONS, type Sport } from "@/lib/sport-constants";

type Step = "sport" | "section";

/**
 * Flujo de "Accede sin registrarte": primero elegir deporte (si no hay uno
 * ya guardado), luego elegir Ejercicios o Clases. No pide nada de tipo de
 * cuenta (club/monitor) — eso solo se pide al registrarse. Al llegar a
 * /exercises o /classes, el deporte ya está guardado (cookie pública o
 * cuenta) y esas páginas muestran la biblioteca directamente.
 */
export function GuestAccessFlow({
  initialSport,
}: {
  initialSport: Sport | null;
}) {
  const [sport, setSport] = useState<Sport | null>(initialSport);
  const [step, setStep] = useState<Step>(initialSport ? "section" : "sport");
  const [saving, setSaving] = useState<Sport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function chooseSport(next: Sport) {
    setSaving(next);
    setError(null);
    try {
      const res = await fetch("/api/public/sport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sport: next }),
      });
      if (!res.ok) {
        setError("No se pudo guardar tu elección. Inténtalo de nuevo.");
        return;
      }
      setSport(next);
      setStep("section");
    } finally {
      setSaving(null);
    }
  }

  const activeLabel = sport
    ? SPORT_OPTIONS.find((o) => o.id === sport)?.label
    : null;

  return (
    <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-[#F4F4F1] px-4 py-12 text-center text-[#050505] dark:bg-[#050505] dark:text-[#F4F4F1]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_50%_0%,rgba(214,255,56,0.24),transparent_38%)]" />
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg bg-[#050505] text-white shadow-[0_24px_80px_rgba(5,5,5,0.18)]">
        <div className="flex flex-col items-center gap-6 p-6 sm:p-8">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-[#D6FF38]">
              Acceso sin registro
            </p>
            {step === "sport" ? (
              <>
                <h1 className="mt-3 font-heading text-3xl font-semibold leading-tight text-white">
                  ¿Qué deporte entrenas?
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-white/62">
                  Elige un deporte para ver su biblioteca pública de ejercicios
                  y clases.
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-3 font-heading text-3xl font-semibold leading-tight text-white">
                  ¿Qué quieres ver?
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-white/62">
                  Biblioteca de {activeLabel} — elige por dónde empezar.
                </p>
              </>
            )}
          </div>

          {step === "sport" ? (
            <div className="grid w-full grid-cols-2 gap-3">
              {SPORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => chooseSport(option.id)}
                  disabled={saving !== null}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/18 px-4 text-[14px] font-black text-white transition hover:border-[#D6FF38] hover:bg-[#D6FF38] hover:text-[#050505] disabled:opacity-50"
                >
                  {saving === option.id && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <Link
                href="/exercises"
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/18 px-4 py-6 text-white transition hover:border-[#D6FF38] hover:bg-[#D6FF38] hover:text-[#050505]"
              >
                <Dumbbell className="size-6" />
                <span className="text-[15px] font-black">Ejercicios</span>
              </Link>
              <Link
                href="/classes"
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/18 px-4 py-6 text-white transition hover:border-[#D6FF38] hover:bg-[#D6FF38] hover:text-[#050505]"
              >
                <ClipboardList className="size-6" />
                <span className="text-[15px] font-black">Clases</span>
              </Link>
            </div>
          )}

          {step === "section" && (
            <button
              type="button"
              onClick={() => setStep("sport")}
              className="text-xs font-bold text-white/50 transition-colors hover:text-[#D6FF38]"
            >
              Cambiar deporte
            </button>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="h-2 bg-[#D6FF38]" />
      </div>
    </div>
  );
}
