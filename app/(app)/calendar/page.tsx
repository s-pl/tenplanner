import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { sessions as sessionsTable } from "@/db/schema";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { CalendarClient } from "./calendar-client";

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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px calc(100%/12))",
        }}
      />
      <div className="relative px-4 sm:px-6 md:px-10 py-10 space-y-8">
        <header className="pb-6 border-b border-foreground/15">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/50">
              Agenda · Calendario
            </p>
            <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-foreground/45">
              № {String(total).padStart(3, "0")}
            </p>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl leading-[0.95] tracking-tight text-foreground">
            Tu <em className="italic text-brand">calendario</em>,
            <br />
            de un vistazo.
          </h1>
          <p className="text-[13px] text-foreground/60 mt-4 max-w-2xl">
            {total} sesión{total !== 1 ? "es" : ""} planificada
            {total !== 1 ? "s" : ""} · navega por semana o mes y revisa qué
            viene.
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
          <CalendarClient sessions={serialized} />
        )}
      </div>
    </div>
  );
}
