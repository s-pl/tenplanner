import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { sessions as sessionsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
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
    .where(eq(sessionsTable.userId, user.id));

  const serialized = sessions.map((s) => ({
    ...s,
    scheduledAt: s.scheduledAt.toISOString(),
  }));

  return (
    <div className="px-6 md:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Calendar
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Plan and visualise your training schedule
        </p>
      </div>
      <CalendarClient sessions={serialized} />
    </div>
  );
}
