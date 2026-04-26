import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessionDrafts } from "@/db/schema";
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

  const { id, payload } = body as { id?: string; payload: Record<string, unknown> };

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "payload is required" }, { status: 400 });
  }

  if (id) {
    // Upsert: create with the client-generated ID if new, update if already exists
    const [upserted] = await db
      .insert(sessionDrafts)
      .values({ id, userId: user.id, payload })
      .onConflictDoUpdate({
        target: sessionDrafts.id,
        set: { payload, updatedAt: new Date() },
      })
      .returning();

    return NextResponse.json({ data: upserted });
  }

  // No ID provided — let the DB generate one
  const [created] = await db
    .insert(sessionDrafts)
    .values({ userId: user.id, payload })
    .returning();

  return NextResponse.json({ data: created }, { status: 201 });
}
