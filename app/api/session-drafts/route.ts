import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { sessionDrafts } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

const upsertDraftSchema = z.object({
  id: z.string().uuid().optional(),
  payload: z.record(z.unknown()),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drafts = await db
    .select()
    .from(sessionDrafts)
    .where(eq(sessionDrafts.userId, user.id))
    .orderBy(desc(sessionDrafts.updatedAt));

  return NextResponse.json({ data: drafts });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = upsertDraftSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { id, payload } = parsed.data;

  if (id) {
    const [existing] = await db
      .select({ id: sessionDrafts.id, userId: sessionDrafts.userId })
      .from(sessionDrafts)
      .where(eq(sessionDrafts.id, id))
      .limit(1);

    if (existing && existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (existing) {
      const [updated] = await db
        .update(sessionDrafts)
        .set({ payload, updatedAt: new Date() })
        .where(and(eq(sessionDrafts.id, id), eq(sessionDrafts.userId, user.id)))
        .returning();

      return NextResponse.json({ data: updated });
    }

    const [created] = await db
      .insert(sessionDrafts)
      .values({ id, userId: user.id, payload })
      .onConflictDoNothing()
      .returning();

    if (created) return NextResponse.json({ data: created }, { status: 201 });

    const [raced] = await db
      .select({ id: sessionDrafts.id, userId: sessionDrafts.userId })
      .from(sessionDrafts)
      .where(eq(sessionDrafts.id, id))
      .limit(1);

    if (!raced) {
      return NextResponse.json({ error: "Draft conflict" }, { status: 409 });
    }

    if (raced.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updated] = await db
      .update(sessionDrafts)
      .set({ payload, updatedAt: new Date() })
      .where(and(eq(sessionDrafts.id, id), eq(sessionDrafts.userId, user.id)))
      .returning();

    return NextResponse.json({ data: updated });
  }

  // No ID provided — let the DB generate one
  const [created] = await db
    .insert(sessionDrafts)
    .values({ userId: user.id, payload })
    .returning();

  return NextResponse.json({ data: created }, { status: 201 });
}
