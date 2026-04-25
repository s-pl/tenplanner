"use client";

import { useState, useMemo } from "react";
import { Shield, ShieldOff, Trash2, Search } from "lucide-react";
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

interface User {
  id: string;
  name: string;
  email: string;
  role: string | null;
  isAdmin: boolean;
  createdAt: string;
}

export function AdminUsersClient({ users: initial }: { users: User[] }) {
  const [users, setUsers] = useState(initial);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.name.toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
  );

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

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`¿Eliminar al usuario ${email}? Esta acción es irreversible.`))
      return;
    setBusy(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("Usuario eliminado");
    } catch {
      toast.error("Error al eliminar usuario");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
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

      <div className="rounded-2xl border border-foreground/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-foreground/10 hover:bg-transparent">
              <TableHead className="text-foreground/50 font-medium">Usuario</TableHead>
              <TableHead className="text-foreground/50 font-medium">Rol</TableHead>
              <TableHead className="text-foreground/50 font-medium">Admin</TableHead>
              <TableHead className="text-foreground/50 font-medium">Registro</TableHead>
              <TableHead className="text-foreground/50 font-medium text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-foreground/40 py-10">
                  No hay usuarios
                </TableCell>
              </TableRow>
            )}
            {filtered.map((u) => (
              <TableRow key={u.id} className="border-foreground/8 hover:bg-foreground/[0.02]">
                <TableCell>
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-foreground/40">{u.email}</p>
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
                <TableCell>
                  {u.isAdmin ? (
                    <Badge className="bg-brand/15 text-brand border-brand/20 text-[10px]">
                      Admin
                    </Badge>
                  ) : (
                    <span className="text-foreground/30 text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-foreground/40">
                  {new Date(u.createdAt).toLocaleDateString("es-ES")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => void toggleAdmin(u.id, !u.isAdmin)}
                      disabled={busy === u.id}
                      title={u.isAdmin ? "Revocar admin" : "Hacer admin"}
                      className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/8 transition-colors disabled:opacity-40"
                    >
                      {u.isAdmin ? (
                        <ShieldOff className="size-4" />
                      ) : (
                        <Shield className="size-4" />
                      )}
                    </button>
                    <button
                      onClick={() => void deleteUser(u.id, u.email)}
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
    </div>
  );
}
