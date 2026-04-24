import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { exercises, exerciseFavorites } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(_request: Request, context: RouteContext) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  const [exercise] = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(eq(exercises.id, id))
    .limit(1);
  if (!exercise) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db
    .insert(exerciseFavorites)
    .values({ userId: user.id, exerciseId: id })
    .onConflictDoNothing();

  return NextResponse.json({ favorited: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  await db
    .delete(exerciseFavorites)
    .where(
      and(
        eq(exerciseFavorites.userId, user.id),
        eq(exerciseFavorites.exerciseId, id)
      )
    );

  return NextResponse.json({ favorited: false });
}
