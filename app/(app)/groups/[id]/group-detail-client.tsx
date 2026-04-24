"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, UserMinus, Trash2, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Iniciación",
  amateur: "Amateur",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  competitive: "Competitivo",
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

function Initials({ name }: { name: string }) {
  const text = name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <span className="size-8 rounded-full bg-brand/20 text-brand text-[11px] font-bold flex items-center justify-center shrink-0">
      {text}
    </span>
  );
}

export function GroupDetailClient({ groupId, groupName, members, availableStudents }: Props) {
  const router = useRouter();
  const [currentMembers, setCurrentMembers] = useState(members);
  const [available, setAvailable] = useState(availableStudents);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function addStudent(student: Student) {
    setLoadingId(student.id);
    const newMembers = [...currentMembers, student].sort((a, b) => a.name.localeCompare(b.name));
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
      setAvailable((prev) => [...prev, removed].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setLoadingId(null);
  }

  async function deleteGroup() {
    setDeletingGroup(true);
    const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    if (res.ok) { router.push("/groups"); router.refresh(); }
    setDeletingGroup(false);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Members */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Users className="size-4 text-brand" /> Miembros del grupo
          </h2>
          <span className="text-xs text-muted-foreground tabular-nums">{currentMembers.length}</span>
        </div>
        <div className="divide-y divide-border/50">
          {currentMembers.length === 0 ? (
            <p className="px-6 py-6 text-sm text-muted-foreground italic text-center">Sin alumnos todavía.</p>
          ) : (
            currentMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3 group/row hover:bg-muted/30 transition-colors">
                {m.imageUrl
                  ? <img src={m.imageUrl} alt={m.name} className="size-8 rounded-full object-cover shrink-0" />
                  : <Initials name={m.name} />}
                <div className="flex-1 min-w-0">
                  <Link href={`/students/${m.id}`} className="text-sm font-medium text-foreground hover:text-brand transition-colors truncate block">
                    {m.name}
                  </Link>
                  {m.playerLevel && (
                    <p className="text-[10px] text-muted-foreground">{LEVEL_LABEL[m.playerLevel] ?? m.playerLevel}</p>
                  )}
                </div>
                <button
                  onClick={() => removeStudent(m.id)}
                  disabled={loadingId === m.id}
                  aria-label="Quitar del grupo"
                  className="size-8 flex items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover/row:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-40 touch-manipulation"
                >
                  {loadingId === m.id ? <Loader2 className="size-4 animate-spin" /> : <UserMinus className="size-4" />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add students + danger zone */}
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50">
            <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <UserPlus className="size-4 text-brand" /> Añadir alumno
            </h2>
          </div>
          <div className="divide-y divide-border/50 max-h-72 overflow-y-auto">
            {available.length === 0 ? (
              <p className="px-6 py-6 text-sm text-muted-foreground italic text-center">Todos tus alumnos ya están en este grupo.</p>
            ) : (
              available.map((s) => (
                <button
                  key={s.id}
                  onClick={() => addStudent(s)}
                  disabled={loadingId === s.id}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-brand/5 transition-colors disabled:opacity-50 text-left touch-manipulation"
                >
                  {s.imageUrl
                    ? <img src={s.imageUrl} alt={s.name} className="size-8 rounded-full object-cover shrink-0" />
                    : <Initials name={s.name} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                    {s.playerLevel && (
                      <p className="text-[10px] text-muted-foreground">{LEVEL_LABEL[s.playerLevel] ?? s.playerLevel}</p>
                    )}
                  </div>
                  <div className="size-7 flex items-center justify-center rounded-lg text-brand shrink-0">
                    {loadingId === s.id ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-card border border-destructive/20 rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-destructive/70 mb-3">Zona de peligro</h3>
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-foreground">¿Eliminar <strong>{groupName}</strong>? Esta acción no se puede deshacer.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 text-sm text-muted-foreground border border-border px-3 py-2 rounded-xl hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteGroup}
                  disabled={deletingGroup}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-destructive text-destructive-foreground text-sm font-semibold px-3 py-2 rounded-xl hover:bg-destructive/90 disabled:opacity-60 transition-colors"
                >
                  {deletingGroup && <Loader2 className="size-3.5 animate-spin" />}
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive border border-destructive/30 px-3 py-2 rounded-xl hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="size-3.5" /> Eliminar grupo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
