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
          <Link
            href="/sessions/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-black text-brand-foreground transition-colors hover:bg-brand/90"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Añadir sesión</span>
          </Link>
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
            const hasSessions = daySessions.length > 0;

            return (
              <div
                key={idx}
                onClick={() =>
                  isValid &&
                  setSelectedDay(dayNum === selectedDay ? null : dayNum)
                }
                className={cn(
                  "min-h-[78px] border-b border-r border-[#050505]/10 p-2 transition-colors last-of-type:border-r-0 dark:border-white/10 sm:min-h-[108px]",
                  isValid ? "cursor-pointer" : "cursor-default",
                  !isValid && "bg-[#F4F4F1]/70 dark:bg-white/[0.025]",
                  isValid && isPast && !isSelected && "opacity-50",
                  isSelected && "bg-brand/15",
                  isValid && !isSelected && "hover:bg-[#F4F4F1] dark:hover:bg-white/[0.04]",
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
                      {hasSessions && !isToday && (
                        <span className="size-1.5 rounded-full bg-brand" />
                      )}
                    </div>
                    {hasSessions && (
                      <div className="mt-1 space-y-0.5">
                        {daySessions.slice(0, 2).map((s) => (
                          <div
                            key={s.id}
                            className="truncate rounded-full bg-brand/20 px-1.5 py-0.5 text-[10px] font-bold leading-tight text-foreground"
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
          <h3 className="text-lg font-black text-foreground">
            {MONTHS[viewMonth]} {selectedDay}
            {selectedSessions.length === 0 && (
              <span className="ml-2 text-sm font-semibold text-muted-foreground">
                — Sin sesiones
              </span>
            )}
          </h3>
          {selectedSessions.length === 0 ? (
            <div className="tp-panel border-dashed p-6 text-center">
              <p className="mb-3 text-sm text-muted-foreground">
                No hay sesiones este día.
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
              {selectedSessions.map((s) => (
                <div
                  key={s.id}
                  className="tp-panel flex items-center gap-4 p-4"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand/12">
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
                    href={`/sessions/${s.id}`}
                    className="rounded-full border border-brand/30 px-3 py-1.5 text-xs font-black text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
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
