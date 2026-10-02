"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  FileText,
  ImageIcon,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ResourceFormDialog,
  type ResourceData,
} from "@/components/app/resource-form-dialog";
import { cn } from "@/lib/utils";

type SubTab = "all" | "favorites";

export function ResourcesPanel({ userId }: { userId: string }) {
  const [resources, setResources] = useState<ResourceData[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<SubTab>("all");
  const [dialogState, setDialogState] = useState<{
    resource: ResourceData | null;
  } | null>(null);
  const [toDelete, setToDelete] = useState<ResourceData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/resources");
        if (!res.ok) throw new Error("failed");
        const json = (await res.json()) as { data: ResourceData[] };
        if (active) setResources(json.data);
      } catch {
        if (active) setLoadError("No se pudieron cargar tus recursos.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function handleSaved(saved: ResourceData) {
    setResources((prev) => {
      const list = prev ?? [];
      const exists = list.some((r) => r.id === saved.id);
      return exists
        ? list.map((r) => (r.id === saved.id ? saved : r))
        : [saved, ...list];
    });
  }

  async function toggleFavorite(resource: ResourceData) {
    setTogglingId(resource.id);
    setActionError(null);
    const next = !resource.isFavorite;
    setResources(
      (prev) =>
        prev?.map((r) =>
          r.id === resource.id ? { ...r, isFavorite: next } : r
        ) ?? prev
    );
    try {
      const res = await fetch(`/api/resources/${resource.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: next }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setResources(
        (prev) =>
          prev?.map((r) =>
            r.id === resource.id ? { ...r, isFavorite: !next } : r
          ) ?? prev
      );
      setActionError("No se pudo actualizar el favorito.");
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteResource(resource: ResourceData) {
    setDeletingId(resource.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/resources/${resource.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("failed");
      setResources((prev) => prev?.filter((r) => r.id !== resource.id) ?? prev);
    } catch {
      setActionError("No se pudo eliminar el recurso. Inténtalo de nuevo.");
    } finally {
      setDeletingId(null);
    }
  }

  const list = resources ?? [];
  const visible =
    subTab === "favorites" ? list.filter((r) => r.isFavorite) : list;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full border border-foreground/10 bg-background p-1">
          {(
            [
              { id: "all" as SubTab, label: "Todos" },
              { id: "favorites" as SubTab, label: "Favoritos" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSubTab(id)}
              className={cn(
                "rounded-full px-4 py-2 text-[13px] font-black transition-colors",
                subTab === id
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDialogState({ resource: null })}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-black text-brand-foreground transition-colors hover:bg-brand/90"
        >
          <Plus className="size-4" />
          Nuevo recurso
        </button>
      </div>

      {loadError && (
        <p className="text-sm font-medium text-destructive">{loadError}</p>
      )}
      {actionError && (
        <p className="text-sm font-medium text-destructive">{actionError}</p>
      )}

      {resources === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <div className="tp-panel border-dashed p-8 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            {subTab === "favorites"
              ? "Aún no tienes recursos favoritos."
              : "Aún no has añadido recursos. Guarda enlaces, documentos o imágenes útiles para tu labor."}
          </p>
          <button
            type="button"
            onClick={() => setDialogState({ resource: null })}
            className="inline-flex items-center gap-1.5 text-sm font-black text-brand transition-colors hover:text-brand/80"
          >
            <Plus className="size-4" />
            Añadir recurso
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visible.map((r) => (
            <div key={r.id} className="tp-panel space-y-3 p-4">
              <div className="flex items-start gap-3">
                {r.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- stored/external url preview
                  <img
                    src={r.imageUrl}
                    alt={r.title}
                    className="size-12 shrink-0 rounded-xl object-cover border border-foreground/10"
                  />
                ) : (
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-foreground/10 bg-background text-muted-foreground">
                    {r.documentUrl ? (
                      <FileText className="size-5" />
                    ) : (
                      <Link2 className="size-5" />
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">
                    {r.title}
                  </p>
                  {r.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {r.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void toggleFavorite(r)}
                  disabled={togglingId === r.id}
                  aria-label={
                    r.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"
                  }
                  title={
                    r.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"
                  }
                  className="shrink-0 text-muted-foreground transition-colors hover:text-brand disabled:opacity-50"
                >
                  {r.isFavorite ? (
                    <Star className="size-4.5 fill-brand text-brand" />
                  ) : (
                    <Star className="size-4.5" />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:border-brand/40 hover:text-brand"
                  >
                    <Link2 className="size-3.5" />
                    Enlace
                    <ExternalLink className="size-3" />
                  </a>
                )}
                {r.documentUrl && (
                  <a
                    href={r.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:border-brand/40 hover:text-brand"
                  >
                    <FileText className="size-3.5" />
                    {r.documentName ?? "Documento"}
                  </a>
                )}
                {!r.url && !r.documentUrl && r.imageUrl && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 px-3 py-1.5 text-xs font-bold text-muted-foreground">
                    <ImageIcon className="size-3.5" />
                    Imagen
                  </span>
                )}

                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDialogState({ resource: r })}
                    aria-label={`Editar ${r.title}`}
                    title="Editar recurso"
                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(r)}
                    disabled={deletingId === r.id}
                    aria-label={`Eliminar ${r.title}`}
                    title="Eliminar recurso"
                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    {deletingId === r.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {dialogState && (
        <ResourceFormDialog
          key={dialogState.resource?.id ?? "new"}
          open
          onOpenChange={(open) => {
            if (!open) setDialogState(null);
          }}
          userId={userId}
          resource={dialogState.resource}
          onSaved={handleSaved}
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title="¿Eliminar este recurso?"
        description={
          toDelete ? `“${toDelete.title}” se eliminará de tu lista.` : undefined
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (toDelete) void deleteResource(toDelete);
        }}
      />
    </div>
  );
}
