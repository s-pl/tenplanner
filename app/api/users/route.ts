import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";

const bodySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
});

export async function POST(request: Request) {
  // Verify the caller is authenticated as this user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Only allow a user to create their own profile
  if (parsed.data.id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db
    .insert(users)
    .values({
      id: parsed.data.id,
      name: parsed.data.name,
      email: parsed.data.email,
    })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true }, { status: 201 });
}
