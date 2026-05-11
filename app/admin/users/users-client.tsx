"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ArrowLeft,
  ArrowRight,
  Download,
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
import {
  adminActionClass,
  adminInputClass,
  adminTableShellClass,
} from "../_components/admin-ui";

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

interface Props {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
  q: string;
  filter: UserFilter;
}

function buildHref(opts: { q?: string; filter?: string; page?: number }) {
  const p = new URLSearchParams();
  if (opts.q) p.set("q", opts.q);
  if (opts.filter && opts.filter !== "all") p.set("filter", opts.filter);
  if (opts.page && opts.page > 1) p.set("page", String(opts.page));
  const qs = p.toString();
  return `/admin/users${qs ? `?${qs}` : ""}`;
}

export function AdminUsersClient({
  users: initial,
  total,
  page,
  totalPages,
  q,
  filter,
}: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [searchDraft, setSearchDraft] = useState(q);

  function navigate(opts: { q?: string; filter?: string; page?: number }) {
    router.push(buildHref(opts));
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ q: searchDraft, filter, page: 1 });
  }

  function exportCsv() {
    const header =
      "Nombre,Email,Rol,Admin,Ejercicios,Globales,Sesiones,Registro";
    const rows = users.map((u) =>
      [
        `"${(u.name ?? "").replace(/"/g, '""')}"`,
        `"${u.email.replace(/"/g, '""')}"`,
        `"${(u.role ?? "").replace(/"/g, '""')}"`,
        u.isAdmin ? "Sí" : "No",
        u.exerciseCount,
        u.globalExerciseCount,
        u.sessionCount,
        new Date(u.createdAt).toLocaleDateString("es-ES"),
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
    if (selected.size === users.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map((u) => u.id)));
    }
  }

  const allSelected = users.length > 0 && selected.size === users.length;

  const filters: [UserFilter, string][] = [
    ["all", "Todos"],
    ["admins", "Admins"],
    ["active", "Activos"],
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40" />
        <input
          type="text"
          placeholder="Buscar por nombre o email…"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          className={cn(adminInputClass, "w-full pl-9 pr-4")}
        />
      </form>

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filters.map(([f, label]) => (
          <Link
            key={f}
            href={buildHref({ q, filter: f, page: 1 })}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap",
              filter === f
                ? "bg-[#D6FF38] text-[#050505]"
                : "bg-card text-foreground/55 ring-1 ring-foreground/10 hover:text-foreground"
            )}
          >
            {label}
          </Link>
        ))}
        <span className="ml-auto text-[11px] text-foreground/35 tabular-nums">
          {total.toLocaleString("es-ES")} total
        </span>
        <button
          onClick={exportCsv}
          title="Exportar página actual a CSV"
          className={cn(adminActionClass, "h-7 px-2.5 text-[11px]")}
        >
          <Download className="size-3" />
          CSV
        </button>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {users.length === 0 && (
          <div className="rounded-lg border border-foreground/12 bg-card/80 px-4 py-10 text-center text-sm text-foreground/40">
            No hay usuarios
          </div>
        )}
        {users.map((u) => (
          <article
            key={u.id}
            className="rounded-lg border border-foreground/12 bg-card/90 p-4"
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

      {/* Desktop table */}
      <div className={cn(adminTableShellClass, "hidden md:block")}>
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
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-foreground/40 py-10"
                >
                  No hay usuarios
                </TableCell>
              </TableRow>
            )}
            {users.map((u) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <footer className="flex items-center justify-between pt-1">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/45 tabular-nums">
            Pág. {page} / {totalPages}
          </p>
          <div className="flex items-center gap-4">
            {page > 1 ? (
              <Link
                href={buildHref({ q, filter, page: page - 1 })}
                className="inline-flex items-center gap-1.5 text-[12px] text-foreground/70 hover:text-brand transition-colors"
              >
                <ArrowLeft className="size-3" /> Anterior
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground/25">
                <ArrowLeft className="size-3" /> Anterior
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={buildHref({ q, filter, page: page + 1 })}
                className="inline-flex items-center gap-1.5 text-[12px] text-foreground/70 hover:text-brand transition-colors"
              >
                Siguiente <ArrowRight className="size-3" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground/25">
                Siguiente <ArrowRight className="size-3" />
              </span>
            )}
          </div>
        </footer>
      )}

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
