import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { calendarEvents } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { canTagWithClub } from "@/lib/clubs";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  clubId: z.string().uuid().nullable().optional(),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 }
    );

  const startAt = parsed.data.startAt ? new Date(parsed.data.startAt) : null;
  const endAt = parsed.data.endAt ? new Date(parsed.data.endAt) : null;
  if (startAt && endAt && endAt < startAt) {
    return NextResponse.json(
      { error: "La fecha de finalización debe ser posterior a la de inicio" },
      { status: 422 }
    );
  }

  if (
    parsed.data.clubId &&
    !(await canTagWithClub(user.id, parsed.data.clubId))
  ) {
    return NextResponse.json(
      { error: "No perteneces a ese club." },
      { status: 403 }
    );
  }

  const [updated] = await db
    .update(calendarEvents)
    .set({
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.description !== undefined
        ? { description: parsed.data.description }
        : {}),
      ...(startAt ? { startAt } : {}),
      ...(endAt ? { endAt } : {}),
      ...(parsed.data.clubId !== undefined
        ? { clubId: parsed.data.clubId }
        : {}),
    })
    .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, user.id)))
    .returning();

  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const [deleted] = await db
    .delete(calendarEvents)
    .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, user.id)))
    .returning({ id: calendarEvents.id });

  if (!deleted)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
