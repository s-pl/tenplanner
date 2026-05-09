"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassActionsProps {
  classId: string;
  initialFavorite: boolean;
}

export function ClassActions({ classId, initialFavorite }: ClassActionsProps) {
  const router = useRouter();
  const [fav, setFav] = useState(initialFavorite);
  const [busy, setBusy] = useState(false);

  async function toggleFavorite() {
    setBusy(true);
    const method = fav ? "DELETE" : "POST";
    const res = await fetch(`/api/classes/${classId}/favorite`, { method });
    if (res.ok) setFav(!fav);
    setBusy(false);
  }

  function addToSession() {
    // De momento redirige a /sessions/new con un parámetro fromClass.
    // El wizard de sesión usará el parámetro para precargar bloques.
    router.push(`/sessions/new?fromClass=${classId}`);
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={addToSession}
        className="inline-flex items-center gap-2 bg-brand text-brand-foreground text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand/90 active:scale-95 transition-all duration-150"
      >
        <Plus className="size-4" /> Añadir a mis sesiones
      </button>
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={busy}
        aria-label={fav ? "Quitar de favoritos" : "Añadir a favoritos"}
        className={cn(
          "size-10 rounded-xl border flex items-center justify-center transition-colors",
          fav
            ? "border-pink-500/40 bg-pink-500/10 text-pink-500"
            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
          busy && "opacity-60"
        )}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Heart
            className={cn("size-4", fav && "fill-current")}
            strokeWidth={1.6}
          />
        )}
      </button>
    </div>
  );
}
