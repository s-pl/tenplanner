import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { drPlannerChats } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chats = await db
    .select({
      id: drPlannerChats.id,
      title: drPlannerChats.title,
      createdAt: drPlannerChats.createdAt,
      updatedAt: drPlannerChats.updatedAt,
    })
    .from(drPlannerChats)
    .where(eq(drPlannerChats.userId, user.id))
    .orderBy(desc(drPlannerChats.updatedAt));

  return NextResponse.json({ data: chats });
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [chat] = await db
    .insert(drPlannerChats)
    .values({ userId: user.id })
    .returning({ id: drPlannerChats.id });

  return NextResponse.json({ data: chat }, { status: 201 });
}
