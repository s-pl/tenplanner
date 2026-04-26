import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { exerciseDrafts } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db
    .delete(exerciseDrafts)
    .where(and(eq(exerciseDrafts.id, id), eq(exerciseDrafts.userId, user.id)));

  return new NextResponse(null, { status: 204 });
}
