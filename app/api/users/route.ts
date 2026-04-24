import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { db } from "@/db";
import { users } from "@/db/schema";

const bodySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  city: z.string().max(255).optional().nullable(),
  role: z.enum(["player", "coach", "both"]).optional().nullable(),
  playerLevel: z
    .enum(["beginner", "amateur", "intermediate", "advanced", "competitive"])
    .optional()
    .nullable(),
  yearsExperience: z.number().int().min(0).max(60).optional().nullable(),
  surfacePreference: z
    .enum(["crystal", "turf", "cement", "any"])
    .optional()
    .nullable(),
  goals: z.string().max(2000).optional().nullable(),
});

export async function POST(request: Request) {
  const supabase = await createServerClient();

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
      city: parsed.data.city ?? null,
      role: parsed.data.role ?? null,
      playerLevel: parsed.data.playerLevel ?? null,
      yearsExperience: parsed.data.yearsExperience ?? null,
      surfacePreference: parsed.data.surfacePreference ?? null,
      goals: parsed.data.goals ?? null,
    })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true }, { status: 201 });
}

const patchSchema = z.object({
  image: z.string().max(1000).optional().nullable(),
});

export async function PATCH(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  await db
    .update(users)
    .set({ image: parsed.data.image ?? null })
    .where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/users — GDPR right to erasure.
 *
 * Deletes the public.users row (cascades to sessions, session_exercises,
 * session_students, students, dr_planner_chats, dr_planner_messages) and
 * then deletes the Supabase auth user so the account is fully gone.
 */
export async function DELETE() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Account deletion not configured on the server" },
      { status: 503 }
    );
  }

  try {
    // Delete app data first (FK cascades handle related rows).
    await db.delete(users).where(eq(users.id, user.id));

    // Then delete the auth identity via the service-role admin client.
    const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("Supabase auth admin.deleteUser failed", {
        userId: user.id,
        error,
      });
      return NextResponse.json(
        { error: "Failed to delete auth user" },
        { status: 500 }
      );
    }

    // Best-effort: sign the caller out by clearing the session cookie.
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Account deletion failed", { userId: user.id, error });
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
