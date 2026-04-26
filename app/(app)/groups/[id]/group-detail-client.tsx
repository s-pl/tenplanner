"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserPlus,
  UserMinus,
  Trash2,
  Loader2,
  Users,
  Search,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Iniciación",
  amateur: "Amateur",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  competitive: "Competitivo",
};

const LEVEL_COLOR: Record<string, string> = {
  beginner: "bg-sky-500/10 text-sky-400",
  amateur: "bg-emerald-500/10 text-emerald-400",
  intermediate: "bg-brand/10 text-brand",
  advanced: "bg-violet-500/10 text-violet-400",
  competitive: "bg-amber-500/10 text-amber-400",
};

interface Student {
  id: string;
  name: string;
  imageUrl: string | null;
  playerLevel: string | null;
}

interface Props {
  groupId: string;
  groupName: string;
  members: Student[];
  availableStudents: Student[];
}

function Avatar({
  name,
  imageUrl,
  size = 36,
}: {
  name: string;
  imageUrl: string | null;
  size?: number;
}) {
  const text = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-full bg-brand/15 text-brand font-bold flex items-center justify-center shrink-0 select-none"
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {text}
    </span>
  );
}

export function GroupDetailClient({
  groupId,
  groupName,
  members,
  availableStudents,
}: Props) {
  const router = useRouter();
  const [currentMembers, setCurrentMembers] = useState(members);
  const [available, setAvailable] = useState(availableStudents);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [search, setSearch] = useState("");

  const filteredAvailable = available.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  async function addStudent(student: Student) {
    setLoadingId(student.id);
    const newMembers = [...currentMembers, student].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const res = await fetch(`/api/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentIds: newMembers.map((m) => m.id) }),
    });
    if (res.ok) {
      setCurrentMembers(newMembers);
      setAvailable((prev) => prev.filter((s) => s.id !== student.id));
    }
    setLoadingId(null);
  }

  async function removeStudent(studentId: string) {
    setLoadingId(studentId);
    const newMembers = currentMembers.filter((m) => m.id !== studentId);
    const res = await fetch(`/api/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentIds: newMembers.map((m) => m.id) }),
    });
    if (res.ok) {
      const removed = currentMembers.find((m) => m.id === studentId)!;
      setCurrentMembers(newMembers);
      setAvailable((prev) =>
        [...prev, removed].sort((a, b) => a.name.localeCompare(b.name))
      );
    }
    setLoadingId(null);
  }

  async function deleteGroup() {
    setDeletingGroup(true);
    const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/groups");
      router.refresh();
    }
    setDeletingGroup(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
      {/* Members roster */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-brand" />
            <h2 className="font-bold text-[13px] text-foreground uppercase tracking-wide">
              Equipo
            </h2>
          </div>
          <span className="inline-flex items-center gap-1 bg-brand/10 text-brand px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums">
            {currentMembers.length}
          </span>
        </div>

        {currentMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="size-12 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center">
              <Users className="size-5 text-foreground/20" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/40">
                Sin alumnos todavía
              </p>
              <p className="text-xs text-foreground/25 mt-0.5">
                Añade alumnos desde el panel de la derecha.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {currentMembers.map((m, i) => (
              <div
                key={m.id}
                className="group/row flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/20 sm:px-5"
              >
                {/* Position number */}
                <span className="font-mono text-[10px] text-foreground/20 tabular-nums w-5 shrink-0 text-right">
                  {(i + 1).toString().padStart(2, "0")}
                </span>

                <Avatar name={m.name} imageUrl={m.imageUrl} size={34} />

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/students/${m.id}`}
                    className="text-[14px] font-semibold text-foreground hover:text-brand transition-colors truncate flex items-center gap-1 group/link"
                  >
                    {m.name}
                    <ChevronRight className="size-3 opacity-0 group-hover/link:opacity-100 -translate-x-1 group-hover/link:translate-x-0 transition-all" />
                  </Link>
                  {m.playerLevel && (
                    <span
                      className={cn(
                        "inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md mt-0.5",
                        LEVEL_COLOR[m.playerLevel] ??
                          "bg-foreground/8 text-foreground/40"
                      )}
                    >
                      {LEVEL_LABEL[m.playerLevel] ?? m.playerLevel}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => removeStudent(m.id)}
                  disabled={loadingId === m.id}
                  aria-label="Quitar del grupo"
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive disabled:opacity-40 md:opacity-0 md:group-hover/row:opacity-100"
                >
                  {loadingId === m.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserMinus className="size-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right panel: add students + danger zone */}
      <div className="space-y-4 lg:sticky lg:top-6">
        {/* Add students */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
            <UserPlus className="size-4 text-brand" />
            <h2 className="font-bold text-[13px] text-foreground uppercase tracking-wide">
              Añadir alumno
            </h2>
          </div>

          {available.length > 4 && (
            <div className="px-4 pt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-foreground/30 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar alumno..."
                  className="w-full bg-muted/40 border border-border rounded-xl pl-8 pr-3 py-2 text-[13px] text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/15"
                />
              </div>
            </div>
          )}

          <div className="divide-y divide-border/40 max-h-72 overflow-y-auto mt-2">
            {filteredAvailable.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-muted-foreground italic text-center">
                {available.length === 0
                  ? "Todos tus alumnos ya están en este grupo."
                  : "Sin resultados."}
              </p>
            ) : (
              filteredAvailable.map((s) => (
                <button
                  key={s.id}
                  onClick={() => addStudent(s)}
                  disabled={loadingId === s.id}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand/5 transition-colors disabled:opacity-50 text-left touch-manipulation"
                >
                  <Avatar name={s.name} imageUrl={s.imageUrl} size={30} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">
                      {s.name}
                    </p>
                    {s.playerLevel && (
                      <p className="text-[10px] text-muted-foreground">
                        {LEVEL_LABEL[s.playerLevel] ?? s.playerLevel}
                      </p>
                    )}
                  </div>
                  <div className="size-7 flex items-center justify-center rounded-lg text-brand shrink-0">
                    {loadingId === s.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UserPlus className="size-4" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-card border border-destructive/20 rounded-2xl p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-destructive/50 mb-3">
            Zona de peligro
          </h3>
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-foreground leading-relaxed">
                ¿Eliminar <strong>{groupName}</strong>? Esta acción no se puede
                deshacer.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 text-[13px] text-muted-foreground border border-border px-3 py-2 rounded-xl hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteGroup}
                  disabled={deletingGroup}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-destructive text-destructive-foreground text-[13px] font-semibold px-3 py-2 rounded-xl hover:bg-destructive/90 disabled:opacity-60 transition-colors"
                >
                  {deletingGroup && (
                    <Loader2 className="size-3.5 animate-spin" />
                  )}
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-destructive border border-destructive/30 px-3 py-2 rounded-xl hover:bg-destructive/8 transition-colors"
            >
              <Trash2 className="size-3.5" /> Eliminar grupo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
