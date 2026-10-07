"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPORTS, type Sport } from "@/lib/sports";

/**
 * Indicador siempre visible (barra lateral / cabecera móvil) del deporte
 * activo ahora mismo, con un desplegable para cambiarlo sin ir a Perfil.
 * Mismo patrón que WorkModeBadge, pero con una lista fija de deportes en
 * vez de los clubes del usuario.
 */
export function SportBadge({
  activeSport: initialActiveSport,
  className,
}: {
  activeSport: Sport;
  className?: string;
}) {
  const router = useRouter();
  const [activeSport, setActiveSportState] = useState<Sport>(
    initialActiveSport
  );
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<Sport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const active = SPORTS.find((s) => s.id === activeSport);

  async function selectSport(sport: Sport) {
    if (sport === activeSport) {
      setOpen(false);
      return;
    }
    setSaving(sport);
    setError(null);
    const res = await fetch("/api/account/sport", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport }),
    });
    if (res.ok) {
      setActiveSportState(sport);
      setOpen(false);
      router.refresh();
    } else {
      setError("No se pudo cambiar. Inténtalo de nuevo.");
    }
    setSaving(null);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border border-brand/50 bg-brand/10 px-3 py-2 text-left text-[12px] font-bold text-foreground transition-colors"
      >
        <span className="min-w-0 flex-1 truncate">
          <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.14em] opacity-55">
            Deporte
          </span>
          {active?.label ?? activeSport}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 opacity-55 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-sidebar-border bg-sidebar shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
          {SPORTS.map((sport) => (
            <button
              key={sport.id}
              type="button"
              onClick={() => selectSport(sport.id)}
              disabled={saving !== null}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2.5 text-left text-[12px] font-semibold transition-colors disabled:opacity-60",
                activeSport === sport.id
                  ? "bg-brand/10 text-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent"
              )}
            >
              {saving === sport.id ? (
                <Loader2 className="size-3.5 shrink-0 animate-spin" />
              ) : sport.status === "coming_soon" ? (
                <Clock className="size-3.5 shrink-0 opacity-60" />
              ) : (
                <span className="size-3.5 shrink-0" />
              )}
              <span className="min-w-0 flex-1 truncate">{sport.label}</span>
              {sport.status === "coming_soon" && (
                <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.1em] opacity-55">
                  Pronto
                </span>
              )}
              {activeSport === sport.id && !saving && (
                <Check className="size-3.5 shrink-0 text-brand" />
              )}
            </button>
          ))}
          {error && (
            <p className="border-t border-sidebar-border px-3 py-2 text-[11px] text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
