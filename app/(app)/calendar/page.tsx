import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { sessions as sessionsTable } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { CalendarClient } from "./calendar-client";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const sessions = await db
    .select({
      id: sessionsTable.id,
      title: sessionsTable.title,
      scheduledAt: sessionsTable.scheduledAt,
      durationMinutes: sessionsTable.durationMinutes,
    })
    .from(sessionsTable)
    .where(eq(sessionsTable.userId, user.id))
    .orderBy(asc(sessionsTable.scheduledAt));

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
        <CalendarClient sessions={serialized} />
      </div>
    </div>
  );
}
