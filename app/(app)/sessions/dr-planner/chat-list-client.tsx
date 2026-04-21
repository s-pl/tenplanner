"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

interface ChatItem {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(date));
}

export function ChatListClient({ chats: initialChats }: { chats: ChatItem[] }) {
  const router = useRouter();
  const [chats, setChats] = useState(initialChats);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleNewChat() {
    setCreating(true);
    try {
      const res = await fetch("/api/dr-planner/chats", { method: "POST" });
      const { data } = await res.json();
      router.push(`/sessions/dr-planner/${data.id}`);
    } catch {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(id);
    try {
      await fetch(`/api/dr-planner/chats/${id}`, { method: "DELETE" });
      setChats(prev => prev.filter(c => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px calc(100%/12))",
        }}
      />
      <div className="relative px-4 sm:px-6 md:px-10 py-10">
        {/* Masthead */}
        <header className="pb-6 border-b border-foreground/15">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <div className="flex items-baseline gap-3">
              <Link
                href="/sessions"
                className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/45 hover:text-brand transition-colors"
              >
                ← Sesiones
              </Link>
              <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/30">/</span>
              <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/50">
                Dr. Planner · IA
              </p>
            </div>
            <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-foreground/45">
              № {String(chats.length).padStart(3, "0")}
            </p>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-end gap-6">
            <h1 className="font-heading text-4xl md:text-5xl leading-[0.95] tracking-tight text-foreground">
              Conversaciones con el <em className="italic text-brand">doctor</em>.
            </h1>
            <button
              onClick={handleNewChat}
              disabled={creating}
              className="hidden sm:inline-flex items-center gap-2 border border-brand bg-brand text-brand-foreground text-[12px] font-semibold tracking-wide px-4 py-2.5 hover:bg-brand/90 transition-colors shrink-0 uppercase disabled:opacity-50"
            >
              {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" strokeWidth={2} />}
              Nueva conversación
            </button>
          </div>
          <p className="text-[13px] text-foreground/60 mt-4 max-w-2xl">
            Asistente de diseño de sesiones de pádel. Explícale contexto, restricciones y objetivos — él propone la planificación.
          </p>
        </header>

        {/* Body */}
        {chats.length === 0 ? (
          <div className="py-20 text-center border-b border-foreground/15">
            <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/50 mb-4">
              Archivo vacío
            </p>
            <h2 className="font-heading text-3xl text-foreground mb-3">
              Aún no has hablado con <em className="italic text-brand">Dr. Planner</em>.
            </h2>
            <p className="text-[13px] text-foreground/55 max-w-md mx-auto mb-6">
              Inicia una conversación para diseñar tu próxima sesión con la ayuda de la IA.
            </p>
            <button
              onClick={handleNewChat}
              disabled={creating}
              className="inline-flex items-center gap-2 border border-brand bg-brand text-brand-foreground text-[12px] font-semibold tracking-wide px-5 py-2.5 hover:bg-brand/90 transition-colors uppercase disabled:opacity-50"
            >
              {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" strokeWidth={2} />}
              Iniciar conversación
            </button>
          </div>
        ) : (
          <section>
            <div className="grid grid-cols-[auto_1fr_auto] items-baseline gap-3 py-4 border-b border-foreground/15">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
                01
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Historial · ordenadas por última actividad
              </p>
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-foreground/40">
                {chats.length}
              </p>
            </div>
            <ul>
              {chats.map((chat, idx) => (
                <li key={chat.id} className="border-b border-foreground/10 group">
                  <div className="relative">
                    <Link
                      href={`/sessions/dr-planner/${chat.id}`}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-5 py-5 hover:bg-foreground/[0.02] transition-colors px-1"
                    >
                      <span className="font-sans text-[10px] tabular-nums tracking-[0.18em] text-foreground/35 w-8">
                        {String(idx + 1).padStart(3, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="font-heading text-[17px] italic text-foreground truncate group-hover:text-brand transition-colors">
                          {chat.title}
                        </p>
                        <p className="text-[11px] text-foreground/45 mt-0.5 tabular-nums tracking-wide">
                          {formatRelative(chat.updatedAt)}
                        </p>
                      </div>
                      <span className="font-sans text-[11px] tracking-[0.22em] text-foreground/40 group-hover:text-brand transition-colors pr-10">
                        →
                      </span>
                    </Link>
                    <button
                      onClick={e => handleDelete(chat.id, e)}
                      disabled={deletingId === chat.id}
                      className="absolute right-1 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center text-foreground/35 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Eliminar"
                    >
                      {deletingId === chat.id
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : <Trash2 className="size-3.5" strokeWidth={1.6} />}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="pt-8 grid grid-cols-[1fr_auto] items-end gap-4 text-[11px] text-foreground/45">
          <p className="font-heading italic text-[13px] text-foreground/55 max-w-md">
            &ldquo;La mejor sesión empieza con una buena pregunta.&rdquo;
          </p>
          <p className="font-sans tracking-[0.22em] tabular-nums uppercase">
            /tenplanner · IA
          </p>
        </footer>
      </div>
    </div>
  );
}
