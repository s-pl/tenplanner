import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { places } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
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

  try {
    const [updated] = await db
      .update(places)
      .set({
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description }
          : {}),
      })
      .where(and(eq(places.id, id), eq(places.coachId, user.id)))
      .returning();

    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("places_coach_name_uniq")) {
      return NextResponse.json(
        { error: "Ya tienes un lugar con ese nombre." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
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
    .delete(places)
    .where(and(eq(places.id, id), eq(places.coachId, user.id)))
    .returning({ id: places.id });

  if (!deleted)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
