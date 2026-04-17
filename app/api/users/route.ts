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
  const supabase = await createClient();

  // After signUp() the session cookie is not yet set, so we also accept a
  // Bearer token that the client passes from the freshly-created session.
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const {
    data: { user },
  } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Only allow a user to create their own profile
  if (parsed.data.id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Derive email from verified server-side identity, not client payload
  if (!user.email || parsed.data.email !== user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db
    .insert(users)
    .values({
      id: parsed.data.id,
      name: parsed.data.name,
      email: user.email,
    })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true }, { status: 201 });
}
