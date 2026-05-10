import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { sessions as sessionsTable } from "@/db/schema";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { CalendarClient } from "./calendar-client";
import { FeatureLocked } from "@/components/app/feature-locked";
import { getBooleanSetting } from "@/lib/app-settings";
import { Download } from "lucide-react";

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
    <div className="relative">
      <div className="px-4 sm:px-6 md:px-10 py-8 space-y-6">
        <header className="pb-5 border-b border-border">
          <h1 className="font-heading text-3xl font-semibold text-foreground">
            Calendario
          </h1>
          <p className="text-[14px] text-foreground/60 mt-1.5">
            {total} sesión{total !== 1 ? "es" : ""} planificada
            {total !== 1 ? "s" : ""}.
          </p>
        </header>
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <p className="text-foreground/50 text-sm max-w-xs">
              Aún no tienes sesiones planificadas. Crea tu primera sesión para
              verla aquí.
            </p>
            <Link
              href="/sessions/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-brand-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Crear primera sesión
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Link
                href="/api/calendar/ical"
                className="inline-flex items-center gap-2 rounded-lg border border-foreground/15 px-3 py-2 text-xs font-medium text-foreground/55 transition-colors hover:border-brand/40 hover:text-brand"
              >
                <Download className="size-3.5" />
                Exportar iCal
              </Link>
            </div>
            <CalendarClient sessions={serialized} />
          </div>
        )}
      </div>
    </div>
  );
}
