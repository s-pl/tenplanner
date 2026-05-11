import { and, asc, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { getBooleanSetting } from "@/lib/app-settings";
import { createClient } from "@/lib/supabase/server";

function escapeIcsText(value: string | null | undefined) {
  return (value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatIcsDate(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const calendarEnabled = await getBooleanSetting("feature.calendar_enabled");
  if (!calendarEnabled) {
    return NextResponse.json(
      { error: "El calendario está desactivado." },
      { status: 403 }
    );
  }

  const since = new Date();
  since.setMonth(since.getMonth() - 1);

  const rows = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      description: sessions.description,
      objective: sessions.objective,
      scheduledAt: sessions.scheduledAt,
      durationMinutes: sessions.durationMinutes,
      location: sessions.location,
      updatedAt: sessions.updatedAt,
    })
    .from(sessions)
    .where(and(eq(sessions.userId, user.id), gte(sessions.scheduledAt, since)))
    .orderBy(asc(sessions.scheduledAt))
    .limit(1000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TenPlanner//Training Calendar//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const row of rows) {
    const start = new Date(row.scheduledAt);
    const end = new Date(start.getTime() + row.durationMinutes * 60_000);
    const description = [row.objective, row.description]
      .filter(Boolean)
      .join("\n\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${row.id}@tenplanner`,
      `DTSTAMP:${formatIcsDate(row.updatedAt ?? new Date())}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${escapeIcsText(row.title)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      `LOCATION:${escapeIcsText(row.location)}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return new Response(`${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tenplanner-calendar.ics"',
    },
  });
}
