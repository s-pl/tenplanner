"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseListItem {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  durationMinutes: number;
  imageUrl: string | null;
}

interface ExerciseListWithItems {
  id: string;
  name: string;
  emoji: string | null;
  createdAt: string;
  itemsCount: number;
  items: ExerciseListItem[];
}

interface SessionExerciseListsProps {
  selectedExerciseIds: string[];
  onApplyList: (items: ExerciseListItem[]) => void;
}

export function SessionExerciseLists({
  selectedExerciseIds,
  onApplyList,
}: SessionExerciseListsProps) {
  const [lists, setLists] = useState<ExerciseListWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedSet = useMemo(
    () => new Set(selectedExerciseIds),
    [selectedExerciseIds]
  );

  useEffect(() => {
    async function loadLists() {
      setLoading(true);
      try {
        const res = await fetch("/api/exercise-lists?includeExercises=true", {
          cache: "no-store",
        });
        const payload = (await res.json().catch(() => ({}))) as {
          data?: ExerciseListWithItems[];
        };
        setLists(Array.isArray(payload.data) ? payload.data : []);
      } finally {
        setLoading(false);
      }
    }

    void loadLists();
  }, []);

  return (
    <div className="px-3 py-3">
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : lists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
          <p className="text-sm font-medium text-foreground">
            No tienes listas guardadas todavia.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Guarda ejercicios en una lista y podras reutilizarlos aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map((list) => {
            const availableItems = list.items.filter(
              (item) => !selectedSet.has(item.id)
            );
            const alreadyAdded = list.items.length - availableItems.length;

            return (
              <div
                key={list.id}
                className="rounded-xl border border-border bg-background px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span>{list.emoji ?? "📋"}</span>
                      <p className="truncate text-sm font-medium text-foreground">
                        {list.name}
                      </p>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {list.itemsCount} ejercicio
                      {list.itemsCount !== 1 ? "s" : ""}
                      {alreadyAdded > 0
                        ? ` · ${alreadyAdded} ya en la sesion`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onApplyList(availableItems)}
                    disabled={availableItems.length === 0}
                    className={cn(
                      "inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition-colors",
                      availableItems.length > 0
                        ? "bg-brand text-brand-foreground hover:bg-brand/90"
                        : "border border-border text-muted-foreground"
                    )}
                  >
                    <Plus className="size-3" />
                    Anadir
                  </button>
                </div>

                {list.items.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {list.items.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {item.name}
                      </span>
                    ))}
                    {list.items.length > 3 ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        +{list.items.length - 3} mas
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
