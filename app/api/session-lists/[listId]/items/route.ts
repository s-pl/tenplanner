import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { sessionListItems, sessionLists, sessions } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ listId: string }> };

async function authorize(listId: string, body: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };

  const parsed = z.object({ sessionId: z.string().uuid() }).safeParse(body);
  if (!parsed.success) return { error: "Invalid data", status: 400 };

  const [list] = await db
    .select({ id: sessionLists.id })
    .from(sessionLists)
    .where(and(eq(sessionLists.id, listId), eq(sessionLists.userId, user.id)))
    .limit(1);
  if (!list) return { error: "Forbidden", status: 403 };

  const [session] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(eq(sessions.id, parsed.data.sessionId), eq(sessions.userId, user.id))
    )
    .limit(1);
  if (!session) return { error: "Session not found", status: 404 };

  return { sessionId: parsed.data.sessionId };
}

async function readBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: Request, context: Context) {
  const { listId } = await context.params;
  const result = await authorize(listId, await readBody(request));
  if ("error" in result)
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );

  await db
    .insert(sessionListItems)
    .values({ listId, sessionId: result.sessionId })
    .onConflictDoNothing();
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request, context: Context) {
  const { listId } = await context.params;
  const result = await authorize(listId, await readBody(request));
  if ("error" in result)
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );

  await db
    .delete(sessionListItems)
    .where(
      and(
        eq(sessionListItems.listId, listId),
        eq(sessionListItems.sessionId, result.sessionId)
      )
    );
  return NextResponse.json({ ok: true });
}
