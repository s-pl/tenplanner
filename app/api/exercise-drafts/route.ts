import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { exerciseDrafts } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

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

  const { id, payload } = body as { id?: string; payload: Record<string, unknown> };

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "payload is required" }, { status: 400 });
  }

  if (id) {
    const [updated] = await db
      .update(exerciseDrafts)
      .set({ payload, updatedAt: new Date() })
      .where(eq(exerciseDrafts.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  }

  const [created] = await db
    .insert(exerciseDrafts)
    .values({ userId: user.id, payload })
    .returning();

  return NextResponse.json({ data: created }, { status: 201 });
}
