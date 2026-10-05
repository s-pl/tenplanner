"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Copy,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SessionDateDialog,
  type DialogResult,
} from "@/components/app/session-date-dialog";
import {
  EventDialog,
  type CalendarEventData,
} from "@/components/app/event-dialog";
import { DayPdfButton } from "@/components/app/day-pdf-dialog";
import { retitleForDate } from "@/lib/sessions/retitle";
import { cn } from "@/lib/utils";

interface SessionData {
  id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
}

interface CalendarClientProps {
  sessions: SessionData[];
  events?: CalendarEventData[];
}

type DayItem =
  | { kind: "session"; time: Date; session: SessionData }
  | { kind: "event"; time: Date; event: CalendarEventData };

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // 0=Sun, adjust to Mon-start: Mon=0 ... Sun=6
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

export function CalendarClient({
  sessions: initialSessions,
  events: initialEvents = [],
}: CalendarClientProps) {
  const router = useRouter();
  const today = new Date();
  const [sessions, setSessions] = useState(initialSessions);
  const [events, setEvents] = useState(initialEvents);
  const [toDelete, setToDelete] = useState<SessionData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    mode: "move" | "duplicate";
    session: SessionData;
  } | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Eventos (zona azul del calendario, distintos de las sesiones)
  const [eventDialog, setEventDialog] = useState<{
    event: CalendarEventData | null;
  } | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CalendarEventData | null>(
    null
  );
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  function goToPrev() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDay(null);
  }

  function goToNext() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDay(null);
  }

  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDay(today.getDate());
  }

  // Group sessions by day
  const sessionsByDay = new Map<number, SessionData[]>();
  for (const s of sessions) {
    const d = new Date(s.scheduledAt);
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const day = d.getDate();
      if (!sessionsByDay.has(day)) sessionsByDay.set(day, []);
      sessionsByDay.get(day)!.push(s);
    }
  }

  // Group events by day
  const eventsByDay = new Map<number, CalendarEventData[]>();
  for (const e of events) {
    const d = new Date(e.startAt);
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const day = d.getDate();
      if (!eventsByDay.has(day)) eventsByDay.set(day, []);
      eventsByDay.get(day)!.push(e);
    }
  }

  function handleEventSaved(saved: CalendarEventData) {
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === saved.id);
      return exists
        ? prev.map((e) => (e.id === saved.id ? saved : e))
        : [...prev, saved];
    });
    const d = new Date(saved.startAt);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDay(d.getDate());
    setEventError(null);
    router.refresh();
  }

  async function deleteEvent(event: CalendarEventData) {
    setDeletingEventId(event.id);
    setEventError(null);
    try {
      const res = await fetch(`/api/calendar-events/${event.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setEventError("No se pudo eliminar el evento. Inténtalo de nuevo.");
        return;
      }
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      router.refresh();
    } catch {
      setEventError("Error de red. Inténtalo de nuevo.");
    } finally {
      setDeletingEventId(null);
    }
  }

  async function deleteSession(session: SessionData) {
    setDeletingId(session.id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setDeleteError("No se pudo eliminar la sesión. Inténtalo de nuevo.");
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      router.refresh();
    } catch {
      setDeleteError("Error de red. Inténtalo de nuevo.");
    } finally {
      setDeletingId(null);
    }
  }

  // Arrastrar una sesión a otro día: conserva la hora y, si el nombre es un
  // código AAMMDD_Grupo, actualiza la fecha del nombre.
  async function moveSessionToDay(sessionId: string, day: number) {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const old = new Date(session.scheduledAt);
    if (
      old.getFullYear() === viewYear &&
      old.getMonth() === viewMonth &&
      old.getDate() === day
    )
      return;
    const target = new Date(
      viewYear,
      viewMonth,
      day,
      old.getHours(),
      old.getMinutes()
    );
    const newTitle = retitleForDate(session.title, old, target);
    const previous = sessions;
    setActionError(null);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              scheduledAt: target.toISOString(),
              title: newTitle ?? s.title,
            }
          : s
      )
    );
    try {
      const res = await fetch(`/api/sessions/${sessionId}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: target.toISOString(),
          ...(newTitle ? { title: newTitle } : {}),
        }),
      });
      if (!res.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setSessions(previous);
      setActionError("No se pudo mover la sesión. Inténtalo de nuevo.");
    }
  }

  function handleDialogDone(result: DialogResult) {
    if (!dialog) return;
    const original = dialog.session;
    if (dialog.mode === "move") {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === original.id
            ? { ...s, scheduledAt: result.scheduledAt, title: result.title }
            : s
        )
      );
    } else {
      setSessions((prev) => [
        ...prev,
        {
          id: result.id,
          title: result.title,
          scheduledAt: result.scheduledAt,
          durationMinutes: original.durationMinutes,
        },
      ]);
      const d = new Date(result.scheduledAt);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setSelectedDay(d.getDate());
    }
    setActionError(null);
    router.refresh();
  }

  const selectedSessions = selectedDay
    ? (sessionsByDay.get(selectedDay) ?? [])
    : [];
  const selectedEvents = selectedDay
    ? (eventsByDay.get(selectedDay) ?? [])
    : [];
  const selectedDayItems: DayItem[] = [
    ...selectedSessions.map((session) => ({
      kind: "session" as const,
      time: new Date(session.scheduledAt),
      session,
    })),
    ...selectedEvents.map((event) => ({
      kind: "event" as const,
      time: new Date(event.startAt),
      event,
    })),
  ].sort((a, b) => a.time.getTime() - b.time.getTime());

  function defaultDateForNewEvent() {
    if (selectedDay !== null)
      return new Date(viewYear, viewMonth, selectedDay, 9, 0);
    return new Date();
  }

  return (
    <div className="space-y-6">
      {/* Calendar header */}
      <div className="tp-panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <button
            onClick={goToPrev}
            className="flex size-10 items-center justify-center rounded-full border border-[#050505]/10 bg-white transition-colors hover:bg-brand dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-brand dark:hover:text-brand-foreground"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h2 className="min-w-0 flex-1 text-center text-xl font-black text-foreground sm:min-w-[180px] sm:flex-none">
            {MONTHS[viewMonth]} {viewYear}
          </h2>
          <button
            onClick={goToNext}
            className="flex size-10 items-center justify-center rounded-full border border-[#050505]/10 bg-white transition-colors hover:bg-brand dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-brand dark:hover:text-brand-foreground"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <button
            onClick={goToToday}
            className="h-10 rounded-full border border-[#050505]/10 bg-white px-4 text-sm font-black text-foreground/62 transition-colors hover:bg-muted hover:text-foreground dark:border-white/10 dark:bg-white/[0.04]"
          >
            Hoy
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-black text-brand-foreground transition-colors hover:bg-brand/90"
                />
              }
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Añadir</span>
              <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href="/sessions/new" />}>
                <ClipboardList className="size-4" />
                Nueva sesión
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEventDialog({ event: null })}>
                <CalendarDays className="size-4 text-[#2563eb]" />
                Nuevo evento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-[28px] border border-[#050505]/10 bg-white shadow-[0_24px_80px_-60px_rgba(5,5,5,0.7)] dark:border-white/10 dark:bg-[#10100e]">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[#050505]/10 bg-[#F4F4F1] dark:border-white/10 dark:bg-white/[0.04]">
          {DAYS.map((d) => (
            <div
              key={d}
              className="py-3 text-center text-xs font-black uppercase text-foreground/52"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }).map((_, idx) => {
            const dayNum = idx - firstDay + 1;
            const isValid = dayNum >= 1 && dayNum <= daysInMonth;
            const isToday =
              isValid &&
              today.getDate() === dayNum &&
              today.getMonth() === viewMonth &&
              today.getFullYear() === viewYear;
            const isPast =
              isValid &&
              new Date(viewYear, viewMonth, dayNum) <
                new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  today.getDate()
                );
            const isSelected = isValid && selectedDay === dayNum;
            const daySessions = isValid
              ? (sessionsByDay.get(dayNum) ?? [])
              : [];
            const dayEvents = isValid ? (eventsByDay.get(dayNum) ?? []) : [];
            const hasSessions = daySessions.length > 0;
            const dayItems: DayItem[] = [
              ...daySessions.map((session) => ({
                kind: "session" as const,
                time: new Date(session.scheduledAt),
                session,
              })),
              ...dayEvents.map((event) => ({
                kind: "event" as const,
                time: new Date(event.startAt),
                event,
              })),
            ].sort((a, b) => a.time.getTime() - b.time.getTime());
            const hasItems = dayItems.length > 0;

            return (
              <div
                key={idx}
                onClick={() =>
                  isValid &&
                  setSelectedDay(dayNum === selectedDay ? null : dayNum)
                }
                onDragOver={(e) => {
                  if (!isValid) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverDay !== dayNum) setDragOverDay(dayNum);
                }}
                onDragLeave={() => {
                  if (dragOverDay === dayNum) setDragOverDay(null);
                }}
                onDrop={(e) => {
                  if (!isValid) return;
                  e.preventDefault();
                  setDragOverDay(null);
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) void moveSessionToDay(id, dayNum);
                }}
                className={cn(
                  isValid &&
                    dragOverDay === dayNum &&
                    "ring-2 ring-inset ring-brand bg-brand/15",
                  "min-h-[78px] border-b border-r border-[#050505]/10 p-2 transition-colors last-of-type:border-r-0 dark:border-white/10 sm:min-h-[108px]",
                  isValid ? "cursor-pointer" : "cursor-default",
                  !isValid && "bg-[#F4F4F1]/70 dark:bg-white/[0.025]",
                  isValid && isPast && !isSelected && "opacity-50",
                  isSelected && "bg-brand/15",
                  isValid &&
                    !isSelected &&
                    "hover:bg-[#F4F4F1] dark:hover:bg-white/[0.04]",
                  // Remove border on last row
                  idx >= totalCells - 7 && "border-b-0"
                )}
              >
                {isValid && (
                  <>
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full text-sm font-black",
                          isToday && "bg-brand text-brand-foreground",
                          !isToday && isSelected && "text-foreground",
                          !isToday && !isSelected && "text-foreground"
                        )}
                      >
                        {dayNum}
                      </span>
                      {hasItems && !isToday && (
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            hasSessions ? "bg-brand" : "bg-[#2563eb]"
                          )}
                        />
                      )}
                    </div>
                    {hasItems && (
                      <div className="mt-1 space-y-0.5">
                        {dayItems.slice(0, 2).map((item) =>
                          item.kind === "session" ? (
                            <Link
                              key={`s-${item.session.id}`}
                              href={`/sessions/${item.session.id}`}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData(
                                  "text/plain",
                                  item.session.id
                                );
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => setDragOverDay(null)}
                              onClick={(e) => e.stopPropagation()}
                              title={item.session.title}
                              className="block truncate rounded-full bg-brand/20 px-1.5 py-0.5 text-[10px] font-bold leading-tight text-foreground transition-colors hover:bg-brand hover:text-brand-foreground"
                            >
                              {item.session.title}
                            </Link>
                          ) : (
                            <button
                              key={`e-${item.event.id}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEventDialog({ event: item.event });
                              }}
                              title={item.event.title}
                              className="block w-full truncate rounded-full bg-[#2563eb]/15 px-1.5 py-0.5 text-left text-[10px] font-bold leading-tight text-[#1d4ed8] transition-colors hover:bg-[#2563eb] hover:text-white dark:text-[#93b9ff]"
                            >
                              {item.event.title}
                            </button>
                          )
                        )}
                        {dayItems.length > 2 && (
                          <div className="text-[10px] text-muted-foreground px-1.5">
                            +{dayItems.length - 2} más
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day: sessions + events */}
      {selectedDay !== null && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-black text-foreground">
              {MONTHS[viewMonth]} {selectedDay}
              {selectedDayItems.length === 0 && (
                <span className="ml-2 text-sm font-semibold text-muted-foreground">
                  — Sin planes
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <DayPdfButton
                sessions={selectedSessions}
                dayLabel={`${MONTHS[viewMonth].toLowerCase()}-${selectedDay}-${viewYear}`}
              />
              <button
                type="button"
                onClick={() => setEventDialog({ event: null })}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#2563eb]/30 px-3 text-xs font-black text-[#2563eb] transition-colors hover:bg-[#2563eb] hover:text-white"
              >
                <Plus className="size-3.5" />
                Evento
              </button>
            </div>
          </div>
          {selectedDayItems.length === 0 ? (
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
              {selectedDayItems.map((item) =>
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
                      onClick={() =>
                        setDialog({ mode: "move", session: item.session })
                      }
                      aria-label={`Mover ${item.session.title}`}
                      title="Mover a otro día"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <CalendarDays className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDialog({ mode: "duplicate", session: item.session })
                      }
                      aria-label={`Duplicar ${item.session.title}`}
                      title="Duplicar sesión"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Copy className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(item.session)}
                      disabled={deletingId === item.session.id}
                      aria-label={`Eliminar ${item.session.title}`}
                      title="Eliminar sesión"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      {deletingId === item.session.id ? (
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
                        {new Date(item.event.startAt).toLocaleTimeString(
                          "es-ES",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                        {" – "}
                        {new Date(item.event.endAt).toLocaleTimeString(
                          "es-ES",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#2563eb]/15 px-3 py-1.5 text-xs font-black text-[#1d4ed8] dark:text-[#93b9ff]">
                      Evento
                    </span>
                    <button
                      type="button"
                      onClick={() => setEventDialog({ event: item.event })}
                      aria-label={`Editar ${item.event.title}`}
                      title="Editar evento"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventToDelete(item.event)}
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
            <p className="text-sm font-medium text-destructive">
              {deleteError}
            </p>
          )}
          {eventError && (
            <p className="text-sm font-medium text-destructive">{eventError}</p>
          )}
        </div>
      )}

      {actionError && (
        <p className="text-sm font-medium text-destructive">{actionError}</p>
      )}

      {dialog && (
        <SessionDateDialog
          key={`${dialog.mode}-${dialog.session.id}`}
          mode={dialog.mode}
          session={dialog.session}
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          onDone={handleDialogDone}
        />
      )}

      {eventDialog && (
        <EventDialog
          key={eventDialog.event?.id ?? "new"}
          event={eventDialog.event}
          defaultDate={defaultDateForNewEvent()}
          open
          onOpenChange={(open) => {
            if (!open) setEventDialog(null);
          }}
          onSaved={handleEventSaved}
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title="¿Eliminar esta sesión?"
        description={
          toDelete
            ? `“${toDelete.title}” se borrará con su plan de ejercicios y sus notas. Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (toDelete) void deleteSession(toDelete);
        }}
      />

      <ConfirmDialog
        open={eventToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setEventToDelete(null);
        }}
        title="¿Eliminar este evento?"
        description={
          eventToDelete
            ? `“${eventToDelete.title}” se eliminará del calendario. Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (eventToDelete) void deleteEvent(eventToDelete);
        }}
      />
    </div>
  );
}
