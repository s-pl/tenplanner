import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { sessions as sessionsTable } from "@/db/schema";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { CalendarClient } from "./calendar-client";
import { FeatureLocked } from "@/components/app/feature-locked";
import { getBooleanSetting } from "@/lib/app-settings";
import { CalendarDays, Download, Plus } from "lucide-react";

// Sessions loaded into the calendar are limited to this window to keep
// initial payload bounded. User can navigate the UI within this range.
const WINDOW_PAST_DAYS = 90;
const WINDOW_FUTURE_DAYS = 365;
const MAX_SESSIONS = 1000;

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const calendarEnabled = await getBooleanSetting("feature.calendar_enabled");
  if (!calendarEnabled) {
    return (
      <FeatureLocked
        title="Calendario desactivado"
        description="El administrador ha pausado temporalmente la vista de calendario."
        href="/sessions"
        cta="Volver a sesiones"
      />
    );
  }

  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(now.getDate() - WINDOW_PAST_DAYS);
  const windowEnd = new Date(now);
  windowEnd.setDate(now.getDate() + WINDOW_FUTURE_DAYS);

  const sessions = await db
    .select({
      id: sessionsTable.id,
      title: sessionsTable.title,
      scheduledAt: sessionsTable.scheduledAt,
      durationMinutes: sessionsTable.durationMinutes,
      status: sessionsTable.status,
    })
    .from(sessionsTable)
    .where(
      and(
        eq(sessionsTable.userId, user.id),
        gte(sessionsTable.scheduledAt, windowStart),
        lte(sessionsTable.scheduledAt, windowEnd)
      )
    )
    .orderBy(asc(sessionsTable.scheduledAt))
    .limit(MAX_SESSIONS);

  const serialized = sessions.map((s) => ({
    ...s,
    scheduledAt: s.scheduledAt.toISOString(),
  }));

  const total = serialized.length;

  return (
    <div className="tp-page">
      <div className="tp-page-pad space-y-6">
        <header className="tp-hero-panel flex flex-col gap-6 p-6 text-white sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#D6FF38] px-3 py-1 text-[11px] font-black uppercase text-[#050505]">
              <CalendarDays className="size-3.5" />
              Agenda operativa
            </div>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">
              Calendario
            </h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/62">
              {total} sesión{total !== 1 ? "es" : ""} planificada
              {total !== 1 ? "s" : ""} dentro de la ventana activa.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/api/calendar/ical"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/14 px-4 text-sm font-black text-white transition-colors hover:border-[#D6FF38] hover:text-[#D6FF38]"
            >
              <Download className="size-4" />
              Exportar iCal
            </Link>
            <Link
              href="/sessions/new"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#D6FF38] px-4 text-sm font-black text-[#050505] transition-transform hover:-translate-y-0.5"
            >
              <Plus className="size-4" />
              Nueva sesión
            </Link>
          </div>
        </header>
        {total === 0 ? (
          <div className="tp-panel flex flex-col items-center justify-center gap-4 border-dashed py-20 text-center">
            <p className="max-w-xs text-sm leading-6 text-foreground/55">
              Aún no tienes sesiones planificadas. Crea tu primera sesión para
              verla aquí.
            </p>
            <Link
              href="/sessions/new"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-4 text-sm font-black text-brand-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" />
              Crear primera sesión
            </Link>
          </div>
        ) : (
          <CalendarClient sessions={serialized} />
        )}
      </div>
    </div>
  );
}
