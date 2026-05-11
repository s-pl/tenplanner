"use client";

import { useEffect, useState } from "react";
import { FolderPlus, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ClassList = {
  id: string;
  name: string;
  emoji: string | null;
  itemsCount: number;
  containsClass: boolean;
};

export function ClassListPicker({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ClassList[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  async function loadLists() {
    setLoading(true);
    try {
      const res = await fetch(`/api/class-lists?classId=${classId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setLists(Array.isArray(data.data) ? data.data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => void loadLists(), 0);
    return () => window.clearTimeout(id);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleList(list: ClassList) {
    setBusyId(list.id);
    try {
      await fetch(`/api/class-lists/${list.id}/items`, {
        method: list.containsClass ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId }),
      });
      await loadLists();
    } finally {
      setBusyId(null);
    }
  }

  async function createList() {
    const name = newName.trim();
    if (!name) return;
    setLoading(true);
    try {
      const res = await fetch("/api/class-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      const created = data.data as { id: string } | undefined;
      if (created?.id) {
        await fetch(`/api/class-lists/${created.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classId }),
        });
      }
      setNewName("");
      setShowNew(false);
      await loadLists();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Guardar en lista"
        className="size-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <FolderPlus className="size-4" strokeWidth={1.7} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Listas de clases
                </p>
                <p className="text-xs text-muted-foreground">
                  Guarda esta clase en una coleccion propia.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Cerrar"
              >
                <X className="mx-auto size-4" />
              </button>
            </div>

            <div className="max-h-[360px] overflow-y-auto p-4">
              {loading && lists.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" /> Cargando
                </div>
              ) : lists.length === 0 && !showNew ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Sin listas todavia
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Crea una para agrupar clases por metodologia o grupo.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lists.map((list) => (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => toggleList(list)}
                      disabled={busyId === list.id}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors",
                        list.containsClass
                          ? "border-brand/35 bg-brand/8"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      <span>
                        <span className="block text-sm font-semibold text-foreground">
                          {list.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {list.itemsCount} clases
                        </span>
                      </span>
                      {busyId === list.id ? (
                        <Loader2 className="size-4 animate-spin text-brand" />
                      ) : (
                        <span className="text-xs font-semibold text-brand">
                          {list.containsClass ? "Guardada" : "Anadir"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {showNew && (
                <div className="mt-3 rounded-xl border border-border bg-background p-3">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Nueva lista
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ej: Adultos iniciacion"
                      className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/35"
                    />
                    <button
                      type="button"
                      onClick={createList}
                      disabled={loading || !newName.trim()}
                      className="rounded-lg bg-brand px-3 text-xs font-semibold text-brand-foreground disabled:opacity-50"
                    >
                      Crear
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <Plus className="size-3.5" /> Nueva lista
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
