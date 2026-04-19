"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Plus, Sparkles, Trash2, MessageSquare, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    <div className="w-full px-4 md:px-8 py-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/sessions"
          className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-brand/15 border border-brand/20 flex items-center justify-center">
              <Bot className="size-4 text-brand" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Dr. Planner</h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full border border-brand/20">
              <Sparkles className="size-2.5" /> IA
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-10">Asistente de diseño de sesiones de pádel</p>
        </div>
        <button
          onClick={handleNewChat}
          disabled={creating}
          className="flex items-center gap-2 text-sm font-semibold bg-brand text-brand-foreground px-4 py-2.5 rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-50"
        >
          {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Nueva conversación
        </button>
      </div>

      {/* Chat list */}
      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="size-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
            <MessageSquare className="size-6 text-brand" />
          </div>
          <div>
            <p className="font-medium text-foreground">Sin conversaciones todavía</p>
            <p className="text-sm text-muted-foreground mt-1">Inicia una nueva conversación con Dr. Planner</p>
          </div>
          <button
            onClick={handleNewChat}
            disabled={creating}
            className="flex items-center gap-2 text-sm font-semibold bg-brand text-brand-foreground px-4 py-2.5 rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-50"
          >
            {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Nueva conversación
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map(chat => (
            <Link
              key={chat.id}
              href={`/sessions/dr-planner/${chat.id}`}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-brand/30 hover:bg-card/80 transition-all group"
              )}
            >
              <div className="size-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                <Bot className="size-4 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{chat.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatRelative(chat.updatedAt)}</p>
              </div>
              <button
                onClick={e => handleDelete(chat.id, e)}
                disabled={deletingId === chat.id}
                className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
              >
                {deletingId === chat.id
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : <Trash2 className="size-3.5" />}
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
