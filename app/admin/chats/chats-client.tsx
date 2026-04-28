"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
  userEmail: string | null;
  messageCount: number;
}

interface Props {
  chats: Chat[];
  total: number;
  page: number;
  totalPages: number;
  q: string;
}

function buildHref(opts: { q?: string; page?: number }) {
  const p = new URLSearchParams();
  if (opts.q) p.set("q", opts.q);
  if (opts.page && opts.page > 1) p.set("page", String(opts.page));
  const qs = p.toString();
  return `/admin/chats${qs ? `?${qs}` : ""}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `hace ${days}d`;
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

export function AdminChatsClient({ chats, total, page, totalPages, q }: Props) {
  const router = useRouter();
  const [searchDraft, setSearchDraft] = useState(q);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildHref({ q: searchDraft, page: 1 }));
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40" />
        <input
          type="text"
          placeholder="Buscar por título, usuario o email…"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-foreground/15 bg-foreground/[0.02] text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-brand/50"
        />
      </form>

      <p className="text-[11px] text-foreground/35 tabular-nums">
        {total.toLocaleString("es-ES")} conversaciones
        {q && ` · filtrando por "${q}"`}
      </p>

      {chats.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 px-4 py-16 text-center text-sm text-foreground/40">
          No hay conversaciones
        </div>
      ) : (
        <div className="rounded-2xl border border-foreground/10 overflow-hidden">
          <div className="divide-y divide-foreground/8">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center gap-4 px-4 py-3 sm:px-5 hover:bg-foreground/[0.02] transition-colors"
              >
                {/* Icon */}
                <div className="shrink-0 flex size-8 items-center justify-center rounded-lg bg-violet-400/10">
                  <MessageSquare className="size-4 text-violet-400" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {chat.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-foreground/40">
                    <User className="size-3 shrink-0" />
                    <span className="truncate">
                      {chat.userName ?? chat.userEmail ?? "Usuario desconocido"}
                    </span>
                    {chat.userEmail && chat.userName && (
                      <>
                        <span className="text-foreground/20">·</span>
                        <span className="truncate font-mono text-[10px]">
                          {chat.userEmail}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] tabular-nums",
                      chat.messageCount > 0
                        ? "bg-foreground/8 text-foreground/60"
                        : "text-foreground/25"
                    )}
                  >
                    {chat.messageCount} msg
                  </span>
                  <span className="font-mono text-[10px] text-foreground/30">
                    {timeAgo(chat.updatedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <footer className="flex items-center justify-between pt-1">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/45 tabular-nums">
            Pág. {page} / {totalPages}
          </p>
          <div className="flex items-center gap-4">
            {page > 1 ? (
              <Link
                href={buildHref({ q, page: page - 1 })}
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
                href={buildHref({ q, page: page + 1 })}
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
    </div>
  );
}
