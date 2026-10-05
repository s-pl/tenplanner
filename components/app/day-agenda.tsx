"use client";

import Link from "next/link";
import {
  CalendarDays,
  Clock,
  Copy,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { DayPdfButton } from "@/components/app/day-pdf-dialog";
import type { CalendarEventData } from "@/components/app/event-dialog";

export interface AgendaSession {
  id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
}

export type DayItem =
  | { kind: "session"; time: Date; session: AgendaSession }
  | { kind: "event"; time: Date; event: CalendarEventData };

/**
 * Lista de sesiones + eventos de un día, con las acciones habituales
 * (ver, mover, duplicar, eliminar / editar evento) y el botón para
 * generar el PDF de las sesiones de ese día. Se usa tanto en el panel
 * de día seleccionado de la vista mensual como en la vista diaria.
 */
export function DayAgenda({
  title,
  items,
  sessionsForPdf,
  pdfDayLabel,
  onAddEvent,
  onMoveSession,
  onDuplicateSession,
  onDeleteSession,
  deletingSessionId,
  onEditEvent,
  onDeleteEvent,
  deletingEventId,
  deleteError,
  eventError,
}: {
  title: React.ReactNode;
  items: DayItem[];
  sessionsForPdf: AgendaSession[];
  pdfDayLabel: string;
  onAddEvent: () => void;
  onMoveSession: (session: AgendaSession) => void;
  onDuplicateSession: (session: AgendaSession) => void;
  onDeleteSession: (session: AgendaSession) => void;
  deletingSessionId: string | null;
  onEditEvent: (event: CalendarEventData) => void;
  onDeleteEvent: (event: CalendarEventData) => void;
  deletingEventId: string | null;
  deleteError: string | null;
  eventError: string | null;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-foreground">
          {title}
          {items.length === 0 && (
            <span className="ml-2 text-sm font-semibold text-muted-foreground">
              — Sin planes
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <DayPdfButton sessions={sessionsForPdf} dayLabel={pdfDayLabel} />
          <button
            type="button"
            onClick={onAddEvent}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#2563eb]/30 px-3 text-xs font-black text-[#2563eb] transition-colors hover:bg-[#2563eb] hover:text-white"
          >
            <Plus className="size-3.5" />
            Evento
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="tp-panel border-dashed p-6 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            No hay sesiones ni eventos este día.
          </p>
          <Link
            href="/sessions/new"
            className="inline-flex items-center gap-1.5 text-sm font-black text-brand transition-colors hover:text-brand/80"
          >
            <Plus className="size-4" />
            Planificar una sesión
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) =>
            item.kind === "session" ? (
              <div
                key={`s-${item.session.id}`}
                className="tp-panel flex items-center gap-4 p-4"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand/12">
                  <span className="text-brand font-bold text-sm">
                    {new Date(item.session.scheduledAt)
                      .getHours()
                      .toString()
                      .padStart(2, "0")}
                    <span className="text-brand/60 text-xs">h</span>
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/sessions/${item.session.id}`}
                    className="block truncate text-sm font-medium text-foreground hover:text-brand"
                  >
                    {item.session.title}
                  </Link>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="size-3" />
                    {item.session.durationMinutes} min
                  </p>
                </div>
                <Link
                  href={`/sessions/${item.session.id}`}
                  className="rounded-full border border-brand/30 px-3 py-1.5 text-xs font-black text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
                >
                  Ver
                </Link>
                <button
                  type="button"
                  onClick={() => onMoveSession(item.session)}
                  aria-label={`Mover ${item.session.title}`}
                  title="Mover a otro día"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <CalendarDays className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicateSession(item.session)}
                  aria-label={`Duplicar ${item.session.title}`}
                  title="Duplicar sesión"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Copy className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSession(item.session)}
                  disabled={deletingSessionId === item.session.id}
                  aria-label={`Eliminar ${item.session.title}`}
                  title="Eliminar sesión"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  {deletingSessionId === item.session.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </div>
            ) : (
              <div
                key={`e-${item.event.id}`}
                className="tp-panel flex items-center gap-4 border-[#2563eb]/25 bg-[#2563eb]/[0.04] p-4"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#2563eb]/15">
                  <span className="text-[#1d4ed8] font-bold text-sm dark:text-[#93b9ff]">
                    {new Date(item.event.startAt)
                      .getHours()
                      .toString()
                      .padStart(2, "0")}
                    <span className="text-[#2563eb]/60 text-xs">h</span>
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.event.title}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="size-3" />
                    {new Date(item.event.startAt).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" – "}
                    {new Date(item.event.endAt).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="rounded-full bg-[#2563eb]/15 px-3 py-1.5 text-xs font-black text-[#1d4ed8] dark:text-[#93b9ff]">
                  Evento
                </span>
                <button
                  type="button"
                  onClick={() => onEditEvent(item.event)}
                  aria-label={`Editar ${item.event.title}`}
                  title="Editar evento"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteEvent(item.event)}
                  disabled={deletingEventId === item.event.id}
                  aria-label={`Eliminar ${item.event.title}`}
                  title="Eliminar evento"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  {deletingEventId === item.event.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </div>
            )
          )}
        </div>
      )}

      {deleteError && (
        <p className="text-sm font-medium text-destructive">{deleteError}</p>
      )}
      {eventError && (
        <p className="text-sm font-medium text-destructive">{eventError}</p>
      )}
    </div>
  );
}
