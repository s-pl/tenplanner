import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { sessionLists } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ listId: string }> };

async function getUserAndList(listId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  const [list] = await db
    .select({ id: sessionLists.id, isDefault: sessionLists.isDefault })
    .from(sessionLists)
    .where(and(eq(sessionLists.id, listId), eq(sessionLists.userId, user.id)))
    .limit(1);
  if (!list) return { error: "Not found", status: 404 as const };
  return { user, list };
}

export async function PATCH(request: Request, context: Context) {
  const { listId } = await context.params;
  const found = await getUserAndList(listId);
  if ("error" in found)
    return NextResponse.json({ error: found.error }, { status: found.status });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = z
    .object({
      name: z.string().trim().min(1).max(100).optional(),
      emoji: z.string().max(10).optional(),
    })
    .safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const [updated] = await db
    .update(sessionLists)
    .set({ ...parsed.data })
    .where(eq(sessionLists.id, listId))
    .returning();
  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: Request, context: Context) {
  const { listId } = await context.params;
  const found = await getUserAndList(listId);
  if ("error" in found)
    return NextResponse.json({ error: found.error }, { status: found.status });

  // Las sesiones no se borran: solo la lista (los elementos caen en cascada).
  await db.delete(sessionLists).where(eq(sessionLists.id, listId));
  return NextResponse.json({ ok: true });
}
