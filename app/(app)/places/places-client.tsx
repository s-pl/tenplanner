"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Place = {
  id: string;
  name: string;
  description: string | null;
};

interface PlacesClientProps {
  initialPlaces: Place[];
}

type EditState =
  | { mode: "idle" }
  | { mode: "create" }
  | { mode: "edit"; placeId: string };

export function PlacesClient({ initialPlaces }: PlacesClientProps) {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>(initialPlaces);
  const [edit, setEdit] = useState<EditState>({ mode: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const editing =
    edit.mode === "edit" ? places.find((p) => p.id === edit.placeId) : null;

  async function handleSave(formData: FormData) {
    setError(null);
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    if (!name) {
      setError("El nombre es obligatorio.");
      return;
    }

    const payload = { name, description: description || null };

    if (edit.mode === "create") {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo crear el lugar.");
        return;
      }
      const { data } = await res.json();
      setPlaces((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setEdit({ mode: "idle" });
      startTransition(() => router.refresh());
    } else if (edit.mode === "edit") {
      const res = await fetch(`/api/places/${edit.placeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo actualizar el lugar.");
        return;
      }
      const { data } = await res.json();
      setPlaces((prev) =>
        prev
          .map((p) => (p.id === data.id ? data : p))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEdit({ mode: "idle" });
      startTransition(() => router.refresh());
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar este lugar? Las sesiones que lo usen quedarán sin lugar asignado.")) {
      return;
    }
    const res = await fetch(`/api/places/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo borrar el lugar.");
      return;
    }
    setPlaces((prev) => prev.filter((p) => p.id !== id));
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
            № 07
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl italic text-foreground leading-tight">
            Lugares
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-prose">
            Pistas, salas, gimnasios… Lo que uses al impartir. Aparecerán como
            opción al crear una sesión.
          </p>
        </div>
        {edit.mode === "idle" && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setEdit({ mode: "create" });
            }}
            className="inline-flex shrink-0 items-center gap-2 bg-brand text-brand-foreground text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand/90 active:scale-95 transition-all duration-150"
          >
            <Plus className="size-4" /> Nuevo lugar
          </button>
        )}
      </div>

      {edit.mode !== "idle" && (
        <form
          action={handleSave}
          className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl text-foreground">
              {edit.mode === "create" ? "Nuevo lugar" : "Editar lugar"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setEdit({ mode: "idle" });
                setError(null);
              }}
              className="size-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Cancelar"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-foreground"
            >
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={120}
              defaultValue={editing?.name ?? ""}
              placeholder="Ej: Pista 1"
              className="w-full h-11 px-4 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-foreground"
            >
              Descripción{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={2000}
              defaultValue={editing?.description ?? ""}
              placeholder="Notas, ubicación, materiales disponibles…"
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 bg-brand text-brand-foreground text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand/90 active:scale-95 transition-all duration-150 disabled:opacity-60"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {edit.mode === "create" ? "Crear lugar" : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEdit({ mode: "idle" });
                setError(null);
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {places.length === 0 && edit.mode === "idle" ? (
        <div className="border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground/60 mb-3">
            Inventario · vacío
          </p>
          <p className="font-heading italic text-2xl text-foreground/70 max-w-md mx-auto">
            Aún no has creado ningún lugar.
          </p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Crea “Pista 1”, “Pista 2” o lo que uses para tus sesiones.
          </p>
        </div>
      ) : (
        <ul
          className={cn(
            "grid gap-px bg-border border border-border",
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {places.map((place, idx) => (
            <li
              key={place.id}
              className="group relative bg-card p-5 hover:bg-foreground/[0.025] transition-colors min-h-[140px]"
            >
              <span
                aria-hidden
                className="absolute top-3 right-4 font-heading italic text-foreground/[0.05] text-[5rem] leading-none select-none tabular-nums group-hover:text-brand/[0.1] transition-colors"
              >
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-brand mb-2">
                    Lugar
                  </p>
                  <p className="font-heading italic text-xl text-foreground truncate leading-tight">
                    {place.name}
                  </p>
                  {place.description && (
                    <p className="text-[12.5px] text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                      {place.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setEdit({ mode: "edit", placeId: place.id });
                    }}
                    className="size-7 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label={`Editar ${place.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(place.id)}
                    className="size-7 flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    aria-label={`Borrar ${place.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
