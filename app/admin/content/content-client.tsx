"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Trash2, Search, Globe, Lock, Loader2, ExternalLink,
  Filter, CheckSquare, Square, Bot, Clock, BarChart2,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Exercise {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  durationMinutes: number;
  isGlobal: boolean;
  isAiGenerated: boolean;
  createdAt: string;
  createdByEmail: string | null;
  createdByName: string | null;
  usageCount: number;
}

interface Session {
  id: string;
  title: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number | null;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
  exerciseCount: number;
}

const DIFF_LABEL: Record<string, string> = {
  beginner: "Inicio",
  intermediate: "Medio",
  advanced: "Avanzado",
};

const CAT_LABEL: Record<string, string> = {
  technique: "Técnica",
  tactics: "Táctica",
  fitness: "Físico",
  "warm-up": "Calentamiento",
};

const CAT_COLOR: Record<string, string> = {
  technique: "text-blue-400 border-blue-400/30 bg-blue-400/8",
  tactics: "text-purple-400 border-purple-400/30 bg-purple-400/8",
  fitness: "text-amber-400 border-amber-400/30 bg-amber-400/8",
  "warm-up": "text-brand border-brand/30 bg-brand/8",
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada",
  draft: "Borrador",
};

type ExFilter = "all" | "global" | "private" | "ai";

export function AdminContentClient({
  exercises: initialExercises,
  sessions: initialSessions,
}: {
  exercises: Exercise[];
  sessions: Session[];
}) {
  const [exercises, setExercises] = useState(initialExercises);
  const [sessions] = useState(initialSessions);
  const [search, setSearch] = useState("");
  const [exFilter, setExFilter] = useState<ExFilter>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const filteredExercises = useMemo(() => {
    let rows = exercises;
    if (search) rows = rows.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()) || (e.createdByName ?? "").toLowerCase().includes(search.toLowerCase()));
    if (exFilter === "global") rows = rows.filter((e) => e.isGlobal);
    if (exFilter === "private") rows = rows.filter((e) => !e.isGlobal);
    if (exFilter === "ai") rows = rows.filter((e) => e.isAiGenerated);
    return rows;
  }, [exercises, search, exFilter]);

  const filteredSessions = useMemo(
    () => sessions.filter((s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.userName ?? "").toLowerCase().includes(search.toLowerCase())
    ),
    [sessions, search]
  );

  const globalCount = exercises.filter((e) => e.isGlobal).length;
  const aiCount = exercises.filter((e) => e.isAiGenerated).length;

  async function toggleGlobal(id: string, makeGlobal: boolean) {
    setBusy(id);
    try {
      const res = await fetch(`/api/exercises/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isGlobal: makeGlobal }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error");
      }
      setExercises((prev) => prev.map((e) => e.id === id ? { ...e, isGlobal: makeGlobal } : e));
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast.success(makeGlobal ? "Publicado globalmente" : "Marcado como privado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setBusy(null);
    }
  }

  async function bulkToggleGlobal(makeGlobal: boolean) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBusy("bulk");
    let ok = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`/api/exercises/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isGlobal: makeGlobal }),
        });
        if (res.ok) {
          setExercises((prev) => prev.map((e) => e.id === id ? { ...e, isGlobal: makeGlobal } : e));
          ok++;
        }
      } catch { /* continue */ }
    }
    setSelected(new Set());
    setBusy(null);
    toast.success(`${ok} ejercicio${ok !== 1 ? "s" : ""} ${makeGlobal ? "publicados" : "marcados privados"}`);
  }

  async function deleteExercise(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/exercises/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setExercises((prev) => prev.filter((e) => e.id !== id));
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast.success("Ejercicio eliminado");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setBusy(null);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filteredExercises.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredExercises.map((e) => e.id)));
    }
  }

  const allSelected = filteredExercises.length > 0 && selected.size === filteredExercises.length;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40" />
        <input
          type="text"
          placeholder="Buscar por nombre o autor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-foreground/15 bg-foreground/[0.02] text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-brand/50"
        />
      </div>

      <Tabs defaultValue="exercises">
        <TabsList className="bg-foreground/5 border border-foreground/10">
          <TabsTrigger value="exercises">
            Ejercicios ({filteredExercises.length})
          </TabsTrigger>
          <TabsTrigger value="sessions">
            Sesiones ({filteredSessions.length})
          </TabsTrigger>
        </TabsList>

        {/* ── EXERCISES ── */}
        <TabsContent value="exercises" className="mt-4 space-y-3">
          {/* Filter pills + stats */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="size-3.5 text-foreground/40 shrink-0" />
              {(["all", "global", "private", "ai"] as ExFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => { setExFilter(f); setSelected(new Set()); }}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors",
                    exFilter === f
                      ? "bg-brand text-brand-foreground"
                      : "bg-foreground/5 text-foreground/50 hover:text-foreground"
                  )}
                >
                  {f === "all" ? `Todos (${exercises.length})` :
                   f === "global" ? `Globales (${globalCount})` :
                   f === "private" ? `Privados (${exercises.length - globalCount})` :
                   `IA (${aiCount})`}
                </button>
              ))}
            </div>

            {/* Bulk actions */}
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground/50">{selected.size} seleccionado{selected.size !== 1 ? "s" : ""}</span>
                <button
                  onClick={() => void bulkToggleGlobal(true)}
                  disabled={busy === "bulk"}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand/10 text-brand text-xs font-medium hover:bg-brand/20 transition-colors disabled:opacity-50"
                >
                  <Globe className="size-3" /> Publicar todos
                </button>
                <button
                  onClick={() => void bulkToggleGlobal(false)}
                  disabled={busy === "bulk"}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-foreground/5 text-foreground/60 text-xs font-medium hover:bg-foreground/10 transition-colors disabled:opacity-50"
                >
                  <Lock className="size-3" /> Privar todos
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-foreground/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-foreground/10 hover:bg-transparent">
                  <TableHead className="w-10">
                    <button onClick={toggleSelectAll} className="text-foreground/40 hover:text-foreground transition-colors">
                      {allSelected ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                    </button>
                  </TableHead>
                  <TableHead className="text-foreground/50">Ejercicio</TableHead>
                  <TableHead className="text-foreground/50">Categoría</TableHead>
                  <TableHead className="text-foreground/50">Autor</TableHead>
                  <TableHead className="text-foreground/50 text-center">Uso</TableHead>
                  <TableHead className="text-foreground/50 text-center">Duración</TableHead>
                  <TableHead className="text-foreground/50">Estado</TableHead>
                  <TableHead className="text-foreground/50">Creado</TableHead>
                  <TableHead className="text-foreground/50 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExercises.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-foreground/40 py-10">
                      No hay ejercicios
                    </TableCell>
                  </TableRow>
                )}
                {filteredExercises.map((e) => (
                  <TableRow
                    key={e.id}
                    className={cn(
                      "border-foreground/8 hover:bg-foreground/[0.02] transition-colors",
                      selected.has(e.id) && "bg-brand/[0.03]"
                    )}
                  >
                    <TableCell>
                      <button onClick={() => toggleSelect(e.id)} className="text-foreground/40 hover:text-brand transition-colors">
                        {selected.has(e.id) ? <CheckSquare className="size-4 text-brand" /> : <Square className="size-4" />}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{e.name}</p>
                          <p className="text-xs text-foreground/40">{DIFF_LABEL[e.difficulty] ?? e.difficulty}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] border", CAT_COLOR[e.category])}>
                        {CAT_LABEL[e.category] ?? e.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-foreground/70">{e.createdByName ?? "—"}</p>
                      {e.createdByEmail && (
                        <p className="text-[10px] text-foreground/35">{e.createdByEmail}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("text-xs tabular-nums", e.usageCount > 0 ? "text-foreground/70" : "text-foreground/25")}>
                        {e.usageCount > 0 ? (
                          <span className="flex items-center justify-center gap-1">
                            <BarChart2 className="size-3" /> {e.usageCount}
                          </span>
                        ) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs text-foreground/50 tabular-nums flex items-center justify-center gap-1">
                        <Clock className="size-3" /> {e.durationMinutes}min
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {e.isGlobal ? (
                          <Badge className="bg-brand/10 text-brand border-brand/20 text-[10px] gap-1">
                            <Globe className="size-2.5" /> Global
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] gap-1 text-foreground/40">
                            <Lock className="size-2.5" /> Privado
                          </Badge>
                        )}
                        {e.isAiGenerated && (
                          <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px] gap-1">
                            <Bot className="size-2.5" /> IA
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-foreground/40 tabular-nums">
                      {new Date(e.createdAt).toLocaleDateString("es-ES")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/exercises/${e.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/8 transition-colors"
                          title="Ver ejercicio"
                        >
                          <ExternalLink className="size-4" />
                        </Link>
                        <button
                          onClick={() => void toggleGlobal(e.id, !e.isGlobal)}
                          disabled={busy === e.id || busy === "bulk"}
                          title={e.isGlobal ? "Hacer privado" : "Publicar globalmente"}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors disabled:opacity-40",
                            e.isGlobal
                              ? "text-brand hover:text-foreground/60 hover:bg-foreground/8"
                              : "text-foreground/40 hover:text-brand hover:bg-brand/10"
                          )}
                        >
                          {busy === e.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : e.isGlobal ? (
                            <Lock className="size-4" />
                          ) : (
                            <Globe className="size-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: e.id, name: e.name })}
                          disabled={busy === e.id || busy === "bulk"}
                          title="Eliminar ejercicio"
                          className="p-1.5 rounded-lg text-foreground/40 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── SESSIONS ── */}
        <TabsContent value="sessions" className="mt-4">
          <div className="rounded-2xl border border-foreground/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-foreground/10 hover:bg-transparent">
                  <TableHead className="text-foreground/50">Sesión</TableHead>
                  <TableHead className="text-foreground/50">Estado</TableHead>
                  <TableHead className="text-foreground/50">Entrenador</TableHead>
                  <TableHead className="text-foreground/50 text-center">Ejercicios</TableHead>
                  <TableHead className="text-foreground/50 text-center">Duración</TableHead>
                  <TableHead className="text-foreground/50">Fecha sesión</TableHead>
                  <TableHead className="text-foreground/50">Creada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-foreground/40 py-10">
                      No hay sesiones
                    </TableCell>
                  </TableRow>
                )}
                {filteredSessions.map((s) => (
                  <TableRow key={s.id} className="border-foreground/8 hover:bg-foreground/[0.02]">
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{s.title}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          s.status === "completed" && "text-brand border-brand/30",
                          s.status === "cancelled" && "text-red-400 border-red-400/30",
                        )}
                      >
                        {STATUS_LABEL[s.status] ?? s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-foreground/70">{s.userName ?? "—"}</p>
                      {s.userEmail && (
                        <p className="text-[10px] text-foreground/35">{s.userEmail}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-xs text-foreground/50 tabular-nums">
                      {s.exerciseCount > 0 ? s.exerciseCount : "—"}
                    </TableCell>
                    <TableCell className="text-center text-xs text-foreground/50 tabular-nums">
                      {s.durationMinutes ? `${s.durationMinutes}min` : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-foreground/40 tabular-nums">
                      {new Date(s.scheduledAt).toLocaleDateString("es-ES")}
                    </TableCell>
                    <TableCell className="text-xs text-foreground/40 tabular-nums">
                      {new Date(s.createdAt).toLocaleDateString("es-ES")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={`¿Eliminar "${deleteTarget?.name}"?`}
        description="Esta acción es irreversible y no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => { if (deleteTarget) void deleteExercise(deleteTarget.id); }}
      />
    </div>
  );
}
