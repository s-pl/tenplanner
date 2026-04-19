"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";

export type UpcomingItem = {
  ssId: string;
  sessionId: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
};

const PAGE_SIZE = 5;

export function UpcomingList({ items }: { items: UpcomingItem[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin sesiones futuras asignadas.</p>;
  }

  const shown = items.slice(0, visible);
  const hasMore = visible < items.length;

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat("es-ES", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));

  return (
    <div className="space-y-2">
      {shown.map((s) => (
        <Link
          key={s.ssId}
          href={`/sessions/${s.sessionId}`}
          className="group flex items-center gap-3 p-3 rounded-xl border border-border hover:border-brand/40 hover:bg-brand/5 transition-colors"
        >
          <div className="size-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
            <Calendar className="size-4 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate group-hover:text-brand transition-colors">{s.title}</p>
            <p className="text-xs text-muted-foreground">{fmtDate(s.scheduledAt)} · {s.durationMinutes} min</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        </Link>
      ))}

      {hasMore && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="w-full text-xs font-semibold text-muted-foreground hover:text-brand border border-border hover:border-brand/30 rounded-lg py-2 transition-colors"
        >
          Ver {Math.min(PAGE_SIZE, items.length - visible)} más · {items.length - visible} restantes
        </button>
      )}
      {!hasMore && items.length > PAGE_SIZE && (
        <button
          type="button"
          onClick={() => setVisible(PAGE_SIZE)}
          className="w-full text-xs text-muted-foreground hover:text-foreground py-1 transition-colors"
        >
          Mostrar menos
        </button>
      )}
    </div>
  );
}
