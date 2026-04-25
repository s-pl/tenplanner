import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { landingContent, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [row] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, user.id)).limit(1);
  return row?.isAdmin ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db.select().from(landingContent);
  return NextResponse.json({ data: rows });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = z.object({
    key: z.string().min(1).max(80),
    value: z.unknown(),
  }).safeParse(body);

  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  await db
    .insert(landingContent)
    .values({
      key: parsed.data.key,
      value: parsed.data.value,
      updatedBy: admin.id,
    })
    .onConflictDoUpdate({
      target: landingContent.key,
      set: {
        value: parsed.data.value,
        updatedAt: new Date(),
        updatedBy: admin.id,
      },
    });

  revalidateTag("landing", "max");

  return NextResponse.json({ ok: true });
}
