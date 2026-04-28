import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { exerciseDrafts } from "@/db/schema";
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
    .from(exerciseDrafts)
    .where(eq(exerciseDrafts.userId, user.id))
    .orderBy(desc(exerciseDrafts.updatedAt));

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
      .select({ id: exerciseDrafts.id, userId: exerciseDrafts.userId })
      .from(exerciseDrafts)
      .where(eq(exerciseDrafts.id, id))
      .limit(1);

    if (existing && existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (existing) {
      const [updated] = await db
        .update(exerciseDrafts)
        .set({ payload, updatedAt: new Date() })
        .where(
          and(eq(exerciseDrafts.id, id), eq(exerciseDrafts.userId, user.id))
        )
        .returning();

      return NextResponse.json({ data: updated });
    }

    const [created] = await db
      .insert(exerciseDrafts)
      .values({ id, userId: user.id, payload })
      .onConflictDoNothing()
      .returning();

    if (created) return NextResponse.json({ data: created }, { status: 201 });

    const [raced] = await db
      .select({ id: exerciseDrafts.id, userId: exerciseDrafts.userId })
      .from(exerciseDrafts)
      .where(eq(exerciseDrafts.id, id))
      .limit(1);

    if (!raced) {
      return NextResponse.json({ error: "Draft conflict" }, { status: 409 });
    }

    if (raced.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updated] = await db
      .update(exerciseDrafts)
      .set({ payload, updatedAt: new Date() })
      .where(and(eq(exerciseDrafts.id, id), eq(exerciseDrafts.userId, user.id)))
      .returning();

    return NextResponse.json({ data: updated });
  }

  const [created] = await db
    .insert(exerciseDrafts)
    .values({ userId: user.id, payload })
    .returning();

  return NextResponse.json({ data: created }, { status: 201 });
}
