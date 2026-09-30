import { count, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { sessionListItems, sessionLists, sessions } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

const SETUP_MESSAGE =
  "Las listas de sesiones aún no están activadas. Pide al administrador que pulse «Activar sesiones favoritas» en Herramientas.";

// Crea la lista "Favoritas" la primera vez que el monitor usa el botón.
async function ensureDefaultList(userId: string) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(sessionLists)
    .where(eq(sessionLists.userId, userId));
  if (Number(total) === 0) {
    await db
      .insert(sessionLists)
      .values({ userId, name: "Favoritas", emoji: "⭐", isDefault: true });
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const includeSessions =
    request.nextUrl.searchParams.get("includeSessions") === "true";

  try {
    await ensureDefaultList(user.id);

    const lists = await db
      .select({
        id: sessionLists.id,
        name: sessionLists.name,
        emoji: sessionLists.emoji,
        isDefault: sessionLists.isDefault,
        createdAt: sessionLists.createdAt,
      })
      .from(sessionLists)
      .where(eq(sessionLists.userId, user.id))
      .orderBy(desc(sessionLists.isDefault), sessionLists.createdAt);

    const rows = await db
      .select({
        listId: sessionListItems.listId,
        sessionId: sessions.id,
        title: sessions.title,
        scheduledAt: sessions.scheduledAt,
        durationMinutes: sessions.durationMinutes,
        status: sessions.status,
      })
      .from(sessionListItems)
      .innerJoin(sessionLists, eq(sessionLists.id, sessionListItems.listId))
      .innerJoin(sessions, eq(sessions.id, sessionListItems.sessionId))
      .where(eq(sessionLists.userId, user.id))
      .orderBy(desc(sessions.scheduledAt));

    const countMap = new Map<string, number>();
    const itemsMap = new Map<string, typeof rows>();
    const membership = new Set<string>();
    for (const row of rows) {
      countMap.set(row.listId, (countMap.get(row.listId) ?? 0) + 1);
      if (sessionId && row.sessionId === sessionId) membership.add(row.listId);
      if (includeSessions) {
        const current = itemsMap.get(row.listId) ?? [];
        current.push(row);
        itemsMap.set(row.listId, current);
      }
    }

    return NextResponse.json({
      data: lists.map((list) => ({
        ...list,
        itemsCount: countMap.get(list.id) ?? 0,
        containsSession: membership.has(list.id),
        items: includeSessions
          ? (itemsMap.get(list.id) ?? []).map((row) => ({
              id: row.sessionId,
              title: row.title,
              scheduledAt: row.scheduledAt,
              durationMinutes: row.durationMinutes,
              status: row.status,
            }))
          : undefined,
      })),
    });
  } catch (error) {
    console.error("[session-lists] GET failed", error);
    return NextResponse.json(
      { data: [], setupNeeded: true, error: SETUP_MESSAGE },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = z
    .object({
      name: z.string().trim().min(1).max(100),
      emoji: z.string().max(10).optional(),
    })
    .safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  try {
    await ensureDefaultList(user.id);
    const [list] = await db
      .insert(sessionLists)
      .values({
        userId: user.id,
        name: parsed.data.name,
        emoji: parsed.data.emoji ?? "⭐",
      })
      .returning();
    return NextResponse.json({ data: list }, { status: 201 });
  } catch (error) {
    console.error("[session-lists] POST failed", error);
    return NextResponse.json({ error: SETUP_MESSAGE }, { status: 503 });
  }
}
