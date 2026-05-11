import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { classLists } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ listId: string }> };

const paramsSchema = z.object({
  listId: z.string().uuid(),
});

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  emoji: z.string().max(10).optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success)
    return NextResponse.json({ error: "Invalid list id" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsedBody = updateSchema.safeParse(body);
  if (!parsedBody.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const [updated] = await db
    .update(classLists)
    .set(parsedBody.data)
    .where(
      and(
        eq(classLists.id, parsedParams.data.listId),
        eq(classLists.userId, user.id)
      )
    )
    .returning();

  if (!updated)
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success)
    return NextResponse.json({ error: "Invalid list id" }, { status: 400 });

  const [deleted] = await db
    .delete(classLists)
    .where(
      and(
        eq(classLists.id, parsedParams.data.listId),
        eq(classLists.userId, user.id)
      )
    )
    .returning({ id: classLists.id });

  if (!deleted)
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
