"use client";

import { useMemo, useState } from "react";
import { Plus, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  DEV_TASK_ASSIGNEES,
  DEV_TASK_ASSIGNEE_LABELS,
  type DevTaskAssignee,
  type DevTaskStatus,
} from "@/lib/dev-tasks";
import { adminPanelClass } from "../_components/admin-ui";

export interface DevTaskData {
  id: string;
  title: string;
  description: string;
  assignedTo: DevTaskAssignee;
  status: DevTaskStatus;
  startDate: string | null;
  endDate: string | null;
  observaciones: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = "todas" | DevTaskStatus;
type WhoFilter = "todos" | DevTaskAssignee;

function fmtDate(iso: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

function emptyDraft(): {
  title: string;
  description: string;
  assignedTo: DevTaskAssignee | null;
  status: DevTaskStatus;
  startDate: string;
  endDate: string;
  observaciones: string;
} {
  return {
    title: "",
    description: "",
    assignedTo: null,
    status: "pendiente",
    startDate: "",
    endDate: "",
    observaciones: "",
  };
}

export function IncidenciasClient({
  initialTasks,
}: {
  initialTasks: DevTaskData[];
}) {
  const [tasks, setTasks] = useState<DevTaskData[]>(initialTasks);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");
  const [whoFilter, setWhoFilter] = useState<WhoFilter>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DevTaskData | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const pendientes = tasks.filter((t) => t.status === "pendiente").length;
    const resueltas = tasks.filter((t) => t.status === "resuelto").length;
    return { pendientes, resueltas, total: tasks.length };
  }, [tasks]);

  const visible = useMemo(
    () =>
      tasks.filter((t) => {
        if (statusFilter !== "todas" && t.status !== statusFilter) return false;
        if (whoFilter !== "todos" && t.assignedTo !== whoFilter) return false;
        return true;
      }),
    [tasks, statusFilter, whoFilter]
  );

  function openCreate() {
    setEditing(null);
    setDraft(emptyDraft());
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(task: DevTaskData) {
    setEditing(task);
    setDraft({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      status: task.status,
      startDate: task.startDate ?? "",
      endDate: task.endDate ?? "",
      observaciones: task.observaciones ?? "",
    });
    setError(null);
    setDialogOpen(true);
  }

  async function submit() {
    if (!draft.title.trim() || !draft.description.trim() || !draft.assignedTo) {
      setError("Completa título, descripción y a quién se asigna.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      assignedTo: draft.assignedTo,
      status: draft.status,
      startDate: draft.startDate || null,
      endDate: draft.endDate || null,
      observaciones: draft.observaciones.trim() || null,
    };

    try {
      const res = await fetch(
        editing ? `/api/admin/dev-tasks/${editing.id}` : "/api/admin/dev-tasks",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { data: DevTaskData };

      setTasks((prev) =>
        editing
          ? prev.map((t) => (t.id === json.data.id ? json.data : t))
          : [json.data, ...prev]
      );
      setDialogOpen(false);
      toast.success(editing ? "Tarea actualizada" : "Tarea creada");
    } catch {
      setError("No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/admin/dev-tasks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (editing?.id === id) setDialogOpen(false);
      toast.success("Tarea eliminada");
    } catch {
      toast.error("No se pudo eliminar. Inténtalo de nuevo.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Pendientes" value={counts.pendientes} tone="pending" />
        <StatTile label="Resueltas" value={counts.resueltas} tone="resolved" />
        <StatTile label="Total" value={counts.total} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={statusFilter === "todas"}
            onClick={() => setStatusFilter("todas")}
          >
            Todas
          </FilterChip>
          <FilterChip
            active={statusFilter === "pendiente"}
            onClick={() => setStatusFilter("pendiente")}
          >
            Pendientes
          </FilterChip>
          <FilterChip
            active={statusFilter === "resuelto"}
            onClick={() => setStatusFilter("resuelto")}
          >
            Resueltas
          </FilterChip>
          <span className="mx-1 w-px self-stretch bg-foreground/10" />
          <FilterChip
            active={whoFilter === "todos"}
            onClick={() => setWhoFilter("todos")}
          >
            Todos
          </FilterChip>
          {DEV_TASK_ASSIGNEES.map((a) => (
            <FilterChip
              key={a}
              active={whoFilter === a}
              onClick={() => setWhoFilter(a)}
            >
              {DEV_TASK_ASSIGNEE_LABELS[a]}
            </FilterChip>
          ))}
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="size-4" />
          Nueva incidencia
        </Button>
      </div>

      <div className={cn(adminPanelClass, "divide-y divide-foreground/10")}>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-1 px-5 py-14 text-center">
            <p className="font-heading text-sm font-semibold text-foreground">
              {tasks.length === 0
                ? "Todavía no hay incidencias"
                : "Nada con este filtro"}
            </p>
            <p className="text-xs text-foreground/52">
              {tasks.length === 0
                ? "Crea la primera para empezar a seguirle la pista."
                : "Prueba a cambiar el filtro de estado o persona."}
            </p>
          </div>
        ) : (
          visible.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => openEdit(task)}
              className="flex w-full flex-col gap-2 px-5 py-4 text-left transition-colors hover:bg-brand/6"
            >
              <div className="flex items-start justify-between gap-3">
                <p
                  className={cn(
                    "min-w-0 font-heading text-sm font-semibold text-foreground",
                    task.status === "resuelto" &&
                      "text-foreground/45 line-through"
                  )}
                >
                  {task.title}
                </p>
                <Badge
                  variant={task.status === "resuelto" ? "secondary" : "default"}
                  className={cn(
                    "shrink-0",
                    task.status === "pendiente" &&
                      "bg-amber-500/14 text-amber-700 dark:text-amber-400"
                  )}
                >
                  {task.status === "resuelto" ? "Resuelto" : "Pendiente"}
                </Badge>
              </div>
              <p className="line-clamp-2 text-xs leading-5 text-foreground/60">
                {task.description}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/48">
                <span className="font-semibold text-foreground/70">
                  {DEV_TASK_ASSIGNEE_LABELS[task.assignedTo]}
                </span>
                {(task.startDate || task.endDate) && (
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Calendar className="size-3" />
                    {fmtDate(task.startDate) ?? "?"}
                    {task.endDate ? ` → ${fmtDate(task.endDate)}` : ""}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar incidencia" : "Nueva incidencia"}
            </DialogTitle>
            <DialogDescription>
              Título, descripción y asignación son obligatorios.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field label="Título" required>
              <Input
                value={draft.title}
                maxLength={255}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, title: e.target.value }))
                }
                placeholder="Ej: Arreglar export de PDF de sesiones"
              />
            </Field>

            <Field label="Descripción" required>
              <Textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, description: e.target.value }))
                }
                rows={3}
              />
            </Field>

            <Field label="Asignado a" required>
              <div className="flex flex-wrap gap-2">
                {DEV_TASK_ASSIGNEES.map((a) => (
                  <SegButton
                    key={a}
                    active={draft.assignedTo === a}
                    onClick={() => setDraft((d) => ({ ...d, assignedTo: a }))}
                  >
                    {DEV_TASK_ASSIGNEE_LABELS[a]}
                  </SegButton>
                ))}
              </div>
            </Field>

            <Field label="Estado" required>
              <div className="flex flex-wrap gap-2">
                <SegButton
                  active={draft.status === "pendiente"}
                  onClick={() =>
                    setDraft((d) => ({ ...d, status: "pendiente" }))
                  }
                  tone="pending"
                >
                  Pendiente
                </SegButton>
                <SegButton
                  active={draft.status === "resuelto"}
                  onClick={() =>
                    setDraft((d) => ({ ...d, status: "resuelto" }))
                  }
                  tone="resolved"
                >
                  Resuelto
                </SegButton>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha inicio" hint="opcional">
                <Input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, startDate: e.target.value }))
                  }
                />
              </Field>
              <Field label="Fecha fin" hint="opcional">
                <Input
                  type="date"
                  value={draft.endDate}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, endDate: e.target.value }))
                  }
                />
              </Field>
            </div>

            <Field label="Observaciones" hint="opcional">
              <Textarea
                value={draft.observaciones}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, observaciones: e.target.value }))
                }
                rows={2}
                placeholder="Notas al resolver la incidencia..."
              />
            </Field>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter className="justify-between sm:justify-between">
            {editing ? (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmDeleteId(editing.id)}
              >
                <Trash2 className="size-4" />
                Eliminar
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={submit} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="¿Eliminar esta incidencia?"
        description="No se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (confirmDeleteId) void remove(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "pending" | "resolved";
}) {
  return (
    <div className={cn(adminPanelClass, "p-4")}>
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/42">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-heading text-3xl font-black leading-none",
          tone === "pending" && "text-amber-600 dark:text-amber-400",
          tone === "resolved" && "text-emerald-600 dark:text-emerald-400",
          !tone && "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
        active
          ? "border-brand bg-brand text-brand-foreground"
          : "border-foreground/12 bg-card text-foreground/60 hover:border-brand/50 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function SegButton({
  active,
  onClick,
  children,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "pending" | "resolved";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex-1 min-w-24 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
        !active && "border-foreground/12 bg-card text-foreground/70",
        active && !tone && "border-brand bg-brand text-brand-foreground",
        active &&
          tone === "pending" &&
          "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-400",
        active &&
          tone === "resolved" &&
          "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      )}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
        {hint && (
          <span className="ml-1 font-normal normal-case text-foreground/40">
            ({hint})
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
