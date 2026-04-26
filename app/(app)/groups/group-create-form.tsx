"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";

export function GroupCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
    });
    setSaving(false);
    if (!res.ok) { setError("No se pudo crear el grupo."); return; }
    const { data } = await res.json();
    router.push(`/groups/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/40">
          Nombre <span className="text-brand">*</span>
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Grupo Martes tarde"
          maxLength={255}
          required
          className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-colors"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/40">
          Descripción <span className="text-foreground/25 normal-case font-normal">opcional</span>
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Nivel, horario, pista..."
          maxLength={255}
          className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-colors"
        />
      </div>
      {error && (
        <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand text-brand-foreground text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Users className="size-4" />}
        Crear grupo
      </button>
    </form>
  );
}
