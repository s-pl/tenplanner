"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClassListPicker } from "./class-list-picker";

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
        className="inline-flex items-center gap-2 rounded-full bg-[#D6FF38] px-4 py-2.5 text-sm font-black text-[#050505] transition hover:bg-white active:scale-95"
      >
        <Plus className="size-4" /> Añadir a mis sesiones
      </button>
      <ClassListPicker classId={classId} />
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={busy}
        aria-label={fav ? "Quitar de favoritos" : "Añadir a favoritos"}
        className={cn(
          "flex size-10 items-center justify-center rounded-full border transition-colors",
          fav
            ? "border-[#D6FF38]/60 bg-[#D6FF38]/15 text-[#D6FF38]"
            : "border-white/16 text-white/55 hover:border-[#D6FF38] hover:text-[#D6FF38]",
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
