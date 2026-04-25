import { and, avg, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { exerciseRatings, exercises } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = z.object({ rating: z.number().int().min(1).max(5) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });

  const [exercise] = await db.select({ id: exercises.id }).from(exercises).where(eq(exercises.id, id)).limit(1);
  if (!exercise) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.insert(exerciseRatings).values({
    userId: user.id,
    exerciseId: id,
    rating: parsed.data.rating,
  }).onConflictDoUpdate({
    target: [exerciseRatings.userId, exerciseRatings.exerciseId],
    set: { rating: parsed.data.rating, updatedAt: new Date() },
  });

  const [stats] = await db
    .select({ avg: avg(exerciseRatings.rating), total: count() })
    .from(exerciseRatings)
    .where(eq(exerciseRatings.exerciseId, id));

  return NextResponse.json({ avg: Number(stats?.avg ?? 0), total: Number(stats?.total ?? 0) });
}

export async function DELETE(_request: Request, context: Context) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  await db.delete(exerciseRatings).where(
    and(eq(exerciseRatings.userId, user.id), eq(exerciseRatings.exerciseId, id))
  );

  const [stats] = await db
    .select({ avg: avg(exerciseRatings.rating), total: count() })
    .from(exerciseRatings)
    .where(eq(exerciseRatings.exerciseId, id));

  return NextResponse.json({ avg: Number(stats?.avg ?? 0), total: Number(stats?.total ?? 0) });
}
