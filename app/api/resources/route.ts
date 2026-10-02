import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  title: z.string().trim().min(1, "Título obligatorio").max(255),
  description: z.string().trim().max(4000).optional().nullable(),
  url: z
    .string()
    .trim()
    .url("Enlace no válido")
    .max(2000)
    .optional()
    .nullable(),
  documentUrl: z.string().trim().url().max(2000).optional().nullable(),
  documentName: z.string().trim().max(255).optional().nullable(),
  imageUrl: z.string().trim().url().max(2000).optional().nullable(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(resources)
    .where(eq(resources.userId, user.id))
    .orderBy(desc(resources.createdAt));

  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  const supabase = await createClient();
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 }
    );

  const [created] = await db
    .insert(resources)
    .values({
      userId: user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      url: parsed.data.url ?? null,
      documentUrl: parsed.data.documentUrl ?? null,
      documentName: parsed.data.documentName ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
    })
    .returning();

  return NextResponse.json({ data: created }, { status: 201 });
}
