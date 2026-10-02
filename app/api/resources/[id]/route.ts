import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  url: z.string().trim().url().max(2000).nullable().optional(),
  documentUrl: z.string().trim().url().max(2000).nullable().optional(),
  documentName: z.string().trim().max(255).nullable().optional(),
  imageUrl: z.string().trim().url().max(2000).nullable().optional(),
  isFavorite: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 }
    );

  const { title, description, url, documentUrl, documentName, imageUrl, isFavorite } =
    parsed.data;

  const [updated] = await db
    .update(resources)
    .set({
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(url !== undefined ? { url } : {}),
      ...(documentUrl !== undefined ? { documentUrl } : {}),
      ...(documentName !== undefined ? { documentName } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(isFavorite !== undefined ? { isFavorite } : {}),
    })
    .where(and(eq(resources.id, id), eq(resources.userId, user.id)))
    .returning();

  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const [deleted] = await db
    .delete(resources)
    .where(and(eq(resources.id, id), eq(resources.userId, user.id)))
    .returning({ id: resources.id });

  if (!deleted)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
