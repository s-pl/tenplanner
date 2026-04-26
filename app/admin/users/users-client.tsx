"use client";

import { useState, useMemo } from "react";
import {
  Shield,
  ShieldOff,
  Trash2,
  Search,
  Dumbbell,
  ClipboardList,
  Globe,
  Copy,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: string | null;
  isAdmin: boolean;
  createdAt: string;
  exerciseCount: number;
  sessionCount: number;
  globalExerciseCount: number;
}

type UserFilter = "all" | "admins" | "active";

export function AdminUsersClient({ users: initial }: { users: User[] }) {
  const [users, setUsers] = useState(initial);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    email: string;
  } | null>(null);

  const filtered = useMemo(() => {
    let rows = users;
    if (search)
      rows = rows.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.name.toLowerCase().includes(search.toLowerCase())
      );
    if (filter === "admins") rows = rows.filter((u) => u.isAdmin);
    if (filter === "active")
      rows = rows.filter((u) => u.exerciseCount > 0 || u.sessionCount > 0);
    return rows;
  }, [users, search, filter]);

  const adminCount = users.filter((u) => u.isAdmin).length;
  const activeCount = users.filter(
    (u) => u.exerciseCount > 0 || u.sessionCount > 0
  ).length;

  async function toggleAdmin(userId: string, makeAdmin: boolean) {
    setBusy(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: makeAdmin }),
      });
      if (!res.ok) throw new Error();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAdmin: makeAdmin } : u))
      );
      toast.success(makeAdmin ? "Admin asignado" : "Admin revocado");
    } catch {
      toast.error("Error al actualizar usuario");
    } finally {
      setBusy(null);
    }
  }

  async function deleteUser(userId: string) {
    setBusy(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSelected((prev) => {
        const s = new Set(prev);
        s.delete(userId);
        return s;
      });
      toast.success("Usuario eliminado");
    } catch {
      toast.error("Error al eliminar usuario");
    } finally {
      setBusy(null);
    }
  }

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      toast.success("Email copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((u) => u.id)));
    }
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40" />
        <input
          type="text"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-foreground/15 bg-foreground/[0.02] text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-brand/50"
        />
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(
          [
            ["all", `Todos (${users.length})`],
            ["admins", `Admins (${adminCount})`],
            ["active", `Activos (${activeCount})`],
          ] as [UserFilter, string][]
        ).map(([f, label]) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setSelected(new Set());
            }}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors",
              filter === f
                ? "bg-brand text-brand-foreground"
                : "bg-foreground/5 text-foreground/50 hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:hidden">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-foreground/10 px-4 py-10 text-center text-sm text-foreground/40">
            No hay usuarios
          </div>
        )}
        {filtered.map((u) => (
          <article
            key={u.id}
            className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-medium text-foreground">
                    {u.name || "—"}
                  </p>
                  {u.isAdmin && (
                    <Badge className="bg-brand/15 text-brand border-brand/20 text-[9px] py-0">
                      Admin
                    </Badge>
                  )}
                  {u.role && (
                    <Badge variant="outline" className="text-[10px]">
                      {u.role}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => void copyEmail(u.email)}
                  className="mt-1 flex max-w-full items-center gap-1 text-left text-[11px] text-foreground/45 transition-colors hover:text-foreground/70"
                >
                  <span className="truncate">{u.email}</span>
                  <Copy className="size-2.5 shrink-0" />
                </button>
              </div>
              <span className="shrink-0 text-[11px] tabular-nums text-foreground/35">
                {new Date(u.createdAt).toLocaleDateString("es-ES")}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-y border-foreground/10 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-foreground/35">
                  Ejerc.
                </p>
                <p className="mt-1 text-sm tabular-nums text-foreground/75">
                  {u.exerciseCount}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-foreground/35">
                  Global
                </p>
                <p className="mt-1 text-sm tabular-nums text-brand">
                  {u.globalExerciseCount}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-foreground/35">
                  Sesiones
                </p>
                <p className="mt-1 text-sm tabular-nums text-foreground/75">
                  {u.sessionCount}
                </p>
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => void toggleAdmin(u.id, !u.isAdmin)}
                disabled={busy === u.id}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40",
                  u.isAdmin
                    ? "bg-foreground/5 text-foreground/60"
                    : "bg-brand/10 text-brand"
                )}
              >
                {u.isAdmin ? (
                  <ShieldOff className="size-3.5" />
                ) : (
                  <Shield className="size-3.5" />
                )}
                {u.isAdmin ? "Revocar" : "Admin"}
              </button>
              <button
                onClick={() => setDeleteTarget({ id: u.id, email: u.email })}
                disabled={busy === u.id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/15 disabled:opacity-40"
              >
                <Trash2 className="size-3.5" />
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden rounded-2xl border border-foreground/10 overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-foreground/10 hover:bg-transparent">
              <TableHead className="w-10">
                <button
                  onClick={toggleSelectAll}
                  className="text-foreground/40 hover:text-foreground transition-colors"
                >
                  {allSelected ? (
                    <CheckSquare className="size-4" />
                  ) : (
                    <Square className="size-4" />
                  )}
                </button>
              </TableHead>
              <TableHead className="text-foreground/50 font-medium">
                Usuario
              </TableHead>
              <TableHead className="text-foreground/50 font-medium">
                Rol
              </TableHead>
              <TableHead className="text-foreground/50 font-medium text-center">
                Ejercicios
              </TableHead>
              <TableHead className="text-foreground/50 font-medium text-center">
                Sesiones
              </TableHead>
              <TableHead className="text-foreground/50 font-medium">
                Registro
              </TableHead>
              <TableHead className="text-foreground/50 font-medium text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-foreground/40 py-10"
                >
                  No hay usuarios
                </TableCell>
              </TableRow>
            )}
            {filtered.map((u) => (
              <TableRow
                key={u.id}
                className={cn(
                  "border-foreground/8 hover:bg-foreground/[0.02]",
                  selected.has(u.id) && "bg-brand/[0.03]"
                )}
              >
                <TableCell>
                  <button
                    onClick={() => toggleSelect(u.id)}
                    className="text-foreground/40 hover:text-brand transition-colors"
                  >
                    {selected.has(u.id) ? (
                      <CheckSquare className="size-4 text-brand" />
                    ) : (
                      <Square className="size-4" />
                    )}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground">
                          {u.name || "—"}
                        </p>
                        {u.isAdmin && (
                          <Badge className="bg-brand/15 text-brand border-brand/20 text-[9px] py-0">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <button
                        onClick={() => void copyEmail(u.email)}
                        className="flex items-center gap-1 text-[11px] text-foreground/40 hover:text-foreground/70 transition-colors group"
                      >
                        <span>{u.email}</span>
                        <Copy className="size-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {u.role ? (
                    <Badge variant="outline" className="text-[10px]">
                      {u.role}
                    </Badge>
                  ) : (
                    <span className="text-foreground/30 text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className={cn(
                        "text-xs tabular-nums flex items-center gap-1",
                        u.exerciseCount > 0
                          ? "text-foreground/70"
                          : "text-foreground/25"
                      )}
                    >
                      <Dumbbell className="size-3" /> {u.exerciseCount}
                    </span>
                    {u.globalExerciseCount > 0 && (
                      <span className="text-[10px] text-brand flex items-center gap-0.5">
                        <Globe className="size-2.5" /> {u.globalExerciseCount}{" "}
                        global{u.globalExerciseCount !== 1 ? "es" : ""}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={cn(
                      "text-xs tabular-nums flex items-center justify-center gap-1",
                      u.sessionCount > 0
                        ? "text-foreground/70"
                        : "text-foreground/25"
                    )}
                  >
                    <ClipboardList className="size-3" /> {u.sessionCount}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-foreground/40 tabular-nums">
                  {new Date(u.createdAt).toLocaleDateString("es-ES")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => void toggleAdmin(u.id, !u.isAdmin)}
                      disabled={busy === u.id}
                      title={u.isAdmin ? "Revocar admin" : "Hacer admin"}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors disabled:opacity-40",
                        u.isAdmin
                          ? "text-brand hover:text-foreground/60 hover:bg-foreground/8"
                          : "text-foreground/40 hover:text-brand hover:bg-brand/10"
                      )}
                    >
                      {u.isAdmin ? (
                        <ShieldOff className="size-4" />
                      ) : (
                        <Shield className="size-4" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        setDeleteTarget({ id: u.id, email: u.email })
                      }
                      disabled={busy === u.id}
                      title="Eliminar usuario"
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
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`¿Eliminar a ${deleteTarget?.email}?`}
        description="Esta acción es irreversible y borrará todos los datos del usuario."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (deleteTarget) void deleteUser(deleteTarget.id);
        }}
      />
    </div>
  );
}
