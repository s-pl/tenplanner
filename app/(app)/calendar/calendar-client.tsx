"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionData {
  id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
}

interface CalendarClientProps {
  sessions: SessionData[];
}

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

export function CalendarClient({ sessions }: CalendarClientProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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

  const selectedSessions = selectedDay
    ? (sessionsByDay.get(selectedDay) ?? [])
    : [];

  return (
    <div className="space-y-6">
      {/* Calendar header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrev}
            className="size-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h2 className="font-heading text-xl font-bold text-foreground min-w-[180px] text-center">
            {MONTHS[viewMonth]} {viewYear}
          </h2>
          <button
            onClick={goToNext}
            className="size-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="text-sm font-medium text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            Hoy
          </button>
          <Link
            href="/sessions/new"
            className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-brand/90 transition-colors"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Añadir sesión</span>
          </Link>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map((d) => (
            <div
              key={d}
              className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide"
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
            const hasSessions = daySessions.length > 0;

            return (
              <div
                key={idx}
                onClick={() =>
                  isValid &&
                  setSelectedDay(dayNum === selectedDay ? null : dayNum)
                }
                className={cn(
                  "min-h-[72px] p-2 border-b border-r border-border/50 last-of-type:border-r-0 transition-colors",
                  isValid ? "cursor-pointer" : "cursor-default",
                  !isValid && "bg-muted/20",
                  isValid && isPast && !isSelected && "opacity-50",
                  isSelected && "bg-brand/10",
                  isValid && !isSelected && "hover:bg-muted/50",
                  // Remove border on last row
                  idx >= totalCells - 7 && "border-b-0"
                )}
              >
                {isValid && (
                  <>
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "size-7 flex items-center justify-center rounded-full text-sm font-medium",
                          isToday && "bg-brand text-brand-foreground font-bold",
                          !isToday && isSelected && "text-brand font-semibold",
                          !isToday && !isSelected && "text-foreground"
                        )}
                      >
                        {dayNum}
                      </span>
                      {hasSessions && !isToday && (
                        <span className="size-1.5 rounded-full bg-brand" />
                      )}
                    </div>
                    {hasSessions && (
                      <div className="mt-1 space-y-0.5">
                        {daySessions.slice(0, 2).map((s) => (
                          <div
                            key={s.id}
                            className="text-[10px] leading-tight px-1.5 py-0.5 rounded bg-brand/15 text-brand truncate"
                          >
                            {s.title}
                          </div>
                        ))}
                        {daySessions.length > 2 && (
                          <div className="text-[10px] text-muted-foreground px-1.5">
                            +{daySessions.length - 2} más
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

      {/* Selected day sessions */}
      {selectedDay !== null && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">
            {MONTHS[viewMonth]} {selectedDay}
            {selectedSessions.length === 0 && (
              <span className="text-muted-foreground font-normal text-sm ml-2">
                — Sin sesiones
              </span>
            )}
          </h3>
          {selectedSessions.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                No hay sesiones este día.
              </p>
              <Link
                href="/sessions/new"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand/80 transition-colors"
              >
                <Plus className="size-4" />
                Planificar una sesión
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedSessions.map((s) => (
                <div
                  key={s.id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="size-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                    <span className="text-brand font-bold text-sm">
                      {new Date(s.scheduledAt)
                        .getHours()
                        .toString()
                        .padStart(2, "0")}
                      <span className="text-brand/60 text-xs">h</span>
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">
                      {s.title}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="size-3" />
                      {s.durationMinutes} min
                    </p>
                  </div>
                  <Link
                    href="/sessions"
                    className="text-xs font-medium text-brand hover:text-brand/80 transition-colors"
                  >
                    Ver
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
