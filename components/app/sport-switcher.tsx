"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPORTS, type Sport } from "@/lib/sports";

/** Panel de perfil para elegir el deporte activo. Mismo patrón que WorkModeSwitcher. */
export function SportSwitcher({
  activeSport: initialActiveSport,
}: {
  activeSport: Sport;
}) {
  const router = useRouter();
  const [activeSport, setActiveSport] = useState<Sport>(initialActiveSport);
  const [saving, setSaving] = useState<Sport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectSport(sport: Sport) {
    if (sport === activeSport) return;
    setSaving(sport);
    setError(null);
    const res = await fetch("/api/account/sport", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport }),
    });
    if (res.ok) {
      setActiveSport(sport);
      router.refresh();
    } else {
      setError("No se pudo cambiar de deporte. Inténtalo de nuevo.");
    }
    setSaving(null);
  }

  const active = SPORTS.find((s) => s.id === activeSport);

  return (
    <div className="tp-panel space-y-3 p-5 sm:p-6">
      <div>
        <h2 className="text-sm font-black uppercase text-foreground">
          Deporte
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-foreground/55">
          Elige qué deporte ves en la biblioteca y en los formularios.
          Pádel y pickleball comparten la misma plataforma pero aún no
          tienen contenido propio.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {SPORTS.map((sport) => (
          <button
            key={sport.id}
            type="button"
            onClick={() => selectSport(sport.id)}
            disabled={saving !== null}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60",
              activeSport === sport.id
                ? "border-brand bg-brand/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {saving === sport.id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : sport.status === "coming_soon" ? (
              <Clock className="size-4" />
            ) : null}
            {sport.label}
            {sport.status === "coming_soon" && (
              <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-foreground/55">
                Pronto
              </span>
            )}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {active?.status === "coming_soon" && (
        <p className="text-xs text-foreground/50">
          Estamos preparando el contenido de <strong>{active.label}</strong>.
          Mientras tanto verás una pantalla de aviso en vez de la biblioteca.
        </p>
      )}
    </div>
  );
}
