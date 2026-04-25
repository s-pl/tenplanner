"use client";

import { useState, useMemo } from "react";
import { Trash2, Search, Globe, Lock, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Exercise {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  isGlobal: boolean;
  isAiGenerated: boolean;
  createdAt: string;
  createdByEmail: string | null;
  createdByName: string | null;
}

interface Session {
  id: string;
  title: string;
  status: string;
  scheduledAt: string;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
}

export function AdminContentClient({
  exercises: initialExercises,
  sessions: initialSessions,
}: {
  exercises: Exercise[];
  sessions: Session[];
}) {
  const [exercises, setExercises] = useState(initialExercises);
  const [sessions, setSessions] = useState(initialSessions);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const filteredExercises = useMemo(
    () =>
      exercises.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase())
      ),
    [exercises, search]
  );

  const filteredSessions = useMemo(
    () =>
      sessions.filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase())
      ),
    [sessions, search]
  );

  async function toggleGlobal(id: string, makeGlobal: boolean) {
    setBusy(id);
    try {
      const res = await fetch(`/api/exercises/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isGlobal: makeGlobal }),
      });
      if (!res.ok) throw new Error();
      setExercises((prev) => prev.map((e) => e.id === id ? { ...e, isGlobal: makeGlobal } : e));
      toast.success(makeGlobal ? "Publicado globalmente" : "Marcado como privado");
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setBusy(null);
    }
  }

  async function deleteExercise(id: string, name: string) {
    if (!confirm(`¿Eliminar el ejercicio "${name}"?`)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/exercises/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setExercises((prev) => prev.filter((e) => e.id !== id));
      toast.success("Ejercicio eliminado");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setBusy(null);
    }
  }

  async function deleteSession(id: string, title: string) {
    if (!confirm(`¿Eliminar la sesión "${title}"?`)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Sesión eliminada");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setBusy(null);
    }
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

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40" />
        <input
          type="text"
          placeholder="Buscar…"
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

        <TabsContent value="exercises" className="mt-4">
          <div className="rounded-2xl border border-foreground/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-foreground/10 hover:bg-transparent">
                  <TableHead className="text-foreground/50">Ejercicio</TableHead>
                  <TableHead className="text-foreground/50">Categoría</TableHead>
                  <TableHead className="text-foreground/50">Autor</TableHead>
                  <TableHead className="text-foreground/50">Tipo</TableHead>
                  <TableHead className="text-foreground/50 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExercises.map((e) => (
                  <TableRow key={e.id} className="border-foreground/8 hover:bg-foreground/[0.02]">
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{e.name}</p>
                      <p className="text-xs text-foreground/40">
                        {DIFF_LABEL[e.difficulty] ?? e.difficulty}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {CAT_LABEL[e.category] ?? e.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-foreground/50">
                      {e.createdByName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {e.isGlobal && (
                          <Badge className="bg-brand/10 text-brand border-brand/20 text-[10px] gap-1">
                            <Globe className="size-2.5" /> Global
                          </Badge>
                        )}
                        {!e.isGlobal && (
                          <Badge variant="outline" className="text-[10px] gap-1 text-foreground/40">
                            <Lock className="size-2.5" /> Privado
                          </Badge>
                        )}
                        {e.isAiGenerated && (
                          <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">
                            IA
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => void toggleGlobal(e.id, !e.isGlobal)}
                          disabled={busy === e.id}
                          title={e.isGlobal ? "Hacer privado" : "Publicar globalmente"}
                          className="p-1.5 rounded-lg text-foreground/40 hover:text-brand hover:bg-brand/10 transition-colors disabled:opacity-40"
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
                          onClick={() => void deleteExercise(e.id, e.name)}
                          disabled={busy === e.id}
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

        <TabsContent value="sessions" className="mt-4">
          <div className="rounded-2xl border border-foreground/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-foreground/10 hover:bg-transparent">
                  <TableHead className="text-foreground/50">Sesión</TableHead>
                  <TableHead className="text-foreground/50">Estado</TableHead>
                  <TableHead className="text-foreground/50">Entrenador</TableHead>
                  <TableHead className="text-foreground/50">Fecha</TableHead>
                  <TableHead className="text-foreground/50 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((s) => (
                  <TableRow key={s.id} className="border-foreground/8 hover:bg-foreground/[0.02]">
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{s.title}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${s.status === "completed" ? "text-brand border-brand/30" : s.status === "cancelled" ? "text-red-400 border-red-400/30" : ""}`}
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-foreground/50">
                      {s.userName ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-foreground/40">
                      {new Date(s.scheduledAt).toLocaleDateString("es-ES")}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => void deleteSession(s.id, s.title)}
                        disabled={busy === s.id}
                        className="p-1.5 rounded-lg text-foreground/40 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
